import { useState, useEffect } from 'react'
import {
  Pill,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  RefreshCw,
  User,
  ShieldCheck,
  FileText,
  Search,
  Filter,
  Info,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyPrescriptions } from '@/services/patient-portal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export type PrescriptionStatus = 'ativa' | 'a_vencer' | 'vencida' | 'aguardando_renovacao'

export interface DetailedPrescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  prescribingDoctor: string
  doctorCrm: string
  status: PrescriptionStatus
  instructions?: string
  continuousUse?: boolean
  notes?: string
}

// Rich mock prescriptions representing all 4 states for demo
const MOCK_PRESCRIPTIONS: DetailedPrescription[] = [
  {
    id: 'rx-1',
    medication: 'Losartana Potássica',
    dosage: '50mg',
    frequency: '1 comprimido ao dia pela manhã',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    prescribingDoctor: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 145.892 (Cardiologia)',
    status: 'ativa',
    instructions: 'Ingerir com água logo após o café da manhã. Não interromper sem orientação.',
    continuousUse: true,
  },
  {
    id: 'rx-2',
    medication: 'Rosuvastatina Cálcica',
    dosage: '10mg',
    frequency: '1 comprimido à noite',
    startDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // expires in 5 days
    prescribingDoctor: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 145.892 (Cardiologia)',
    status: 'a_vencer',
    instructions: 'Tomar 1 comprimido antes de dormir. Acompanhar com perfil lipídico em 3 meses.',
    continuousUse: true,
  },
  {
    id: 'rx-3',
    medication: 'Amoxicilina + Clavulanato de Potássio',
    dosage: '875mg + 125mg',
    frequency: '1 comprimido a cada 12 horas por 10 dias',
    startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // expired
    prescribingDoctor: 'Dr. Carlos Eduardo Mendes',
    doctorCrm: 'CRM/SP 112.340 (Clínica Geral)',
    status: 'vencida',
    instructions: 'Tratamento de infecção respiratória aguda. Concluir todo o ciclo de 10 dias.',
    continuousUse: false,
  },
  {
    id: 'rx-4',
    medication: 'Omeprazol',
    dosage: '20mg',
    frequency: '1 cápsula ao dia em jejum',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    prescribingDoctor: 'Dr. Lucas Silveira',
    doctorCrm: 'CRM/SP 198.431 (Gastroenterologia)',
    status: 'aguardando_renovacao',
    instructions: 'Tomar 30 minutos antes da primeira refeição. Solicitação de renovação enviada.',
    continuousUse: true,
  },
]

export default function PatientPrescriptions() {
  const { user } = useAuth()
  const { toast } = useToast()
  const patientId = user?.patient_link

  const [prescriptions, setPrescriptions] = useState<DetailedPrescription[]>(MOCK_PRESCRIPTIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | PrescriptionStatus>('todos')

  // Modal for renewal request
  const [renewalModalItem, setRenewalModalItem] = useState<DetailedPrescription | null>(null)
  const [renewalNotes, setRenewalNotes] = useState('')
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false)

  useEffect(() => {
    if (!patientId) return
    getMyPrescriptions(patientId)
      .then((realList) => {
        if (realList && realList.length > 0) {
          const mapped: DetailedPrescription[] = realList.map((m, idx) => ({
            id: `real-rx-${idx}`,
            medication: m.medication,
            dosage: m.dosage,
            frequency: m.instructions || 'Conforme orientação médica',
            startDate: m.recordDate || new Date().toISOString(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            prescribingDoctor: 'Médico Assistente',
            doctorCrm: 'CRM/SP Ativo',
            status: 'ativa',
            instructions: m.instructions,
            continuousUse: true,
          }))
          // Merge to retain all mock demonstrations (a_vencer, vencida, etc.)
          setPrescriptions([...mapped, ...MOCK_PRESCRIPTIONS])
        }
      })
      .catch(() => {
        setPrescriptions(MOCK_PRESCRIPTIONS)
      })
  }, [patientId])

  const handleOpenRenewal = (rx: DetailedPrescription) => {
    setRenewalModalItem(rx)
    setRenewalNotes(
      `Solicito renovação da receita de ${rx.medication} (${rx.dosage}) para continuidade do tratamento.`,
    )
  }

  const handleConfirmRenewal = () => {
    if (!renewalModalItem) return
    setIsSubmittingRenewal(true)
    setTimeout(() => {
      setPrescriptions((prev) =>
        prev.map((item) =>
          item.id === renewalModalItem.id
            ? { ...item, status: 'aguardando_renovacao' as PrescriptionStatus }
            : item,
        ),
      )
      setIsSubmittingRenewal(false)
      setRenewalModalItem(null)
      toast({
        title: 'Pedido de renovação enviado!',
        description: `O médico responsável por ${renewalModalItem.medication} foi notificado e irá revisar a receita.`,
      })
    }, 600)
  }

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.prescribingDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.dosage.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'todos' ? true : rx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Visual status configuration
  const getStatusBadge = (status: PrescriptionStatus) => {
    switch (status) {
      case 'ativa':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Ativa (em uso)
          </Badge>
        )
      case 'a_vencer':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <AlertTriangle className="h-3 w-3" />
            A vencer (últimos 7 dias)
          </Badge>
        )
      case 'vencida':
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-white" />
            Vencida
          </Badge>
        )
      case 'aguardando_renovacao':
        return (
          <Badge className="bg-slate-500 hover:bg-slate-600 text-white flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <Hourglass className="h-3 w-3" />
            Aguardando renovação
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Pill className="h-5 w-5" />
            </div>
            Minhas Prescrições & Medicamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe o status das suas receitas digitais, dosagens, validades e solicite renovações
            com 1 clique.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ativa')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ativa'
              ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">🟢 Ativas</span>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-100/50">
              {prescriptions.filter((p) => p.status === 'ativa').length}
            </Badge>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('a_vencer')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'a_vencer'
              ? 'border-amber-500 bg-amber-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">🟡 A Vencer</span>
            <Badge variant="outline" className="text-amber-700 bg-amber-100/50">
              {prescriptions.filter((p) => p.status === 'a_vencer').length}
            </Badge>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('vencida')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'vencida'
              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">🔴 Vencidas</span>
            <Badge variant="outline" className="text-rose-700 bg-rose-100/50">
              {prescriptions.filter((p) => p.status === 'vencida').length}
            </Badge>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('aguardando_renovacao')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'aguardando_renovacao'
              ? 'border-slate-500 bg-slate-100 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">⏳ Renovação</span>
            <Badge variant="outline" className="text-slate-700 bg-slate-200/50">
              {prescriptions.filter((p) => p.status === 'aguardando_renovacao').length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Buscar medicamento ou médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['todos', 'ativa', 'a_vencer', 'vencida', 'aguardando_renovacao'] as const).map(
            (st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? 'default' : 'outline'}
                onClick={() => setStatusFilter(st)}
                className="text-xs h-8 capitalize whitespace-nowrap"
              >
                {st === 'todos'
                  ? 'Todas as receitas'
                  : st === 'ativa'
                    ? 'Ativas'
                    : st === 'a_vencer'
                      ? 'A Vencer'
                      : st === 'vencida'
                        ? 'Vencidas'
                        : 'Em Renovação'}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-xs text-slate-400">
              Nenhuma prescrição encontrada com os filtros selecionados.
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((rx) => {
            const canRenew = rx.status === 'a_vencer' || rx.status === 'vencida'
            const isWaiting = rx.status === 'aguardando_renovacao'
            const startDateFormatted = new Date(rx.startDate).toLocaleDateString('pt-BR')
            const endDateFormatted = new Date(rx.endDate).toLocaleDateString('pt-BR')

            return (
              <Card
                key={rx.id}
                className={`border-slate-200 shadow-subtle hover:border-slate-300 transition-all overflow-hidden ${
                  rx.status === 'a_vencer' ? 'border-l-4 border-l-amber-500' : ''
                } ${rx.status === 'vencida' ? 'border-l-4 border-l-rose-500 opacity-85' : ''} ${
                  rx.status === 'ativa' ? 'border-l-4 border-l-emerald-500' : ''
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Name, Dosage, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{rx.medication}</h3>
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold text-blue-700 bg-blue-50"
                          >
                            {rx.dosage}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{rx.frequency}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {getStatusBadge(rx.status)}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Prescribing Doctor */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Médico Prescritor
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {rx.prescribingDoctor}
                      </p>
                      <p className="text-[11px] text-slate-500">{rx.doctorCrm}</p>
                    </div>

                    {/* Period: Start & End */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Período de Validade
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 font-bold text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {startDateFormatted} até {endDateFormatted}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {rx.continuousUse ? 'Uso Contínuo' : 'Tratamento Pontual'}
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Instruções de Uso
                      </span>
                      <p className="text-slate-700 mt-0.5 text-[11px] line-clamp-2">
                        {rx.instructions || 'Seguir rigorosamente as recomendações da receita.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Receita assinada com certificado digital padrão ICP-Brasil</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWaiting && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border">
                          <Hourglass className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                          <span>Pedido de renovação em análise pela clínica</span>
                        </div>
                      )}

                      {canRenew && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenRenewal(rx)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Pedir renovação
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast({
                            title: 'Download da Receita',
                            description: `Baixando PDF oficial de ${rx.medication} com QR Code de validação.`,
                          })
                        }
                        className="text-xs text-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Ver PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de Confirmação: Pedir Renovação */}
      {renewalModalItem && (
        <Dialog open={!!renewalModalItem} onOpenChange={() => setRenewalModalItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <RefreshCw className="h-5 w-5 text-amber-600" /> Solicitar Renovação de Receita
              </DialogTitle>
              <DialogDescription className="text-xs">
                Sua solicitação será encaminhada diretamente ao médico prescritor para avaliação
                clínica e emissão de nova via digital.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {renewalModalItem.medication}
                  </span>
                  <Badge variant="outline" className="bg-white text-amber-700 border-amber-300">
                    {renewalModalItem.dosage}
                  </Badge>
                </div>
                <p className="text-slate-600">
                  <strong>Médico:</strong> {renewalModalItem.prescribingDoctor} (
                  {renewalModalItem.doctorCrm})
                </p>
                <p className="text-slate-600">
                  <strong>Última validade:</strong>{' '}
                  {new Date(renewalModalItem.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mensagem / Observação para o médico (opcional):
                </label>
                <Textarea
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  rows={3}
                  className="text-xs"
                  placeholder="Informe se sentiu efeitos colaterais ou se necessita de dosagem contínua..."
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  O médico poderá aprovar a receita digital diretamente ou solicitar um retorno
                  presencial/teleconsulta caso julgue necessário.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRenewalModalItem(null)}
                disabled={isSubmittingRenewal}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                onClick={handleConfirmRenewal}
                disabled={isSubmittingRenewal}
              >
                {isSubmittingRenewal ? 'Enviando...' : 'Confirmar Pedido'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
