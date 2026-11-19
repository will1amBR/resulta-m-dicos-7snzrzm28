import pb from '@/lib/pocketbase/client'
import { MedicationAlert, normalizeMedicationAlert } from '@/types/clinical'

/**
 * Histórico de alertas de risco ignorados pelo médico ao emitir receita.
 * Cada registro guarda o alerta (medicamento, nível, motivo, sugestão) e a
 * justificativa clínica dada na emissão, para revisão pela área da clínica.
 */

export interface IgnoredMedicationAlert {
  id: string
  patient: string
  doctor: string
  prescription?: string
  medication_name: string
  risk_level: 'contraindicacao' | 'precaucao'
  alert_reason?: string
  alert_suggestion?: string
  justification: string
  review_notes?: string
  review_status?: 'pendente' | 'observado' | 'inaceitavel' | ''
  reviewed_at?: string
  reviewed_by?: string
  created?: string
  expand?: {
    patient?: { id: string; name?: string; cpf?: string }
    doctor?: { id: string; name?: string; crm?: string; council_number?: string }
    prescription?: { id: string; verification_code?: string }
    reviewed_by?: { id: string; name?: string }
  }
}

export interface CreateIgnoredAlertData {
  patient: string
  doctor: string
  prescription?: string
  medication_name: string
  risk_level: 'contraindicacao' | 'precaucao'
  alert_reason?: string
  alert_suggestion?: string
  justification: string
}

export async function createIgnoredMedicationAlert(
  data: CreateIgnoredAlertData,
): Promise<IgnoredMedicationAlert> {
  return pb.collection('ignored_medication_alerts').create<IgnoredMedicationAlert>(data)
}

/**
 * Extrai os alertas de risco alto (contraindicação/precaução) da análise,
 * já normalizados. Usado na emissão para gravar um registro por alerta.
 */
export function extractRiskyAlerts(alerts: MedicationAlert[] | undefined): Array<{
  medication_name: string
  risk_level: 'contraindicacao' | 'precaucao'
  reason?: string
  suggestion?: string
}> {
  if (!alerts?.length) return []
  return alerts
    .map(normalizeMedicationAlert)
    .filter(
      (a): a is MedicationAlert & { risk_level: 'contraindicacao' | 'precaucao' } =>
        a.risk_level === 'contraindicacao' || a.risk_level === 'precaucao',
    )
    .map((a) => ({
      medication_name: a.medication || 'Medicamento não identificado',
      risk_level: a.risk_level,
      reason: a.reason || a.message || '',
      suggestion: a.suggestion || a.suggested_alternative || '',
    }))
}

export interface IgnoredAlertsFilter {
  patientId?: string
  doctorId?: string
  riskLevel?: 'contraindicacao' | 'precaucao' | 'todos'
  from?: string // data ISO (inclusive)
  to?: string // data ISO (inclusive)
  limit?: number
}

export async function getIgnoredMedicationAlerts(
  filter: IgnoredAlertsFilter = {},
): Promise<IgnoredMedicationAlert[]> {
  const clauses: string[] = []
  if (filter.patientId) clauses.push(`patient = '${filter.patientId}'`)
  if (filter.doctorId) clauses.push(`doctor = '${filter.doctorId}'`)
  if (filter.riskLevel && filter.riskLevel !== 'todos')
    clauses.push(`risk_level = '${filter.riskLevel}'`)
  if (filter.from) clauses.push(`created >= '${filter.from} 00:00:00.000Z'`)
  if (filter.to) clauses.push(`created <= '${filter.to} 23:59:59.999Z'`)

  return pb.collection('ignored_medication_alerts').getFullList<IgnoredMedicationAlert>({
    filter: clauses.join(' && '),
    sort: '-created',
    expand: 'patient,doctor,prescription,reviewed_by',
    limit: filter.limit || 300,
  })
}

export interface ReviewIgnoredAlertData {
  review_notes: string
  review_status: 'observado' | 'inaceitavel'
  reviewed_by: string
  reviewed_at: string
}

/**
 * Registra a revisão/observação da clínica sobre uma justificativa de alerta
 * ignorado. O médico autor é notificado separadamente pelo chamador.
 */
export async function reviewIgnoredMedicationAlert(
  alertId: string,
  data: ReviewIgnoredAlertData,
): Promise<IgnoredMedicationAlert> {
  return pb.collection('ignored_medication_alerts').update<IgnoredMedicationAlert>(alertId, data)
}
