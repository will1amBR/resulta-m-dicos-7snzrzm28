import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface TeleconsultaSignal extends RecordModel {
  appointment: string
  sender_role: 'doctor' | 'patient'
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'ready' | 'ping'
  payload: string // JSON stringified RTCSessionDescriptionInit or RTCIceCandidateInit or {}
}

export const sendTeleconsultaSignal = async (signal: {
  appointment: string
  sender_role: 'doctor' | 'patient'
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'ready' | 'ping'
  payload: string
}): Promise<TeleconsultaSignal> => {
  return pb.collection('teleconsulta_signals').create<TeleconsultaSignal>(signal)
}

export const getRecentTeleconsultaSignals = async (
  appointmentId: string,
  limit = 20,
): Promise<TeleconsultaSignal[]> => {
  return pb.collection('teleconsulta_signals').getFullList<TeleconsultaSignal>({
    filter: `appointment = "${appointmentId}"`,
    sort: 'created',
    limit,
  })
}
