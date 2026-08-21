import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  User,
  Calendar,
  Stethoscope,
  Phone,
  Mail,
  Shield,
  FileText,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { getClinicPatients, getClinicAppointments, getClinicDoctors } from '@/services/clinic'
import { Patient, Appointment } from '@/types/clinical'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { NewPatientModal } from '@/components/NewPatientModal'

interface PatientWithClinicMeta extends Patient {
  lastAppointmentDate?: string
  lastDoctorName?: string
  lastDoctorSpecialty?: string
  totalAppointments?: number
}

export default function ClinicPatients() {
  const [rawPatients, setRawPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('todos')
  const [selected, setSelected] = useState<PatientWithClinicMeta | null>(null)
  const [newPatientOpen, setNewPatientOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pList, aList, dList] = await Promise.all([
        getClinicPatients(search),
        getClinicAppointments(),
        getClinicDoctors().catch(() => []),
      ])
      setRawPatients(pList)
      setAppointments(aList)
      setDoctors(dList)
    } catch {
      /* ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search])

  // Cruzar pacientes com histórico de consultas e médicos
  const enrichedPatients = useMemo<PatientWithClinicMeta[]>(() => {
    return rawPatients.map((p) => {
      const patientAppts = appointments
        .filter((a) => a.patient === p.id)
        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())

      const lastAppt = patientAppts[0]
      let lastDoctorName = '-'
      let lastDoctorSpecialty = '-'

      if (lastAppt) {
        const doc = doctors.find((d) => d.id === lastAppt.doctor)
        lastDoctorName = lastAppt.expand?.doctor?.name || doc?.name || '-'
        lastDoctorSpecialty = doc?.expand?.specialty?.name || 'Clínica Médica'
      }

      return {
        ...p,
        lastAppointmentDate: lastAppt ? lastAppt.date_time : undefined,
        lastDoctorName,
        lastDoctorSpecialty,
        totalAppointments: patientAppts.length,
      }
    })
  }, [rawPatients, appointments, doctors])

  // Filtragem por médico
  const filteredPatients = useMemo(() => {
    if (doctorFilter === 'todos') return enrichedPatients
    return enrichedPatients.filter((p) => {
      return appointments.some((a) => a.patient === p.id && a.doctor === doctorFilter)
    })
  }, [enrichedPatients, appointments, doctorFilter])

  // Idade calculada
  const getAge = (birthDate?: string) => {
    if (!birthDate) return null
    const diff = Date.now() - new Date(birthDate).getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" /> Pacientes da Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Base unificada de pacientes atendidos pelos médicos vinculados à unidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>

          <Button
            onClick={() => setNewPatientOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Novo Paciente
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtro por Médico */}
      <div className="flex flex-wrap gap-2.5 items-center bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar paciente por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="h-8 text-xs w-52 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Filtrar por médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} {d.crm ? `(${d.crm})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Cards de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPatients.map((p) => {
          const age = getAge(p.birth_date)
          return (
            <Card
              key={p.id}
              className="border-slate-200 shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {age ? `${age} anos • ` : ''}
                        {p.cpf ? `CPF: ${p.cpf}` : 'Sem CPF'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] bg-slate-50 border-slate-200 text-slate-700"
                  >
                    {p.insurance || 'Particular'}
                  </Badge>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-emerald-600" /> Médico Responsável:
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[140px]">
                      {p.lastDoctorName || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-600" /> Última Consulta:
                    </span>
                    <span className="font-medium text-slate-700">
                      {p.lastAppointmentDate
                        ? new Date(p.lastAppointmentDate).toLocaleDateString('pt-BR')
                        : 'Nenhuma registrada'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {p.totalAppointments || 0} consulta(s) no total
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setSelected(p)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredPatients.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center text-xs text-slate-400">
            Nenhum paciente encontrado com os filtros selecionados.
          </CardContent>
        </Card>
      )}

      {/* Modal Detalhes do Paciente */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" /> Ficha Cadastral do Paciente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dados completos de identificação, convênio e histórico clínico vinculado à clínica.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selected.name}</h3>
                  <p className="text-xs text-emerald-700 font-medium">
                    {selected.insurance || 'Particular'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">CPF</span>
                  <p className="font-bold text-slate-800">{selected.cpf || 'Não informado'}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Nascimento</span>
                  <p className="font-bold text-slate-800">
                    {selected.birth_date
                      ? `${new Date(selected.birth_date).toLocaleDateString('pt-BR')} (${getAge(selected.birth_date)} anos)`
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Telefone:</strong> {selected.phone || 'Não informado'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <strong>E-mail:</strong> {selected.email || 'Não informado'}
                </p>
                <p className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Último Médico:</strong> {selected.lastDoctorName}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Data de Cadastro:</strong>{' '}
                  {selected.created
                    ? new Date(selected.created).toLocaleDateString('pt-BR')
                    : 'Recente'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Novo Paciente */}
      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSuccess={() => {
          loadData()
        }}
      />
    </div>
  )
}
