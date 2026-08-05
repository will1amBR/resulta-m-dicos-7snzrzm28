import pb from '@/lib/pocketbase/client'
import { Appointment, MedicalRecord, DocumentItem, PrescribedMedication } from '@/types/clinical'

export const getMyAppointments = (patientId: string) =>
  pb.collection('appointments').getFullList<Appointment>({
    filter: `patient = "${patientId}"`,
    sort: 'date_time',
    expand: 'doctor',
  })

export const getMyMedicalRecords = (patientId: string) =>
  pb.collection('medical_records').getFullList<MedicalRecord>({
    filter: `patient = "${patientId}"`,
    sort: '-created',
  })

export const getMyDocuments = (patientId: string) =>
  pb.collection('documents').getFullList<DocumentItem>({
    filter: `patient = "${patientId}"`,
    sort: '-created',
  })

export interface PatientPrescription extends PrescribedMedication {
  recordDate?: string
}

export const getMyPrescriptions = async (patientId: string): Promise<PatientPrescription[]> => {
  const records = await getMyMedicalRecords(patientId)
  const prescriptions: PatientPrescription[] = []
  for (const r of records) {
    if (r.prescribed_medications) {
      for (const med of r.prescribed_medications) {
        prescriptions.push({ ...med, recordDate: r.created })
      }
    }
  }
  return prescriptions
}
