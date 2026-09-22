onRecordAfterCreateSuccess((e) => {
  const patientId = e.record.getString('patient')
  if (!patientId) return e.next()

  const action = e.record.getString('action') || 'consultou'
  const actorName = e.record.getString('actor_name') || 'Profissional de Saúde'
  const actorRole = e.record.getString('actor_role') || 'médico'
  const resource = e.record.getString('resource') || 'Histórico Clínico'
  const details = e.record.getString('details') || ''

  try {
    // Localiza o usuário cadastrado vinculado a este paciente (patient_link)
    let patientUser = null
    try {
      patientUser = $app.findFirstRecordByFilter('users', 'patient_link = {:pid}', {
        pid: patientId,
      })
    } catch (_) {
      patientUser = null
    }

    if (patientUser) {
      let notifTitle = 'Histórico Clínico Acessado'
      let notifMessage =
        'O profissional ' +
        actorName +
        ' (' +
        actorRole +
        ') consultou seu prontuário (' +
        resource +
        ').'
      let notifType = 'info'

      if (action === 'consultou') {
        notifTitle = 'Histórico Consultado: ' + actorName
        notifMessage =
          'O profissional ' +
          actorName +
          ' consultou seu histórico (' +
          resource +
          ')' +
          (details ? ' - ' + details : '') +
          '.'
        notifType = 'info'
      } else if (action === 'concedeu_24h') {
        notifTitle = 'Acesso 24h Liberado'
        notifMessage =
          'Concessão de 24 horas ativada para ' +
          actorName +
          '. Acesso válido até o término do período.'
        notifType = 'success'
      } else if (action === 'revogou') {
        notifTitle = 'Acesso Revogado'
        notifMessage = 'A permissão de acesso para ' + actorName + ' foi revogada com sucesso.'
        notifType = 'warning'
      } else if (action === 'solicitou') {
        notifTitle = 'Solicitação de Acesso Pendente'
        notifMessage =
          actorName +
          ' solicitou autorização de 24 horas para consultar seu histórico. Clique para responder.'
        notifType = 'warning'
      } else if (action === 'negou') {
        notifTitle = 'Solicitação Negada'
        notifMessage = 'A solicitação de acesso para ' + actorName + ' foi recusada.'
        notifType = 'info'
      }

      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notifRec = new Record(notifCol)
      notifRec.set('user', patientUser.id)
      notifRec.set('title', notifTitle)
      notifRec.set('message', notifMessage)
      notifRec.set('type', notifType)
      notifRec.set('read', false)
      notifRec.set('link', '/patient/acessos')
      $app.save(notifRec)
    }
  } catch (err) {
    console.log('Erro ao processar notificação de auditoria de acesso: ' + err.message)
  }

  return e.next()
}, 'access_audit_log')
