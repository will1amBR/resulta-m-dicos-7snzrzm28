export interface Specialty {
  id: string
  name: string
}

export interface Patient {
  id: string
  name: string
  cpf: string
  phone?: string
  email?: string
  birth_date?: string
  insurance?: string
  created?: string
  updated?: string
}

export type AppointmentStatus =
  | 'agendada'
  | 'confirmada'
  | 'em_andamento'
  | 'finalizada'
  | 'cancelada'

export interface Appointment {
  id: string
  doctor: string
  patient: string
  date_time: string
  status: AppointmentStatus
  reason?: string
  notes?: string
  expand?: {
    patient?: Patient
    doctor?: { name: string; crm?: string }
  }
  created?: string
  updated?: string
}

export interface PrescribedMedication {
  medication: string
  dosage: string
  instructions?: string
}

export interface CidCode {
  code: string
  description: string
}

export interface MedicalRecord {
  id: string
  appointment?: string
  patient: string
  doctor: string
  soap_subjective?: string
  soap_objective?: string
  soap_assessment?: string
  soap_plan?: string
  prescribed_medications?: PrescribedMedication[]
  cid10_codes?: CidCode[]
  procedures?: string[]
  ai_alerts?: MedicationAlert[]
  created?: string
  updated?: string
}

export type DocumentFolder = 'exames' | 'medicamentos' | 'procedimentos' | 'agendamentos' | 'outros'

export interface DocumentItem {
  id: string
  patient: string
  folder: DocumentFolder
  file?: string
  name: string
  ai_classified?: boolean
  created?: string
  updated?: string
}

export interface Medication {
  id: string
  name: string
  active_ingredient?: string
  laboratory?: string
  presentation?: string
  indications?: string
  contraindications?: string
  interactions?: string
}

export type CouncilType = 'CRM' | 'CRN' | 'CRP' | 'CRO' | 'COREN' | 'CREFITO'

export type UserRole = 'doctor' | 'clinic' | 'patient' | 'admin'

export interface ClinicStats {
  doctorCount: number
  todayAppointmentCount: number
  scheduledCount: number
  patientCount: number
}

export interface MedicationAlert {
  medication: string
  severity: 'high' | 'medium' | 'none'
  message: string
}

export interface Cid10Code {
  id: string
  code: string
  description: string
}

export type CertificateStatus = 'nao_enviado' | 'pendente' | 'validado'

export type PrescriptionSendMethod = 'email' | 'whatsapp' | 'sms' | 'nenhum'

export interface PrescriptionItem {
  medication: string
  dosage: string
  frequency?: string
  period_days?: number
  instructions?: string
}

export interface PrescriptionRecord {
  id: string
  patient_id: string
  doctor_id: string
  medications: PrescriptionItem[]
  status: 'emitida' | 'enviada' | 'aguardando_renovacao' | 'cancelada' | 'rejeitada'
  certificate_validated: boolean
  sent_via?: PrescriptionSendMethod
  sent_at?: string
  notes?: string
  ai_alerts?: MedicationAlert[]
  renewal_requested_at?: string
  renewal_justification?: string
  renewal_patient_notes?: string
  created?: string
  updated?: string
  expand?: {
    patient_id?: Patient
    doctor_id?: {
      id: string
      name: string
      crm?: string
      council_type?: string
      council_number?: string
      certificate_status?: CertificateStatus
      certificate_file?: string
    }
  }
}

export interface InAppNotification {
  id: string
  user: string
  title: string
  message: string
  type: 'warning' | 'info' | 'success' | 'certificate_alert' | 'prescription'
  read: boolean
  link?: string
  created?: string
  updated?: string
}
