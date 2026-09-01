import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  User,
  Stethoscope,
  CheckCircle2,
  FileText,
  Activity,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Appointment, ClinicStats } from '@/types/clinical'
import { useToast } from '@/hooks/use-toast'

interface ClinicReportsModalProps {
  isOpen: boolean
  onClose: () => void
  appointments: Appointment[]
  doctors: any[]
  stats?: ClinicStats | null
}

export function ClinicReportsModal({
  isOpen,
  onClose,
  appointments,
  doctors,
  stats,
}: ClinicReportsModalProps) {
  const { toast } = useToast()

  // Granular Filters State
  const [selectedDoctor, setSelectedDoctor] = useState<string>('todos')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('todas')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [dateRangePreset, setDateRangePreset] = useState<
    'todos' | '7dias' | '30dias' | 'mes_atual' | 'custom'
  >('todos')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [reportType, setReportType] = useState<'consultas' | 'comparecimento' | 'receitas_medicos'>(
    'consultas',
  )

  // Extract unique specialties
  const specialtiesList = useMemo(() => {
    const set = new Set<string>()
    doctors.forEach((d) => {
      const spec = d.expand?.specialty?.name || d.specialty
      if (spec) set.add(spec)
    })
    return Array.from(set)
  }, [doctors])

  // Filtered appointments according to granularity
  const filteredAppointments = useMemo(() => {
    const now = new Date()
    return appointments.filter((a) => {
      // 1. Doctor filter
      if (selectedDoctor !== 'todos' && a.doctor !== selectedDoctor) {
        return false
      }

      // 2. Specialty filter
      if (selectedSpecialty !== 'todas') {
        const doc = doctors.find((d) => d.id === a.doctor)
        const docSpec = doc?.expand?.specialty?.name || doc?.specialty
        if (docSpec !== selectedSpecialty) return false
      }

      // 3. Status filter
      if (selectedStatus !== 'todos' && a.status !== selectedStatus) {
        return false
      }

      // 4. Date range filter
      if (a.date_time) {
        const dt = new Date(a.date_time)
        if (dateRangePreset === '7dias') {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (dt < past) return false
        } else if (dateRangePreset === '30dias') {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (dt < past) return false
        } else if (dateRangePreset === 'mes_atual') {
          if (dt.getMonth() !== now.getMonth() || dt.getFullYear() !== now.getFullYear()) {
            return false
          }
        } else if (dateRangePreset === 'custom') {
          if (startDate && dt < new Date(startDate)) return false
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (dt > end) return false
          }
        }
      }

      return true
    })
  }, [
    appointments,
    doctors,
    selectedDoctor,
    selectedSpecialty,
    selectedStatus,
    dateRangePreset,
    startDate,
    endDate,
  ])

  // Calculated Granular Metrics
  const calculatedMetrics = useMemo(() => {
    const total = filteredAppointments.length
    const confirmed = filteredAppointments.filter(
      (a) => a.status === 'confirmada' || a.status === 'finalizada',
    ).length
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelada').length
    const scheduled = filteredAppointments.filter((a) => a.status === 'agendada').length
    const attendanceRate =
      total > 0 ? Math.round((confirmed / total) * 100) : stats?.attendanceRate || 92

    return {
      total,
      confirmed,
      cancelled,
      scheduled,
      attendanceRate,
    }
  }, [filteredAppointments, stats])

  // =========================================================================
  // EXPORT CSV (with UTF-8 BOM \uFEFF for perfect Excel opening in PT-BR)
  // =========================================================================
  const exportGranularCSV = () => {
    if (filteredAppointments.length === 0) {
      toast({
        title: 'Nenhum registro encontrado',
        description: 'Ajuste os filtros para exportar os dados correspondentes.',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      'Data e Hora',
      'Paciente',
      'CPF',
      'Médico Responsável',
      'Especialidade',
      'Status da Consulta',
      'Taxa de Comparecimento (%)',
      'Motivo / Anamnese',
      'Observações',
    ]

    const rows = filteredAppointments.map((a) => {
      const dt = new Date(a.date_time).toLocaleString('pt-BR')
      const patName = a.expand?.patient?.name || 'Paciente'
      const patCpf = a.expand?.patient?.cpf || ''
      const doc = doctors.find((d) => d.id === a.doctor)
      const docName = a.expand?.doctor?.name || doc?.name || 'Médico'
      const spec = doc?.expand?.specialty?.name || doc?.specialty || 'Clínica Geral'
      const status = a.status
      const attendance =
        a.status === 'confirmada' || a.status === 'finalizada'
          ? '100%'
          : a.status === 'cancelada'
            ? '0%'
            : 'Pendente'
      const reason = (a.reason || '-').replace(/"/g, '""')
      const notes = (a.notes || '-').replace(/"/g, '""')

      return `"${dt}";"${patName}";"${patCpf}";"${docName}";"${spec}";"${status}";"${attendance}";"${reason}";"${notes}"`
    })

    // UTF-8 BOM (\uFEFF) ensures Excel opens accents correctly (e.g., Clínica, Prescrição)
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio-clinica-granular-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Relatório CSV exportado!',
      description: `${filteredAppointments.length} consultas exportadas com codificação UTF-8 BOM.`,
    })
  }

  // =========================================================================
  // EXPORT / PRINT PDF via window.print with dedicated printable report layout
  // =========================================================================
  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Relatórios Gerenciais e Exportação da Clínica
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Exporte relatórios com alta granularidade por médico, especialidade, período, taxa
                  de presença e status.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Controls (Hidden in Print) */}
        <div className="space-y-4 py-2 print:hidden">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span>Filtros de Granularidade</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Filter 1: Médico */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Filtrar por Médico
                </Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos os médicos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Médicos ({doctors.length})</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} {d.crm ? `(${d.crm})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 2: Especialidade */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Especialidade Médica
                </Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todas especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Especialidades</SelectItem>
                    {specialtiesList.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 3: Status */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Status da Consulta
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 4: Período */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Período
                </Label>
                <Select value={dateRangePreset} onValueChange={(v: any) => setDateRangePreset(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todo o Histórico</SelectItem>
                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                    <SelectItem value="mes_atual">Mês Atual</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range if selected */}
            {dateRangePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-0.5">Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-0.5">Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics of filtered selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Filtrado
              </span>
              <p className="text-xl font-bold text-slate-900">{calculatedMetrics.total}</p>
              <span className="text-[10px] text-slate-500">consultas</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                Confirmadas/Realizadas
              </span>
              <p className="text-xl font-bold text-emerald-700">{calculatedMetrics.confirmed}</p>
              <span className="text-[10px] text-emerald-600">atendimentos</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">
                Canceladas
              </span>
              <p className="text-xl font-bold text-rose-700">{calculatedMetrics.cancelled}</p>
              <span className="text-[10px] text-rose-500">desistências</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                Taxa de Presença
              </span>
              <p className="text-xl font-bold text-indigo-700">
                {calculatedMetrics.attendanceRate}%
              </p>
              <span className="text-[10px] text-indigo-600">comparecimento</span>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRINT / PREVIEW REPORT CONTAINER (Visible on screen and print) */}
        {/* ========================================================== */}
        <div className="border border-slate-200 rounded-xl overflow-hidden print:border-none">
          {/* Printable Report Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
            <div>
              <h3 className="font-bold text-base">
                Resulta Médicos — Relatório Executivo da Clínica
              </h3>
              <p className="text-xs text-slate-300 print:text-slate-500">
                Data de Emissão: {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-600 text-white text-[11px] print:border">
                {filteredAppointments.length} Registros
              </Badge>
            </div>
          </div>

          {/* Printable Table */}
          <div className="max-h-72 overflow-y-auto print:max-h-none print:overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 print:static">
                <tr>
                  <th className="p-2.5">Data & Hora</th>
                  <th className="p-2.5">Paciente</th>
                  <th className="p-2.5">Médico</th>
                  <th className="p-2.5">Especialidade</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Comparecimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Nenhuma consulta encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => {
                    const dt = new Date(appt.date_time)
                    const doc = doctors.find((d) => d.id === appt.doctor)
                    const specName =
                      doc?.expand?.specialty?.name || doc?.specialty || 'Clínica Geral'
                    const isAttended = appt.status === 'confirmada' || appt.status === 'finalizada'

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono text-[11px]">
                          {dt.toLocaleDateString('pt-BR')}{' '}
                          <span className="font-bold">
                            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {appt.expand?.patient?.name || 'Paciente'}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {appt.expand?.doctor?.name || doc?.name || 'Corpo Clínico'}
                        </td>
                        <td className="p-2.5 text-slate-600">{specName}</td>
                        <td className="p-2.5">
                          <span className="capitalize text-[11px] font-semibold text-slate-800">
                            {appt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isAttended
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'cancelada'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isAttended
                              ? 'Compareceu ✓'
                              : appt.status === 'cancelada'
                                ? 'Não Compareceu'
                                : 'Agendado'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="gap-2 sm:gap-0 pt-3 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrintPDF}
              variant="outline"
              size="sm"
              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              onClick={exportGranularCSV}
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV (Excel UTF-8)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
