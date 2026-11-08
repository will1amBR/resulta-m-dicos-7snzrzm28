import pb from '@/lib/pocketbase/client'
import { CouncilType } from '@/types/clinical'

export interface PendingCouncilDoctor {
  id: string
  name: string
  email: string
  crm?: string
  council_type?: CouncilType
  council_number?: string
  council_approved: boolean
  created?: string
  specialty?: string
  expand?: {
    specialty?: { id: string; name: string }
  }
}

export async function getPendingCouncilDoctors(): Promise<PendingCouncilDoctor[]> {
  const records = await pb.collection('users').getList<PendingCouncilDoctor>(1, 100, {
    filter: "role = 'doctor' && council_approved = false",
    sort: '-created',
    expand: 'specialty',
  })
  return records.items
}

/**
 * Aprovar ou rejeitar o conselho de um novo cadastro de médico.
 * Chama o hook de backend (pb_hooks) que grava council_approved e cria
 * a notificação in-app para o profissional (sino no header).
 */
export async function reviewCouncilRegistration(
  userId: string,
  action: 'approve' | 'reject',
  justification?: string,
): Promise<{ success: boolean; message?: string }> {
  return await pb.send<{ success: boolean; message?: string }>(
    `/backend/v1/clinic/users/${userId}/review-council`,
    {
      method: 'PATCH',
      body: JSON.stringify({ action, justification: justification || '' }),
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
