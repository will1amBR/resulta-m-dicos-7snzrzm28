import { pb } from '@/lib/pocketbase/client'
import { PrescriptionRecord } from '@/types/clinical'

export interface PrescriptionDispensation {
  id: string
  prescription: string
  verification_code: string
  pharmacy_name: string
  created: string
}

/**
 * Registra a prova de dispensação de uma receita consultada publicamente por
 * uma farmácia (sem login). Falha silenciosamente: nunca deve quebrar a
 * validação da receita para a farmácia.
 */
export async function registerDispensation(
  rx: PrescriptionRecord,
): Promise<PrescriptionDispensation | null> {
  try {
    const rec = await pb.collection('prescription_dispensations').create({
      prescription: rx.id,
      verification_code: rx.verification_code || rx.id,
      pharmacy_name: '',
    })
    return rec as unknown as PrescriptionDispensation
  } catch (err) {
    console.error('Falha ao registrar dispensação', err)
    return null
  }
}

/** Provas de dispensação das receitas do médico (para badge/agregação). */
export async function getDispensationsForPrescriptions(
  prescriptionIds: string[],
): Promise<PrescriptionDispensation[]> {
  if (prescriptionIds.length === 0) return []
  try {
    const filter = prescriptionIds.map((id) => `prescription="${id}"`).join(' || ')
    const list = await pb.collection('prescription_dispensations').getList(1, 200, {
      filter,
      sort: '-created',
    })
    return (list.items || []) as unknown as PrescriptionDispensation[]
  } catch {
    return []
  }
}
