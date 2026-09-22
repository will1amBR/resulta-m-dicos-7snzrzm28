import pb from '@/lib/pocketbase/client'
import { CrmLead, CrmStage, Patient } from '@/types/clinical'
import { createPatient } from '@/services/patients'

export async function getCrmLeads(): Promise<CrmLead[]> {
  const records = await pb.collection('crm_leads').getFullList<CrmLead>({
    sort: '-created',
    expand: 'patient',
  })
  return records
}

export async function createCrmLead(data: Partial<CrmLead>): Promise<CrmLead> {
  const record = await pb.collection('crm_leads').create<CrmLead>({
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    interest_specialty: data.interest_specialty || '',
    stage: data.stage || 'lead_novo',
    patient: data.patient || null,
    source: data.source || 'Recepção / WhatsApp',
    notes: data.notes || '',
    estimated_value: data.estimated_value || 0,
    last_contact_at: data.last_contact_at || new Date().toISOString(),
  })
  return record
}

export async function updateCrmLeadStage(leadId: string, stage: CrmStage): Promise<CrmLead> {
  const record = await pb.collection('crm_leads').update<CrmLead>(leadId, {
    stage,
    last_contact_at: new Date().toISOString(),
  })
  return record
}

export async function updateCrmLead(leadId: string, data: Partial<CrmLead>): Promise<CrmLead> {
  const record = await pb.collection('crm_leads').update<CrmLead>(leadId, data)
  return record
}

export async function deleteCrmLead(leadId: string): Promise<boolean> {
  await pb.collection('crm_leads').delete(leadId)
  return true
}

// Converter Lead em Paciente no Sistema
export async function convertLeadToPatient(
  lead: CrmLead,
  additionalData?: { cpf?: string; birthDate?: string; insurance?: string },
): Promise<{ patient: Patient; lead: CrmLead }> {
  // 1. Criar registro oficial de paciente
  // Gerar CPF fictício se não informado para permitir criação
  const generatedCpf =
    additionalData?.cpf || `CRM-${Math.floor(10000000000 + Math.random() * 90000000000)}`
  const patient = await createPatient({
    name: lead.name,
    phone: lead.phone || '',
    email: lead.email || '',
    cpf: generatedCpf,
    birth_date: additionalData?.birthDate || undefined,
    insurance: additionalData?.insurance || 'Particular',
  })

  // 2. Atualizar o lead vinculando ao paciente e movendo para "paciente_ativo"
  const updatedLead = await pb.collection('crm_leads').update<CrmLead>(lead.id, {
    patient: patient.id,
    stage: 'paciente_ativo',
    notes:
      `${lead.notes || ''}\n[Convertido em paciente oficial do sistema em ${new Date().toLocaleDateString('pt-BR')}]`.trim(),
  })

  return { patient, lead: updatedLead }
}
