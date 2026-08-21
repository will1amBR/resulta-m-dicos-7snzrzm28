migrate(
  (app) => {
    const appointmentsCol = app.findCollectionByNameOrId('appointments')

    // 1. Criar coleção teleconsulta_messages
    const messagesCol = new Collection({
      name: 'teleconsulta_messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'appointment',
          type: 'relation',
          required: true,
          collectionId: appointmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'sender',
          type: 'text',
          required: true,
        },
        {
          name: 'sender_name',
          type: 'text',
          required: false,
        },
        {
          name: 'sender_role',
          type: 'select',
          values: ['doctor', 'patient', 'system'],
          maxSelect: 1,
          required: false,
        },
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_teleconsulta_messages_appt ON teleconsulta_messages (appointment, created ASC)',
      ],
    })
    app.save(messagesCol)

    // 2. Garantir consulta demo ativa entre o médico demo e paciente demo
    var demoDoctor = null
    try {
      demoDoctor = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico@resulta.med')
    } catch (_) {}

    var demoPatient = null
    try {
      demoPatient = app.findFirstRecordByData('patients', 'cpf', '999.888.777-66')
    } catch (_) {}

    if (demoDoctor && demoPatient) {
      // Procurar consulta do demo paciente com demo medico
      var existingDemoAppt = null
      try {
        var appts = app.findRecordsByFilter(
          'appointments',
          "doctor = '" + demoDoctor.id + "' && patient = '" + demoPatient.id + "'",
          '-created',
          1,
          0,
        )
        if (appts && appts.length > 0) {
          existingDemoAppt = appts[0]
        }
      } catch (_) {}

      if (!existingDemoAppt) {
        var today = new Date()
        var newAppt = new Record(appointmentsCol)
        newAppt.set('doctor', demoDoctor.id)
        newAppt.set('patient', demoPatient.id)
        newAppt.set('date_time', today.toISOString())
        newAppt.set('status', 'confirmada')
        newAppt.set('reason', 'Teleconsulta Demo - Avaliação Geral')
        newAppt.set('notes', 'Teleconsulta ativa para teste em tempo real.')
        app.save(newAppt)
        existingDemoAppt = newAppt
      }

      // Adicionar mensagem inicial do sistema se ainda não houver mensagens
      if (existingDemoAppt) {
        try {
          var msgs = app.findRecordsByFilter(
            'teleconsulta_messages',
            "appointment = '" + existingDemoAppt.id + "'",
            'created',
            1,
            0,
          )
          if (msgs.length === 0) {
            var initMsg = new Record(messagesCol)
            initMsg.set('appointment', existingDemoAppt.id)
            initMsg.set('sender', 'Sistema')
            initMsg.set('sender_name', 'Sistema Resulta')
            initMsg.set('sender_role', 'system')
            initMsg.set('text', 'Sala virtual segura estabelecida conforme padrão CFM.')
            app.save(initMsg)
          }
        } catch (_) {}
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('teleconsulta_messages')
      app.delete(col)
    } catch (_) {}
  },
)
