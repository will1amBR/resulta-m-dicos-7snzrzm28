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
