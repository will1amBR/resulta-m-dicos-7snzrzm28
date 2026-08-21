routerAdd(
  'POST',
  '/backend/v1/send-prescription-email',
  (e) => {
    const body = e.requestInfo().body || {}
    const prescriptionId = body.prescriptionId || ''
    const recipientEmail = body.email || ''
    const patientName = body.patientName || 'Paciente'
    const doctorName = body.doctorName || 'Médico Prescritor'
    const doctorCrm = body.doctorCrm || ''
    const medications = body.medications || []

    if (!recipientEmail) {
      return e.badRequestError('E-mail do destinatário é obrigatório')
    }

    let medsListHtml = ''
    let medsListText = ''
    for (var i = 0; i < medications.length; i++) {
      var m = medications[i]
      var medName = m.medication || m.name || 'Medicamento'
      var dosage = m.dosage || ''
      var freq = m.frequency ? ' - ' + m.frequency : ''
      var dur = m.period_days ? ' por ' + m.period_days + ' dias' : ''
      var notes = m.instructions
        ? '<br/><span style="color:#666;font-size:12px;">Orientações: ' + m.instructions + '</span>'
        : ''

      medsListHtml +=
        '<li style="margin-bottom: 12px; padding: 10px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #2563eb;">' +
        '<strong>' +
        medName +
        '</strong> — ' +
        dosage +
        freq +
        dur +
        notes +
        '</li>'

      medsListText +=
        '- ' +
        medName +
        ' (' +
        dosage +
        ')' +
        freq +
        dur +
        (m.instructions ? ' [Obs: ' + m.instructions + ']' : '') +
        '\n'
    }

    const htmlBody =
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
      '<div style="background-color: #2563eb; color: #ffffff; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">' +
      '<h2 style="margin: 0; font-size: 20px;">Resulta Médicos — Receita Digital</h2>' +
      '<p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Documento de Prescrição Médica</p>' +
      '</div>' +
      '<p style="font-size: 14px;">Olá, <strong>' +
      patientName +
      '</strong>,</p>' +
      '<p style="font-size: 14px; color: #475569;">Segue abaixo sua receita médica digital emitida pelo profissional <strong>' +
      doctorName +
      '</strong>' +
      (doctorCrm ? ' (' + doctorCrm + ')' : '') +
      ':</p>' +
      '<div style="margin: 20px 0;">' +
      '<h3 style="font-size: 15px; color: #0f172a; margin-bottom: 10px;">Medicamentos Prescritos:</h3>' +
      '<ul style="list-style: none; padding: 0; margin: 0;">' +
      medsListHtml +
      '</ul>' +
      '</div>' +
      '<div style="margin-top: 24px; padding: 12px; background-color: #f1f5f9; border-radius: 6px; font-size: 12px; color: #64748b; text-align: center;">' +
      'Emitido digitalmente via Plataforma Resulta Médicos. Apresente este documento ou código à farmácia.' +
      '</div>' +
      '</div>'

    // Try sending email via PocketBase MailClient
    let sentSuccessfully = false
    let mailErrorMsg = ''
    try {
      const mailClient = $app.newMailClient()
      const message = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress || 'receitas@resulta.med',
          name: $app.settings().meta.senderName || 'Resulta Médicos',
        },
        to: [{ address: recipientEmail, name: patientName }],
        subject: 'Sua Receita Médica Digital — Dr(a). ' + doctorName,
        html: htmlBody,
        text:
          'Olá ' +
          patientName +
          ',\n\n' +
          'Segue sua receita médica emitida por ' +
          doctorName +
          ':\n\n' +
          medsListText +
          '\n\nResulta Médicos.',
      })

      mailClient.send(message)
      sentSuccessfully = true
    } catch (err) {
      mailErrorMsg = err ? err.toString() : 'SMTP não configurado'
    }

    // If prescriptionId provided, update the status in database
    if (prescriptionId) {
      try {
        const prescRecord = $app.findRecordById('prescriptions', prescriptionId)
        prescRecord.set('status', 'enviada')
        prescRecord.set('sent_via', 'email')
        prescRecord.set('sent_at', new Date().toISOString())
        $app.save(prescRecord)
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      emailSent: sentSuccessfully,
      simulated: !sentSuccessfully,
      recipient: recipientEmail,
      message: sentSuccessfully
        ? 'E-mail enviado com sucesso via SMTP!'
        : 'E-mail preparado com sucesso (simulado: configure o servidor SMTP no painel para envio real).',
      debugError: mailErrorMsg,
    })
  },
  $apis.requireAuth(),
)
