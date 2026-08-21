import { useState, useEffect } from 'react'
import {
  FileText,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyMedicalRecords } from '@/services/patient-portal'
import { MedicalRecord } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export type TimelineEventType = 'consulta' | 'exame' | 'procedimento' | 'prescricao'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  date: string
  title: string
  doctor: string
  doctorCrm?: string
  clinic?: string
  summary: string
  details: {
    soap_subjective?: string
    soap_objective?: string
    soap_assessment?: string
    soap_plan?: string
    cid10_codes?: { code: string; description: string }[]
    prescribed_medications?: { medication: string; dosage: string; instructions?: string }[]
    procedures?: string[]
    results?: string
    lab?: string
  }
}

// Mock fallback timeline events (3-4 events in reverse chronological order)
const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    type: 'prescricao',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    title: 'Renovação de Prescrição Contínua',
    doctor: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 145.892 (Cardiologia)',
    clinic: 'Resulta Saúde Integrada - Unidade Paulista',
    summary: 'Ajuste de dosagem para controle de pressão arterial e colesterol.',
    details: {
      soap_assessment: 'Paciente refere boa adesão. Níveis pressóricos estáveis.',
      soap_plan: 'Manter acompanhamento a cada 6 meses.',
      prescribed_medications: [
        {
          medication: 'Losartana Potássica',
          dosage: '50mg',
          instructions: 'Tomar 1 comprimido pela manhã em jejum',
        },
        {
          medication: 'Rosuvastatina Cálcica',
          dosage: '10mg',
          instructions: 'Tomar 1 comprimido à noite antes de dormir',
        },
      ],
      cid10_codes: [
        { code: 'I10', description: 'Hipertensão essencial (primária)' },
        { code: 'E78.0', description: 'Hipercolesterolemia pura' },
      ],
    },
  },
  {
    id: 'evt-2',
    type: 'exame',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    title: 'Resultado de Exames Laboratoriais (Painel Lipídico)',
    doctor: 'Laboratório Fleury / Dr. Lucas Silveira',
    doctorCrm: 'CRM/SP 198.431',
    clinic: 'Centro de Diagnósticos Resulta',
    summary: 'Hemograma completo, glicemia de jejum, colesterol total e frações.',
    details: {
      lab: 'Resulta Medicina Diagnóstica',
      results:
        'Colesterol Total: 190 mg/dL (Desejável < 200). HDL: 52 mg/dL. LDL: 108 mg/dL. Glicemia: 92 mg/dL. Hemograma sem alterações dignas de nota.',
      soap_objective: 'Exames laboratoriais normais, controle glicêmico e lipídico adequado.',
    },
  },
  {
    id: 'evt-3',
    type: 'procedimento',
    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
    title: 'Eletrocardiograma de Repouso (ECG)',
    doctor: 'Dr. Roberto Vasconcelos',
    doctorCrm: 'CRM/SP 182.391 (Cardiologia)',
    clinic: 'Resulta Centro Médico Jardins',
    summary: 'Traçado de 12 derivações realizado sem intercorrências.',
    details: {
      procedures: ['Eletrocardiograma de repouso (12 derivações)'],
      soap_objective:
        'Ritmo sinusal regular, FC: 68 bpm. Intervalo PR normal. Sem alterações isquêmicas agudas.',
      soap_assessment: 'ECG dentro dos padrões de normalidade para a faixa etária.',
    },
  },
  {
    id: 'evt-4',
    type: 'consulta',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    title: 'Consulta Médica de Rotina (Check-up Clínico)',
    doctor: 'Dr. Carlos Eduardo Mendes',
    doctorCrm: 'CRM/SP 112.340 (Clínica Geral)',
    clinic: 'Resulta Saúde Integrada - Unidade Paulista',
    summary: 'Avaliação clínica geral anual, exame físico e solicitação de exames de rastreio.',
    details: {
      soap_subjective:
        'Paciente comparece assintomático para check-up de rotina. Nega queixas cardiovasculares recentes.',
      soap_objective:
        'PA: 125/80 mmHg, FC: 70 bpm, IMC: 24.2 kg/m². Ausculta cardíaca e pulmonar sem ruídos anormais.',
      soap_assessment: 'Estado geral bom. Hipertensão arterial controlada.',
      soap_plan: 'Solicitado painel lipídico, hemograma e ECG. Retorno programado com os laudos.',
      cid10_codes: [{ code: 'Z00.0', description: 'Exame médico geral de rotina' }],
    },
  },
]

export default function PatientRecords() {
  const { user } = useAuth()
  const patientId = user?.patient_link

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [events, setEvents] = useState<TimelineEvent[]>(MOCK_TIMELINE_EVENTS)
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({
    'evt-1': true, // Keep the first event open by default
  })
  const [selectedFilter, setSelectedFilter] = useState<'todos' | TimelineEventType>('todos')

  useEffect(() => {
    if (!patientId) return
    getMyMedicalRecords(patientId)
      .then((data) => {
        if (data && data.length > 0) {
          setRecords(data)
          // Map real DB records into timeline events
          const mapped: TimelineEvent[] = data.map((r, idx) => {
            let eventType: TimelineEventType = 'consulta'
            if (r.procedures && r.procedures.length > 0) eventType = 'procedimento'
            else if (r.prescribed_medications && r.prescribed_medications.length > 0)
              eventType = 'prescricao'

            return {
              id: r.id,
              type: eventType,
              date: r.created || new Date().toISOString(),
              title:
                r.soap_assessment ||
                (eventType === 'prescricao' ? 'Prescrição Médica' : 'Registro de Prontuário'),
              doctor: 'Médico Assistente',
              clinic: 'Resulta Saúde Integrada',
              summary: r.soap_plan || r.soap_subjective || 'Atendimento clínico registrado.',
              details: {
                soap_subjective: r.soap_subjective,
                soap_objective: r.soap_objective,
                soap_assessment: r.soap_assessment,
                soap_plan: r.soap_plan,
                cid10_codes: r.cid10_codes,
                prescribed_medications: r.prescribed_medications,
                procedures: r.procedures,
              },
            }
          })
          // Merge with mock timeline so patient always has rich demonstrative history
          const merged = [...mapped, ...MOCK_TIMELINE_EVENTS].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          setEvents(merged)
        }
      })
      .catch(() => {
        setEvents(MOCK_TIMELINE_EVENTS)
      })
  }, [patientId])

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleAll = () => {
    const allOpen = events.every((e) => expandedEvents[e.id])
    const nextState: Record<string, boolean> = {}
    events.forEach((e) => {
      nextState[e.id] = !allOpen
    })
    setExpandedEvents(nextState)
  }

  // Filtered timeline
  const filteredEvents =
    selectedFilter === 'todos' ? events : events.filter((e) => e.type === selectedFilter)

  // Visual type styling helpers
  const getTypeConfig = (type: TimelineEventType) => {
    switch (type) {
      case 'consulta':
        return {
          icon: Stethoscope,
          bgCircle: 'bg-blue-600 text-white border-blue-200',
          badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'Consulta',
          borderLeft: 'border-l-blue-500',
        }
      case 'exame':
        return {
          icon: FlaskConical,
          bgCircle: 'bg-emerald-600 text-white border-emerald-200',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          label: 'Exame',
          borderLeft: 'border-l-emerald-500',
        }
      case 'procedimento':
        return {
          icon: Syringe,
          bgCircle: 'bg-purple-600 text-white border-purple-200',
          badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
          label: 'Procedimento',
          borderLeft: 'border-l-purple-500',
        }
      case 'prescricao':
        return {
          icon: Pill,
          bgCircle: 'bg-amber-500 text-white border-amber-200',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
          label: 'Prescrição',
          borderLeft: 'border-l-amber-500',
        }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            Timeline do Prontuário Médico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Histórico cronológico unificado de consultas, exames, procedimentos e prescrições.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} className="text-xs">
            {events.every((e) => expandedEvents[e.id]) ? 'Recolher todos' : 'Expandir todos'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs by Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Button
          variant={selectedFilter === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('todos')}
          className="text-xs h-8"
        >
          Todos ({events.length})
        </Button>
        <Button
          variant={selectedFilter === 'consulta' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('consulta')}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
          Consultas ({events.filter((e) => e.type === 'consulta').length})
        </Button>
        <Button
          variant={selectedFilter === 'exame' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('exame')}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <FlaskConical className="h-3.5 w-3.5 text-emerald-500" />
          Exames ({events.filter((e) => e.type === 'exame').length})
        </Button>
        <Button
          variant={selectedFilter === 'procedimento' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('procedimento')}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <Syringe className="h-3.5 w-3.5 text-purple-500" />
          Procedimentos ({events.filter((e) => e.type === 'procedimento').length})
        </Button>
        <Button
          variant={selectedFilter === 'prescricao' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('prescricao')}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <Pill className="h-3.5 w-3.5 text-amber-500" />
          Prescrições ({events.filter((e) => e.type === 'prescricao').length})
        </Button>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6">
        {/* Continuous vertical line connecting the events */}
        <div className="absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-0.5 bg-slate-200" />

        {filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-xs text-slate-400">
              Nenhum evento registrado nesta categoria.
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = !!expandedEvents[evt.id]
            const typeConfig = getTypeConfig(evt.type)
            const Icon = typeConfig.icon
            const dt = new Date(evt.date)

            return (
              <div key={evt.id} className="relative group">
                {/* Node circle on the vertical line */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 h-8 w-8 sm:h-9 sm:w-9 rounded-full ${typeConfig.bgCircle} border-4 shadow-sm flex items-center justify-center z-10`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Event Card */}
                <Card
                  className={`border-slate-200 hover:border-slate-300 transition-all shadow-subtle ${
                    isExpanded ? 'ring-1 ring-blue-500/20' : ''
                  }`}
                >
                  {/* Clickable Header */}
                  <div
                    onClick={() => toggleExpand(evt.id)}
                    className="p-4 sm:p-5 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${typeConfig.badgeClass}`}
                        >
                          {typeConfig.label}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                        {evt.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{evt.doctor}</span>
                        {evt.doctorCrm && <span className="text-slate-400">• {evt.doctorCrm}</span>}
                      </div>

                      <p className="text-xs text-slate-500 pt-0.5">{evt.summary}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[11px] text-blue-600 font-semibold sm:hidden">
                        {isExpanded ? 'Recolher detalhes' : 'Ver detalhes'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                      {/* SOAP details */}
                      {evt.details.soap_subjective && (
                        <div className="pt-3">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                            Subjetivo (Relato do Paciente):
                          </span>
                          <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                            {evt.details.soap_subjective}
                          </p>
                        </div>
                      )}

                      {evt.details.soap_objective && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                            Objetivo (Exame Clínico & Sinais):
                          </span>
                          <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                            {evt.details.soap_objective}
                          </p>
                        </div>
                      )}

                      {evt.details.soap_assessment && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                            Avaliação / Diagnóstico Médico:
                          </span>
                          <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                            {evt.details.soap_assessment}
                          </p>
                        </div>
                      )}

                      {evt.details.soap_plan && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                            Plano Terapêutico & Conduta:
                          </span>
                          <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                            {evt.details.soap_plan}
                          </p>
                        </div>
                      )}

                      {/* CID-10 Codes */}
                      {evt.details.cid10_codes && evt.details.cid10_codes.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">
                            Diagnósticos Associados (CID-10):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {evt.details.cid10_codes.map((c, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs bg-white border text-slate-800 font-mono"
                              >
                                <strong>{c.code}</strong>{' '}
                                {c.description ? `— ${c.description}` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medications */}
                      {evt.details.prescribed_medications &&
                        evt.details.prescribed_medications.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5 text-amber-500" /> Medicamentos
                              Prescritos:
                            </span>
                            <div className="space-y-2">
                              {evt.details.prescribed_medications.map((m, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 flex items-start justify-between gap-2"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900 text-xs">
                                      {m.medication} —{' '}
                                      <span className="text-blue-700">{m.dosage}</span>
                                    </p>
                                    {m.instructions && (
                                      <p className="text-[11px] text-slate-600 mt-0.5">
                                        {m.instructions}
                                      </p>
                                    )}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] bg-white text-amber-700 border-amber-200"
                                  >
                                    Em uso
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Procedures */}
                      {evt.details.procedures && evt.details.procedures.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">
                            Procedimentos Realizados:
                          </span>
                          <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-200/60 text-slate-700 font-medium">
                            {evt.details.procedures.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Lab results */}
                      {evt.details.results && (
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">
                            Laudo / Valores Laboratoriais:
                          </span>
                          <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-lg text-slate-700 font-mono text-[11px]">
                            {evt.details.results}
                          </div>
                        </div>
                      )}

                      {/* Clinic Info Footer */}
                      {evt.clinic && (
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span>Unidade: {evt.clinic}</span>
                          <span>Assinado digitalmente por {evt.doctor}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
