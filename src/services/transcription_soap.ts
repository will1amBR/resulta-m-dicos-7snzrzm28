import pb from '@/lib/pocketbase/client'
import { SoapTranscriptionResult } from '@/types/clinical'

export async function transcribeConsultationToSoap(data: {
  transcript: string
  patientName?: string
  doctorName?: string
}): Promise<SoapTranscriptionResult> {
  const res = await pb.send('/backend/v1/transcribe-soap', {
    method: 'POST',
    body: JSON.stringify({
      transcript: data.transcript,
      patient_name: data.patientName || 'Paciente',
      doctor_name: data.doctorName || 'Médico',
    }),
  })
  return res as SoapTranscriptionResult
}
