import pb from '@/lib/pocketbase/client'
import { TeleconsultaMessage } from '@/types/clinical'

/**
 * Busca o histórico de mensagens de uma consulta em ordem cronológica (created ASC).
 */
export const getTeleconsultaMessages = async (
  appointmentId: string,
): Promise<TeleconsultaMessage[]> => {
  if (!appointmentId) return []
  try {
    return await pb.collection('teleconsulta_messages').getFullList<TeleconsultaMessage>({
      filter: `appointment = "${appointmentId}"`,
      sort: 'created',
    })
  } catch (error) {
    console.error('Erro ao buscar mensagens de teleconsulta:', error)
    return []
  }
}

/**
 * Envia/persiste uma nova mensagem de teleconsulta no PocketBase.
 */
export const sendTeleconsultaMessage = async (data: {
  appointment: string
  sender: 'Médico' | 'Paciente' | 'Sistema' | string
  sender_name?: string
  sender_role: 'doctor' | 'patient' | 'system'
  text: string
}): Promise<TeleconsultaMessage> => {
  return await pb.collection('teleconsulta_messages').create<TeleconsultaMessage>(data)
}
