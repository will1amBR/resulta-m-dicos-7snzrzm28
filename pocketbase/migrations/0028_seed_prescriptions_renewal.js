migrate(
  (app) => {
    // 1. Atualizar campos da coleção prescriptions para suportar renovação de receitas
    const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')

    // Atualizar opções do status para incluir 'aguardando_renovacao' e 'rejeitada'
    const statusField = prescriptionsCol.fields.getByName('status')
    if (statusField) {
      statusField.values = ['emitida', 'enviada', 'aguardando_renovacao', 'cancelada', 'rejeitada']
    }

    if (!prescriptionsCol.fields.getByName('renewal_requested_at')) {
      prescriptionsCol.fields.add(
        new DateField({
          name: 'renewal_requested_at',
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('renewal_justification')) {
      prescriptionsCol.fields.add(
        new TextField({
          name: 'renewal_justification',
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('renewal_patient_notes')) {
      prescriptionsCol.fields.add(
        new TextField({
          name: 'renewal_patient_notes',
        }),
      )
    }

    app.save(prescriptionsCol)

    // 2. Popular prescrições de exemplo (incluindo receitas com status 'aguardando_renovacao')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const patientsCol = app.findCollectionByNameOrId('patients')

    let doctorId = ''
    try {
      const doc = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico@resulta.med')
      doctorId = doc.id
    } catch (_) {
      try {
        const adminDoc = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
        doctorId = adminDoc.id
      } catch (_) {}
    }

    let demoPatientId = ''
    let patientAnaId = ''
    let patientCarlosId = ''
    try {
      const p1 = app.findFirstRecordByData('patients', 'cpf', '999.888.777-66')
      demoPatientId = p1.id
    } catch (_) {}

    try {
      const p2 = app.findFirstRecordByData('patients', 'cpf', '111.222.333-44')
      patientAnaId = p2.id
    } catch (_) {}

    try {
      const p3 = app.findFirstRecordByData('patients', 'cpf', '222.333.444-55')
      patientCarlosId = p3.id
    } catch (_) {}

    if (doctorId && demoPatientId) {
      // Receita 1: Aguardando renovação (Omeprazol)
      try {
        const r1 = new Record(prescriptionsCol)
        r1.set('patient_id', demoPatientId)
        r1.set('doctor_id', doctorId)
        r1.set('medications', [
          {
            medication: 'Omeprazol 20mg',
            dosage: '1 cápsula ao dia em jejum',
            frequency: '1x ao dia pela manhã',
            period_days: 60,
            instructions: 'Tomar 30 minutos antes do café da manhã.',
          },
        ])
        r1.set('status', 'aguardando_renovacao')
        r1.set('certificate_validated', true)
        r1.set('sent_via', 'email')
        r1.set('renewal_requested_at', new Date().toISOString())
        r1.set(
          'renewal_patient_notes',
          'Faço uso contínuo para gastrite e a medicação está acabando nesta semana.',
        )
        r1.set('notes', 'Uso contínuo gástrico.')
        app.save(r1)
      } catch (_) {}

      // Receita 2: Aguardando renovação (Losartana + Hidroclorotiazida)
      if (patientAnaId) {
        try {
          const r2 = new Record(prescriptionsCol)
          r2.set('patient_id', patientAnaId)
          r2.set('doctor_id', doctorId)
          r2.set('medications', [
            {
              medication: 'Losartana Potássica 50mg',
              dosage: '1 cp VO 1x/dia',
              frequency: 'Pela manhã',
              period_days: 90,
              instructions: 'Uso contínuo anti-hipertensivo.',
            },
            {
              medication: 'Hidroclorotiazida 25mg',
              dosage: '1 cp VO 1x/dia',
              frequency: 'Junto com Losartana',
              period_days: 90,
              instructions: 'Manter controle diário da pressão.',
            },
          ])
          r2.set('status', 'aguardando_renovacao')
          r2.set('certificate_validated', true)
          r2.set('sent_via', 'whatsapp')
          r2.set('renewal_requested_at', new Date().toISOString())
          r2.set(
            'renewal_patient_notes',
            'Solicito renovação trimestral para compra na farmácia popular.',
          )
          app.save(r2)
        } catch (_) {}
      }

      // Receita 3: Enviada / Ativa (Rosuvastatina)
      try {
        const r3 = new Record(prescriptionsCol)
        r3.set('patient_id', demoPatientId)
        r3.set('doctor_id', doctorId)
        r3.set('medications', [
          {
            medication: 'Rosuvastatina Cálcica 10mg',
            dosage: '1 comprimido à noite',
            frequency: '1x ao dia',
            period_days: 30,
            instructions: 'Tomar antes de deitar.',
          },
        ])
        r3.set('status', 'enviada')
        r3.set('certificate_validated', true)
        r3.set('sent_via', 'whatsapp')
        r3.set('sent_at', new Date().toISOString())
        r3.set('notes', 'Controle de colesterol LDL.')
        app.save(r3)
      } catch (_) {}
    }
  },
  (app) => {},
)
