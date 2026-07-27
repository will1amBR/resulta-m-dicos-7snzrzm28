import pb from '@/lib/pocketbase/client'
import { MedicationAlert } from '@/types/clinical'

export const analyzeMedications = (data: {
  patient: string
  cid10_codes: Array<{ code: string; description: string }>
  prescribed_medications: Array<{ medication: string; dosage: string; instructions?: string }>
}): Promise<MedicationAlert[]> =>
  pb.send('/backend/v1/analyze-medications', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
