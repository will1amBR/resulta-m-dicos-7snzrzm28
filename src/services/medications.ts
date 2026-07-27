import pb from '@/lib/pocketbase/client'
import { Medication, MedicationAlert } from '@/types/clinical'

export const searchMedications = (query: string) => {
  const filter = query ? `name ~ "${query}" || active_ingredient ~ "${query}"` : ''
  return pb.collection('medications').getList<Medication>(1, 20, {
    filter,
    sort: 'name',
  })
}

export const getMedicationById = (id: string) => pb.collection('medications').getOne<Medication>(id)

export const analyzeMedications = (data: {
  patient: string
  cid10_codes: Array<{ code: string; description?: string } | string>
  prescribed_medications: Array<{ medication: string; dosage: string; instructions?: string }>
}): Promise<{ alerts: MedicationAlert[] }> =>
  pb.send('/backend/v1/analyze-medications', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
