import pb from '@/lib/pocketbase/client'
import { MedicalRecord } from '@/types/clinical'

export const getMedicalRecordsForPatient = (patientId: string) =>
  pb.collection('medical_records').getFullList<MedicalRecord>({
    filter: `patient = "${patientId}"`,
    sort: '-created',
  })

export const getLatestMedicalRecord = async (patientId: string): Promise<MedicalRecord | null> => {
  try {
    const list = await pb.collection('medical_records').getList<MedicalRecord>(1, 1, {
      filter: `patient = "${patientId}"`,
      sort: '-created',
    })
    return list.items[0] || null
  } catch {
    return null
  }
}

export const createMedicalRecord = (data: Partial<MedicalRecord>) =>
  pb.collection('medical_records').create<MedicalRecord>(data)

export const updateMedicalRecord = (id: string, data: Partial<MedicalRecord>) =>
  pb.collection('medical_records').update<MedicalRecord>(id, data)
