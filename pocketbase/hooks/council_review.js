// Central de Aprovações: revisão de novos cadastros de profissionais (Conselho).
// PATCH /backend/v1/clinic/users/{id}/review-council
// Body: { action: 'approve' | 'reject', justification?: string }
// Regras de acesso: admin, clinic ou secretaria. Cria notificação in-app para o profissional.

routerAdd(
  'PATCH',
  '/backend/v1/clinic/users/{id}/review-council',
  (e) => {
    const userId = e.request.pathValue('id')
    if (!userId) return e.badRequestError('user id is required')

    const authRecord = e.auth
    if (!authRecord) return e.unauthorizedError('auth required')

    const isSuperuser = e.hasSuperuserAuth()
    let roleVal = ''
    try {
      roleVal = (authRecord.get('role') || '').toString().toLowerCase()
    } catch (_) {}

    const allowed =
      isSuperuser || roleVal === 'admin' || roleVal === 'clinic' || roleVal === 'secretaria'
    if (!allowed) {
      return e.forbiddenError('Apenas clínica, secretaria ou admin podem revisar conselhos.')
    }

    let body = {}
    try {
      body = e.requestInfo().body
    } catch (_) {}

    const action = (body.action || '').toString().toLowerCase()
    const justification = (body.justification || '').toString().trim()

    if (action !== 'approve' && action !== 'reject') {
      return e.badRequestError("Ação inválida: use 'approve' ou 'reject'.")
    }
    if (action === 'reject' && justification.length < 5) {
      return e.badRequestError('Justificativa obrigatória para rejeitar (mínimo 5 caracteres).')
    }

    let record
    try {
      record = $app.findRecordById('_pb_users_auth_', userId)
    } catch (_) {
      return e.notFoundError('Usuário não encontrado.')
    }

    const targetRole = (record.get('role') || '').toString()
    if (targetRole !== 'doctor') {
      return e.badRequestError('Somente cadastros de médicos podem ser revisados aqui.')
    }

    if (record.getBool('council_approved') && action === 'approve') {
      return e.json(200, { success: true, already_approved: true })
    }

    try {
      if (action === 'approve') {
        record.set('council_approved', true)
        $app.save(record)

        const notifCol = $app.findCollectionByNameOrId('notifications')
        const nRec = new Record(notifCol)
        nRec.set('user', record.id)
        nRec.set('title', 'Conselho profissional validado')
        nRec.set(
          'message',
          'Seu conselho ' +
            record.get('council_type') +
            ' ' +
            record.get('council_number') +
            ' foi validado pela clínica. Você já pode emitir documentos com validação plena.',
        )
        nRec.set('type', 'success')
        nRec.set('read', false)
        nRec.set('link', '/dashboard')
        $app.save(nRec)

        return e.json(200, { success: true, council_approved: true })
      }

      // reject: limpa dados do conselho e pede recadastro/correção
      record.set('council_approved', false)
      record.set('council_type', '')
      record.set('council_number', '')
      record.set('crm', '')
      $app.save(record)

      const notifCol = $app.findCollectionByNameOrId('notifications')
      const nRec = new Record(notifCol)
      nRec.set('user', record.id)
      nRec.set('title', 'Cadastro do conselho não validado')
      nRec.set(
        'message',
        'Justificativa da clínica: ' +
          justification +
          ' — Por favor, verifique e corrija os dados do seu conselho profissional em Configurações e recadastre, ou entre em contato com a secretaria.',
      )
      nRec.set('type', 'warning')
      nRec.set('read', false)
      nRec.set('link', '/configuracoes')
      $app.save(nRec)

      return e.json(200, { success: true, rejected: true })
    } catch (err) {
      console.log('Erro em review-council: ' + err.message)
      return e.badRequestError('Falha ao processar a revisão: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
