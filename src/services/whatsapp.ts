import pb from '@/lib/pocketbase/client'
import { WhatsAppQueueItem, WhatsAppMessageType } from '@/types/clinical'

export interface WhatsAppTemplate {
  id: string
  name: string
  type: WhatsAppMessageType
  title: string
  body: string
  variables: string[]
}

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tmpl_confirmacao',
    name: 'Confirmação de Consulta',
    type: 'confirmacao_consulta',
    title: 'Confirmação de Agendamento',
    body: 'Olá, {nome_paciente}! Sua consulta na {clinica} está confirmada para {data} às {horario} com o(a) Dr(a). {medico}. Caso precise remarcar, por favor nos avise com antecedência.',
    variables: ['{nome_paciente}', '{clinica}', '{data}', '{horario}', '{medico}'],
  },
  {
    id: 'tmpl_lembrete',
    name: 'Lembrete de Consulta (Véspera)',
    type: 'lembrete_consulta',
    title: 'Lembrete de Consulta para Amanhã',
    body: 'Olá, {nome_paciente}! Passando para lembrar da sua consulta agendada para amanhã, {data}, às {horario} com Dr(a). {medico} na {clinica}. Por favor responda com "1" para confirmar sua presença.',
    variables: ['{nome_paciente}', '{clinica}', '{data}', '{horario}', '{medico}'],
  },
  {
    id: 'tmpl_documento',
    name: 'Envio de Documento / Receita',
    type: 'envio_documento',
    title: 'Receita Médica & Documento Digital',
    body: 'Olá, {nome_paciente}! Sua receita/documento médico emitido na {clinica} por Dr(a). {medico} já está disponível no seu portal. Acesse pelo link ou apresente na farmácia credenciada.',
    variables: ['{nome_paciente}', '{clinica}', '{medico}'],
  },
  {
    id: 'tmpl_retorno',
    name: 'Lembrete de Retorno',
    type: 'retorno_agendado',
    title: 'Agendamento de Retorno',
    body: 'Olá, {nome_paciente}! Já se passaram 30 dias desde seu atendimento na {clinica} com Dr(a). {medico}. Gostaríamos de saber como está sua evolução e agendar seu retorno de acompanhamento.',
    variables: ['{nome_paciente}', '{clinica}', '{medico}'],
  },
  {
    id: 'tmpl_aniversario',
    name: 'Mensagem de Aniversário',
    type: 'aniversario',
    title: 'Parabéns e Felicitações',
    body: 'Parabéns, {nome_paciente}! Toda a equipe da {clinica} deseja a você um feliz aniversário, com muita saúde, paz e bem-estar!',
    variables: ['{nome_paciente}', '{clinica}'],
  },
]

export function formatWhatsAppPhone(phone: string): string {
  // Limpa caracteres não numéricos
  const clean = phone.replace(/\D/g, '')
  if (!clean) return ''
  // Adiciona código do país se necessário (55 para Brasil)
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`
  }
  return clean
}

export function buildWaMeUrl(phone: string, text: string): string {
  const formattedPhone = formatWhatsAppPhone(phone)
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
}

export function fillTemplateVariables(
  templateText: string,
  data: {
    nome_paciente?: string
    clinica?: string
    data?: string
    horario?: string
    medico?: string
  },
): string {
  return templateText
    .replace(/{nome_paciente}/g, data.nome_paciente || 'Paciente')
    .replace(/{clinica}/g, data.clinica || 'Resulta Clínica')
    .replace(/{data}/g, data.data || 'data agendada')
    .replace(/{horario}/g, data.horario || 'horário marcado')
    .replace(/{medico}/g, data.medico || 'Corpo Clínico')
}

export async function getWhatsAppQueue(limit = 50): Promise<WhatsAppQueueItem[]> {
  const records = await pb.collection('whatsapp_queue').getList<WhatsAppQueueItem>(1, limit, {
    sort: '-created',
    expand: 'patient',
  })
  return records.items
}

export async function addToWhatsAppQueue(data: {
  phone: string
  recipient_name: string
  patientId?: string
  type: WhatsAppMessageType
  message: string
  scheduledFor?: string
  notes?: string
}): Promise<WhatsAppQueueItem> {
  const record = await pb.collection('whatsapp_queue').create<WhatsAppQueueItem>({
    phone: data.phone,
    recipient_name: data.recipient_name,
    patient: data.patientId || null,
    type: data.type,
    message: data.message,
    status: 'pendente',
    scheduled_for: data.scheduledFor || new Date().toISOString(),
    notes: data.notes || '',
  })
  return record
}

export async function markWhatsAppMessageSent(id: string): Promise<WhatsAppQueueItem> {
  const record = await pb.collection('whatsapp_queue').update<WhatsAppQueueItem>(id, {
    status: 'enviada',
    sent_at: new Date().toISOString(),
  })
  return record
}

export async function deleteWhatsAppQueueItem(id: string): Promise<boolean> {
  await pb.collection('whatsapp_queue').delete(id)
  return true
}
