// Hook que notifica clínicas e pacientes quando concessões de acesso 24h são criadas ou revogadas
// e mantém sincronia com a coleção notifications e access_audit_log

onRecordAfterCreateSuccess((e) => {
  try {
    const grant = e.record
    const patientId = grant.getString('patient')
    const grantedToUserId = grant.getString('granted_to_user')
    const targetName = grant.getString('target_name') || 'Médico'
    const targetRole = grant.getString('target_role') || 'doctor'
    const status = grant.getString('status') || 'ativa'

    // Obter nome do paciente
    let patientName = 'Paciente'
    if (patientId) {
      try {
        const patRec = $app.findCollectionByNameOrId('patients')
        const p = $app.findRecordById(patRec, patientId)
        if (p) patientName = p.getString('name') || 'Paciente'
      } catch (_) {}
    }

    // Se o médico envolvido foi informado, buscar seu nome e verificar vínculo
    let doctorName = targetName
    if (grantedToUserId) {
      try {
        const u = $app.findRecordById(
          $app.findCollectionByNameOrId('_pb_users_auth_'),
          grantedToUserId,
        )
        if (u && u.getString('name')) {
          doctorName = u.getString('name')
        }
      } catch (_) {}
    }

    // Identificar contas de clínica para notificar
    // Notifica clínicas ativas na plataforma (ex: role = 'clinic')
    const clinicUsers = $app.findRecordsByFilter(
      '_pb_users_auth_',
      "role = 'clinic'",
      '-created',
      10,
      0,
    )
    const notifCol = $app.findCollectionByNameOrId('notifications')

    for (let i = 0; i < clinicUsers.length; i++) {
      const clinicUser = clinicUsers[i]
      const nRec = new Record(notifCol)
      nRec.set('user', clinicUser.id)
      nRec.set('title', 'Nova Concessão de Acesso 24h: ' + doctorName)
      nRec.set(
        'message',
        'Concessão de acesso concedida pelo paciente ' +
          patientName +
          ' para ' +
          doctorName +
          ' (' +
          targetRole +
          '). Status: ' +
          status +
          '.',
      )
      nRec.set('type', 'info')
      nRec.set('read', false)
      nRec.set('link', '/clinic#concessoes')
      $app.save(nRec)
    }

    // Registrar no access_audit_log se não houver registro recente desse evento
    if (patientId) {
      try {
        const auditCol = $app.findCollectionByNameOrId('access_audit_log')
        const auditRec = new Record(auditCol)
        auditRec.set('patient', patientId)
        if (grantedToUserId) auditRec.set('actor_user', grantedToUserId)
        auditRec.set('actor_name', doctorName)
        auditRec.set('actor_role', targetRole)
        auditRec.set('action', 'concedeu_24h')
        auditRec.set('resource', 'Concessão Modelo Aberto 24h')
        auditRec.set(
          'details',
          'Notificação enviada à clínica. Acesso concedido para ' +
            doctorName +
            ' ao paciente ' +
            patientName,
        )
        auditRec.set('ip_address', 'Sistema / Backend Hook')
        $app.save(auditRec)
      } catch (errAudit) {
        console.log('Erro ao gravar audit_log na criação de grant: ' + errAudit.message)
      }
    }
  } catch (err) {
    console.log('Erro no hook de criação de access_grants: ' + err.message)
  }

  return e.next()
}, 'access_grants')

onRecordAfterUpdateSuccess((e) => {
  try {
    const grant = e.record
    const originalStatus = grant.original().getString('status')
    const newStatus = grant.getString('status')

    // Só dispara se o status mudou para 'revogada'
    if (newStatus === 'revogada' && originalStatus !== 'revogada') {
      const patientId = grant.getString('patient')
      const grantedToUserId = grant.getString('granted_to_user')
      const targetName = grant.getString('target_name') || 'Médico'
      const targetRole = grant.getString('target_role') || 'doctor'

      // Obter nome do paciente
      let patientName = 'Paciente'
      if (patientId) {
        try {
          const patRec = $app.findCollectionByNameOrId('patients')
          const p = $app.findRecordById(patRec, patientId)
          if (p) patientName = p.getString('name') || 'Paciente'
        } catch (_) {}
      }

      let doctorName = targetName
      if (grantedToUserId) {
        try {
          const u = $app.findRecordById(
            $app.findCollectionByNameOrId('_pb_users_auth_'),
            grantedToUserId,
          )
          if (u && u.getString('name')) {
            doctorName = u.getString('name')
          }
        } catch (_) {}
      }

      // Notificar contas de clínica
      const clinicUsers = $app.findRecordsByFilter(
        '_pb_users_auth_',
        "role = 'clinic'",
        '-created',
        10,
        0,
      )
      const notifCol = $app.findCollectionByNameOrId('notifications')

      for (let i = 0; i < clinicUsers.length; i++) {
        const clinicUser = clinicUsers[i]
        const nRec = new Record(notifCol)
        nRec.set('user', clinicUser.id)
        nRec.set('title', 'Concessão Revogada: ' + doctorName)
        nRec.set(
          'message',
          'O acesso de 24h para ' +
            doctorName +
            ' junto ao paciente ' +
            patientName +
            ' foi revogado.',
        )
        nRec.set('type', 'warning')
        nRec.set('read', false)
        nRec.set('link', '/clinic#concessoes')
        $app.save(nRec)
      }

      // Gravar auditoria da revogação
      if (patientId) {
        try {
          const auditCol = $app.findCollectionByNameOrId('access_audit_log')
          const auditRec = new Record(auditCol)
          auditRec.set('patient', patientId)
          if (grantedToUserId) auditRec.set('actor_user', grantedToUserId)
          auditRec.set('actor_name', doctorName)
          auditRec.set('actor_role', targetRole)
          auditRec.set('action', 'revogou')
          auditRec.set('resource', 'Concessão de Acesso Revogada')
          auditRec.set(
            'details',
            'Notificação enviada à clínica. Permissão revogada para ' +
              doctorName +
              ' ao paciente ' +
              patientName,
          )
          auditRec.set('ip_address', 'Sistema / Backend Hook')
          $app.save(auditRec)
        } catch (errAudit) {
          console.log('Erro ao gravar audit_log na revogação de grant: ' + errAudit.message)
        }
      }
    }
  } catch (err) {
    console.log('Erro no hook de update de access_grants: ' + err.message)
  }

  return e.next()
}, 'access_grants')
