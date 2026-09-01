import pb from '@/lib/pocketbase/client'
import { PrescriptionRecord, PrescriptionItem, MedicationAlert } from '@/types/clinical'

export interface CreatePrescriptionData {
  patient_id: string
  doctor_id: string
  medications: PrescriptionItem[]
  certificate_validated: boolean
  verification_code?: string
  notes?: string
  ai_alerts?: MedicationAlert[]
  status?: 'emitida' | 'enviada' | 'cancelada'
  sent_via?: 'email' | 'whatsapp' | 'sms' | 'nenhum'
}

export const generatePrescriptionVerificationCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `RX-${part1}-${part2}`
}

export const getVerificationUrl = (verificationCode?: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  if (!verificationCode) return `${origin}/consulta-receita`
  return `${origin}/receitas/verificar/${encodeURIComponent(verificationCode)}`
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
  const code = data.verification_code || generatePrescriptionVerificationCode()
  return await pb.collection('prescriptions').create<PrescriptionRecord>(
    {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      medications: data.medications,
      certificate_validated: data.certificate_validated,
      verification_code: code,
      notes: data.notes || '',
      ai_alerts: data.ai_alerts || [],
      status: data.status || 'emitida',
      sent_via: data.sent_via || 'nenhum',
    },
    { expand: 'patient_id,doctor_id' },
  )
}

export const getPrescriptionByVerificationCode = async (
  code: string,
): Promise<PrescriptionRecord | null> => {
  try {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return null

    // Try finding exact match by verification_code or id
    const result = await pb
      .collection('prescriptions')
      .getFirstListItem<PrescriptionRecord>(
        `verification_code = "${cleanCode}" || id = "${cleanCode}"`,
        {
          expand: 'patient_id,doctor_id',
        },
      )
    return result
  } catch (error) {
    console.error('Prescrição não encontrada por código de verificação:', error)
    return null
  }
}

export const updatePrescriptionStatus = async (
  id: string,
  data: {
    status?: 'emitida' | 'enviada' | 'aguardando_renovacao' | 'cancelada' | 'rejeitada'
    sent_via?: 'email' | 'whatsapp' | 'sms' | 'nenhum'
    sent_at?: string
    renewal_justification?: string
    notes?: string
  },
): Promise<PrescriptionRecord> => {
  return await pb.collection('prescriptions').update<PrescriptionRecord>(id, data, {
    expand: 'patient_id,doctor_id',
  })
}

export const getPendingRenewalPrescriptions = async (): Promise<PrescriptionRecord[]> => {
  try {
    const list = await pb.collection('prescriptions').getFullList<PrescriptionRecord>({
      filter: 'status = "aguardando_renovacao"',
      sort: '-renewal_requested_at,-created',
      expand: 'patient_id,doctor_id',
    })
    return list
  } catch (error) {
    console.error('Erro ao buscar receitas para renovação:', error)
    return []
  }
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
  verificationCode?: string
}): string => {
  const cleanPhone = (params.phone || '').replace(/\D/g, '')
  // Brazilian phone format: add 55 if missing
  const phoneFormatted =
    cleanPhone.length >= 10 && !cleanPhone.startsWith('55') ? `55${cleanPhone}` : cleanPhone

  const code = params.verificationCode || params.prescriptionId
  const consultUrl = code ? getVerificationUrl(code) : ''

  let text = `*RECEITA MÉDICA DIGITAL — RESULTA MÉDICOS*\n`
  text += `*Paciente:* ${params.patientName}\n`
  text += `*Médico:* Dr(a). ${params.doctorName}${params.doctorCrm ? ` (${params.doctorCrm})` : ''}\n`
  text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`
  if (code) {
    text += `*Código de Verificação:* ${code}\n`
  }
  text += `\n*MEDICAMENTOS PRESCRITOS:*\n`

  params.medications.forEach((med, idx) => {
    text += `\n${idx + 1}. *${med.medication}*\n`
    text += `   • *Dosagem:* ${med.dosage}\n`
    if (med.frequency) text += `   • *Frequência:* ${med.frequency}\n`
    if (med.period_days) text += `   • *Duração:* ${med.period_days} dias\n`
    if (med.instructions) text += `   • *Orientações:* ${med.instructions}\n`
  })

  if (consultUrl) {
    text += `\n*Consulta e Validação Farmacêutica:*\n${consultUrl}\n`
  }
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
  verificationCode?: string
}): string => {
  let text = `Resulta Med: Receita Dr(a) ${params.doctorName} p/ ${params.patientName}:\n`
  params.medications.forEach((m, i) => {
    text += `${i + 1}) ${m.medication} ${m.dosage}`
    if (m.frequency) text += ` - ${m.frequency}`
    if (m.period_days) text += ` (${m.period_days}d)`
    if (m.instructions) text += ` [${m.instructions}]`
    text += '\n'
  })
  if (params.verificationCode) {
    text += `Cód Verificação: ${params.verificationCode} (${getVerificationUrl(params.verificationCode)})\n`
  }
  return text.trim()
}
