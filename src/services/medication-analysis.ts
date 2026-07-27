import pb from '@/lib/pocketbase/client'
import { MedicationAlert } from '@/types/clinical'

export const analyzeMedications = async (data: {
  patient: string
  cid10_codes: Array<{ code: string; description: string }>
  prescribed_medications: Array<{ medication: string; dosage: string; instructions?: string }>
}): Promise<MedicationAlert[]> => {
  const result = await pb.send<{ alerts: MedicationAlert[] }>('/backend/v1/analyze-medications', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
  return result.alerts ?? []
}
