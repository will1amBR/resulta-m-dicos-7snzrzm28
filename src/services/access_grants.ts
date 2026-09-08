import pb from '@/lib/pocketbase/client'
import { AccessGrant, AccessAuditLog } from '@/types/clinical'

/**
 * Retorna as concessões de acesso para um determinado paciente
 */
export async function getPatientAccessGrants(patientId: string): Promise<AccessGrant[]> {
  const records = await pb.collection('access_grants').getList<AccessGrant>(1, 50, {
    filter: `patient = '${patientId}'`,
    sort: '-created',
    expand: 'granted_to_user,patient',
  })
  return records.items
}

/**
 * Verifica se um médico ou clínica possui autorização ativa para acessar o paciente
 */
export async function checkActiveAccessGrant(
  patientId: string,
  userId?: string,
): Promise<{ hasAccess: boolean; grant?: AccessGrant }> {
  try {
    const nowIso = new Date().toISOString()
    let filter = `patient = '${patientId}' && status = 'ativa' && expires_at > '${nowIso}'`
    if (userId) {
      filter += ` && granted_to_user = '${userId}'`
    }
    const list = await pb.collection('access_grants').getList<AccessGrant>(1, 1, {
      filter,
      sort: '-created',
    })

    if (list.items.length > 0) {
      return { hasAccess: true, grant: list.items[0] }
    }
    return { hasAccess: false }
  } catch {
    return { hasAccess: false }
  }
}

/**
 * Concede ou renova acesso por 24 horas (Pilar Modelo Aberto da ClueMed)
 */
export async function grantAccess24h(data: {
  patientId: string
  userId?: string
  targetName: string
  targetRole: 'doctor' | 'clinic' | 'other'
  scope?: string
  reason?: string
}): Promise<AccessGrant> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const payload: any = {
    patient: data.patientId,
    target_name: data.targetName,
    target_role: data.targetRole,
    scope: data.scope || 'prontuario,exames,prescricoes',
    status: 'ativa',
    reason: data.reason || 'Autorização clínica de 24 horas concedida pelo paciente',
    expires_at: in24h.toISOString(),
  }
  if (data.userId) {
    payload.granted_to_user = data.userId
  }

  const created = await pb.collection('access_grants').create<AccessGrant>(payload)

  // Registrar em log de auditoria
  await logAccessAudit({
    patientId: data.patientId,
    actorName: 'Paciente',
    actorRole: 'patient',
    action: 'concedeu_24h',
    resource: 'Autorização de Acesso 24 Horas',
    details: `Autorização válida até ${in24h.toLocaleString('pt-BR')} para ${data.targetName}`,
  })

  return created
}

/**
 * Revoga imediatamente uma concessão ativa
 */
export async function revokeAccessGrant(grantId: string, patientId: string): Promise<void> {
  const now = new Date().toISOString()
  await pb.collection('access_grants').update(grantId, {
    status: 'revogada',
    revoked_at: now,
  })

  // Log de auditoria
  await logAccessAudit({
    patientId,
    actorName: 'Paciente',
    actorRole: 'patient',
    action: 'revogou',
    resource: 'Autorização de Acesso',
    details: `Concessão #${grantId} revogada imediatamente pelo paciente`,
  })
}

/**
 * Médico ou clínica solicita autorização de acesso ao paciente
 */
export async function requestPatientAccess(data: {
  patientId: string
  doctorUserId: string
  doctorName: string
  role?: 'doctor' | 'clinic'
  reason: string
}): Promise<AccessGrant> {
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const created = await pb.collection('access_grants').create<AccessGrant>({
    patient: data.patientId,
    granted_to_user: data.doctorUserId,
    target_name: data.doctorName,
    target_role: data.role || 'doctor',
    scope: 'prontuario,exames,prescricoes',
    status: 'pendente',
    reason: data.reason,
    expires_at: in24h.toISOString(),
  })

  await logAccessAudit({
    patientId: data.patientId,
    actorUser: data.doctorUserId,
    actorName: data.doctorName,
    actorRole: data.role || 'doctor',
    action: 'solicitou',
    resource: 'Solicitação de Acesso Clínico',
    details: `Motivo informado: ${data.reason}`,
  })

  return created
}

/**
 * Consulta histórico de auditoria do paciente
 */
export async function getAccessAuditLogs(patientId: string): Promise<AccessAuditLog[]> {
  const records = await pb.collection('access_audit_log').getList<AccessAuditLog>(1, 100, {
    filter: `patient = '${patientId}'`,
    sort: '-created',
  })
  return records.items
}

/**
 * Registra um evento no log de auditoria
 */
export async function logAccessAudit(data: {
  patientId: string
  actorUser?: string
  actorName: string
  actorRole: string
  action: 'consultou' | 'concedeu_24h' | 'revogou' | 'solicitou' | 'negou'
  resource: string
  details?: string
}): Promise<AccessAuditLog> {
  try {
    return await pb.collection('access_audit_log').create<AccessAuditLog>({
      patient: data.patientId,
      actor_user: data.actorUser || '',
      actor_name: data.actorName,
      actor_role: data.actorRole,
      action: data.action,
      resource: data.resource,
      details: data.details || '',
      ip_address: '189.40.12.88 (Brasil - Seguro LGPD)',
    })
  } catch (err) {
    console.warn('Erro ao registrar auditoria de acesso:', err)
    return {} as AccessAuditLog
  }
}
