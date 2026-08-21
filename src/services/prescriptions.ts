import pb from '@/lib/pocketbase/client'
import { PrescriptionRecord, PrescriptionItem, MedicationAlert } from '@/types/clinical'

export interface CreatePrescriptionData {
  patient_id: string
  doctor_id: string
  medications: PrescriptionItem[]
  certificate_validated: boolean
  notes?: string
  ai_alerts?: MedicationAlert[]
  status?: 'emitida' | 'enviada' | 'cancelada'
  sent_via?: 'email' | 'whatsapp' | 'sms' | 'nenhum'
}

export const getDoctorPrescriptions = async (
  doctorId?: string,
  options?: { search?: string; status?: string },
): Promise<PrescriptionRecord[]> => {
  try {
    let filter = doctorId ? `doctor_id = "${doctorId}"` : ''

    if (options?.status && options.status !== 'todas') {
      filter = filter ? `${filter} && status = "${options.status}"` : `status = "${options.status}"`
    }

    const list = await pb.collection('prescriptions').getList<PrescriptionRecord>(1, 100, {
      filter: filter || undefined,
      sort: '-created',
      expand: 'patient_id,doctor_id',
    })

    let items = list.items

    if (options?.search?.trim()) {
      const q = options.search.toLowerCase().trim()
      items = items.filter((item) => {
        const patName = item.expand?.patient_id?.name?.toLowerCase() || ''
        const patCpf = item.expand?.patient_id?.cpf?.toLowerCase() || ''
        const meds = (item.medications || []).map((m) => m.medication.toLowerCase()).join(' ')
        return patName.includes(q) || patCpf.includes(q) || meds.includes(q)
      })
    }

    return items
  } catch (error) {
    console.error('Erro ao buscar receitas do médico:', error)
    return []
  }
}

export const getPrescriptionById = async (id: string): Promise<PrescriptionRecord | null> => {
  try {
    return await pb.collection('prescriptions').getOne<PrescriptionRecord>(id, {
      expand: 'patient_id,doctor_id',
    })
  } catch {
    return null
  }
}

export const createPrescription = async (
  data: CreatePrescriptionData,
): Promise<PrescriptionRecord> => {
  return await pb.collection('prescriptions').create<PrescriptionRecord>(
    {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      medications: data.medications,
      certificate_validated: data.certificate_validated,
      notes: data.notes || '',
      ai_alerts: data.ai_alerts || [],
      status: data.status || 'emitida',
      sent_via: data.sent_via || 'nenhum',
    },
    { expand: 'patient_id,doctor_id' },
  )
}

export const updatePrescriptionStatus = async (
  id: string,
  data: {
    status?: 'emitida' | 'enviada' | 'cancelada'
    sent_via?: 'email' | 'whatsapp' | 'sms' | 'nenhum'
    sent_at?: string
  },
): Promise<PrescriptionRecord> => {
  return await pb.collection('prescriptions').update<PrescriptionRecord>(id, data, {
    expand: 'patient_id,doctor_id',
  })
}

export const sendPrescriptionEmail = async (params: {
  prescriptionId?: string
  email: string
  patientName: string
  doctorName: string
  doctorCrm?: string
  medications: PrescriptionItem[]
}): Promise<{
  success: boolean
  emailSent: boolean
  simulated: boolean
  recipient: string
  message: string
  debugError?: string
}> => {
  return await pb.send('/backend/v1/send-prescription-email', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const buildWhatsAppPrescriptionUrl = (params: {
  phone?: string
  patientName: string
  doctorName: string
  doctorCrm?: string
  medications: PrescriptionItem[]
  prescriptionId?: string
}): string => {
  const cleanPhone = (params.phone || '').replace(/\D/g, '')
  // Brazilian phone format: add 55 if missing
  const phoneFormatted =
    cleanPhone.length >= 10 && !cleanPhone.startsWith('55') ? `55${cleanPhone}` : cleanPhone

  let text = `*RECEITA MÉDICA DIGITAL — RESULTA MÉDICOS*\n`
  text += `*Paciente:* ${params.patientName}\n`
  text += `*Médico:* Dr(a). ${params.doctorName}${params.doctorCrm ? ` (${params.doctorCrm})` : ''}\n`
  text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n`
  text += `*MEDICAMENTOS PRESCRITOS:*\n`

  params.medications.forEach((med, idx) => {
    text += `\n${idx + 1}. *${med.medication}*\n`
    text += `   • *Dosagem:* ${med.dosage}\n`
    if (med.frequency) text += `   • *Frequência:* ${med.frequency}\n`
    if (med.period_days) text += `   • *Duração:* ${med.period_days} dias\n`
    if (med.instructions) text += `   • *Orientações:* ${med.instructions}\n`
  })

  text += `\n_Documento emitido digitalmente pela plataforma Resulta Médicos._`

  const encodedText = encodeURIComponent(text)
  return phoneFormatted
    ? `https://wa.me/${phoneFormatted}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`
}

export const buildSmsPrescriptionText = (params: {
  patientName: string
  doctorName: string
  medications: PrescriptionItem[]
}): string => {
  let text = `Resulta Med: Receita Dr(a) ${params.doctorName} p/ ${params.patientName}:\n`
  params.medications.forEach((m, i) => {
    text += `${i + 1}) ${m.medication} ${m.dosage}`
    if (m.frequency) text += ` - ${m.frequency}`
    if (m.period_days) text += ` (${m.period_days}d)`
    if (m.instructions) text += ` [${m.instructions}]`
    text += '\n'
  })
  return text.trim()
}
