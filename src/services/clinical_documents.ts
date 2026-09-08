import pb from '@/lib/pocketbase/client'
import { ClinicalDocument, ClinicalDocumentType } from '@/types/clinical'

export function generateDocumentVerificationCode(type: ClinicalDocumentType): string {
  let prefix = 'DC'
  if (type === 'atestado') prefix = 'AT'
  else if (type === 'laudo') prefix = 'LA'
  else if (type === 'encaminhamento') prefix = 'EN'
  else if (type === 'declaracao') prefix = 'DC'

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${part1}-${part2}`
}

export function getDocumentVerificationUrl(verificationCode: string): string {
  const origin = window.location.origin
  return `${origin}/consulta-receita?code=${encodeURIComponent(verificationCode)}`
}

export async function getDoctorClinicalDocuments(
  doctorId?: string,
  options?: { search?: string; type?: string },
): Promise<ClinicalDocument[]> {
  const filters: string[] = []
  if (doctorId) {
    filters.push(`doctor = '${doctorId}'`)
  }
  if (options?.type && options.type !== 'todos') {
    filters.push(`type = '${options.type}'`)
  }

  const filter = filters.length > 0 ? filters.join(' && ') : ''

  const records = await pb.collection('clinical_documents').getList<ClinicalDocument>(1, 100, {
    filter,
    sort: '-created',
    expand: 'doctor,patient',
  })

  let items = records.items
  if (options?.search) {
    const q = options.search.toLowerCase()
    items = items.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(q) ||
        doc.expand?.patient?.name?.toLowerCase().includes(q) ||
        doc.verification_code?.toLowerCase().includes(q) ||
        doc.content?.toLowerCase().includes(q),
    )
  }
  return items
}

export async function createClinicalDocument(data: {
  doctorId: string
  patientId: string
  type: ClinicalDocumentType
  title: string
  content: string
  cid10?: string
  restDays?: number
  specialtyTarget?: string
  certificateValidated?: boolean
}): Promise<ClinicalDocument> {
  const verificationCode = generateDocumentVerificationCode(data.type)

  const created = await pb.collection('clinical_documents').create<ClinicalDocument>({
    doctor: data.doctorId,
    patient: data.patientId,
    type: data.type,
    title: data.title,
    content: data.content,
    cid10: data.cid10 || '',
    rest_days: data.restDays || 0,
    specialty_target: data.specialtyTarget || '',
    verification_code: verificationCode,
    certificate_validated: !!data.certificateValidated,
    status: 'emitido',
    sent_via: 'nenhum',
  })

  return created
}

export async function getClinicalDocumentByVerificationCode(
  code: string,
): Promise<ClinicalDocument | null> {
  const cleanCode = code.trim().toUpperCase()
  try {
    const record = await pb
      .collection('clinical_documents')
      .getFirstListItem<ClinicalDocument>(`verification_code = '${cleanCode}'`, {
        expand: 'doctor,patient',
      })
    return record
  } catch {
    return null
  }
}

export async function updateClinicalDocumentStatus(
  documentId: string,
  status: 'emitido' | 'enviado' | 'cancelado',
  sentVia?: 'email' | 'whatsapp' | 'sms' | 'nenhum',
): Promise<ClinicalDocument> {
  const updateData: any = { status }
  if (sentVia) {
    updateData.sent_via = sentVia
    updateData.sent_at = new Date().toISOString()
  }
  return await pb.collection('clinical_documents').update<ClinicalDocument>(documentId, updateData)
}
