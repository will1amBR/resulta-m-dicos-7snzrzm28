migrate(
  (app) => {
    const specCol = app.findCollectionByNameOrId('specialties')
    const specList = [
      'Clínica Médica',
      'Cardiologia',
      'Pediatria',
      'Ginecologia e Obstetrícia',
      'Dermatologia',
      'Ortopedia',
      'Neurologia',
      'Oftalmologia',
      'Psiquiatria',
      'Gastroenterologia',
      'Endocrinologia',
      'Otorrinolaringologia',
      'Pneumologia',
      'Urologia',
      'Cirurgia Geral',
      'Nefrologia',
      'Oncologia',
      'Geriatria',
    ]
    let clinicaMedicaId = ''
    for (const specName of specList) {
      try {
        const existing = app.findFirstRecordByData('specialties', 'name', specName)
        if (specName === 'Clínica Médica') clinicaMedicaId = existing.id
      } catch (_) {
        const rec = new Record(specCol)
        rec.set('name', specName)
        app.save(rec)
        if (specName === 'Clínica Médica') clinicaMedicaId = rec.id
      }
    }

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let doctorUser = null
    try {
      doctorUser = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
    } catch (_) {
      doctorUser = new Record(usersCol)
      doctorUser.setEmail('william@korenambiental.com')
      doctorUser.setPassword('Skip@Pass')
      doctorUser.setVerified(true)
      doctorUser.set('name', 'Dr. William Koren')
      doctorUser.set('crm', '123456-SP')
      doctorUser.set('specialty', clinicaMedicaId)
      doctorUser.set('cpf_cnpj', '123.456.789-00')
      app.save(doctorUser)
    }

    const patientsCol = app.findCollectionByNameOrId('patients')
    const samplePatients = [
      {
        name: 'Ana Silva Santos',
        cpf: '111.222.333-44',
        phone: '(11) 98765-4321',
        email: 'ana.silva@email.com',
        birth_date: '1988-04-12 00:00:00.000Z',
        insurance: 'Bradesco Saúde',
      },
      {
        name: 'Carlos Eduardo Lima',
        cpf: '222.333.444-55',
        phone: '(11) 97654-3210',
        email: 'carlos.lima@email.com',
        birth_date: '1975-09-25 00:00:00.000Z',
        insurance: 'SulAmérica',
      },
      {
        name: 'Maria Oliveira Souza',
        cpf: '333.444.555-66',
        phone: '(11) 96543-2109',
        email: 'maria.souza@email.com',
        birth_date: '1992-11-03 00:00:00.000Z',
        insurance: 'Unimed',
      },
      {
        name: 'Fernanda Ribeiro',
        cpf: '444.555.666-77',
        phone: '(11) 95432-1098',
        email: 'fernanda.ribeiro@email.com',
        birth_date: '1980-01-18 00:00:00.000Z',
        insurance: 'Amil',
      },
      {
        name: 'Lucas Mendes Pereira',
        cpf: '555.666.777-88',
        phone: '(11) 94321-0987',
        email: 'lucas.mendes@email.com',
        birth_date: '1999-07-30 00:00:00.000Z',
        insurance: 'Particular',
      },
    ]

    const createdPatientIds = []
    for (const p of samplePatients) {
      try {
        const existing = app.findFirstRecordByData('patients', 'cpf', p.cpf)
        createdPatientIds.push(existing.id)
      } catch (_) {
        const rec = new Record(patientsCol)
        rec.set('name', p.name)
        rec.set('cpf', p.cpf)
        rec.set('phone', p.phone)
        rec.set('email', p.email)
        rec.set('birth_date', p.birth_date)
        rec.set('insurance', p.insurance)
        app.save(rec)
        createdPatientIds.push(rec.id)
      }
    }

    const cidCol = app.findCollectionByNameOrId('cid10_codes')
    const cidSample = [
      { code: 'I10', description: 'Hipertensão essencial (primária)' },
      { code: 'E11', description: 'Diabetes mellitus não-insulino-dependente' },
      { code: 'J00', description: 'Nasofaringite aguda (resfriado comum)' },
      { code: 'M54.5', description: 'Dor lombar baixa' },
      { code: 'K21', description: 'Doença de refluxo gastroesofágico' },
      { code: 'F41.1', description: 'Ansiedade generalizada' },
      { code: 'J45', description: 'Asma' },
      { code: 'N39.0', description: 'Infecção do trato urinário' },
      { code: 'G44.2', description: 'Cefaleia de tensão' },
    ]
    for (const c of cidSample) {
      try {
        app.findFirstRecordByData('cid10_codes', 'code', c.code)
      } catch (_) {
        const rec = new Record(cidCol)
        rec.set('code', c.code)
        rec.set('description', c.description)
        app.save(rec)
      }
    }

    const medCol = app.findCollectionByNameOrId('medications')
    const medSample = [
      {
        name: 'Dipirona Monoidratada 500mg',
        active_ingredient: 'Dipirona',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
      },
      {
        name: 'Paracetamol 750mg',
        active_ingredient: 'Paracetamol',
        laboratory: 'Medley',
        presentation: 'Comprimidos',
      },
      {
        name: 'Amoxicilina 500mg',
        active_ingredient: 'Amoxicilina',
        laboratory: 'Neo Química',
        presentation: 'Cápsulas',
      },
      {
        name: 'Losartana Potássica 50mg',
        active_ingredient: 'Losartana Potássica',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
      },
      {
        name: 'Omeprazol 20mg',
        active_ingredient: 'Omeprazol',
        laboratory: 'Aché',
        presentation: 'Cápsulas',
      },
      {
        name: 'Metformina 850mg',
        active_ingredient: 'Cloridrato de Metformina',
        laboratory: 'Prati-Donaduzzi',
        presentation: 'Comprimidos',
      },
      {
        name: 'Ibuprofeno 600mg',
        active_ingredient: 'Ibuprofeno',
        laboratory: 'Geolab',
        presentation: 'Comprimidos',
      },
    ]
    for (const m of medSample) {
      try {
        app.findFirstRecordByData('medications', 'name', m.name)
      } catch (_) {
        const rec = new Record(medCol)
        rec.set('name', m.name)
        rec.set('active_ingredient', m.active_ingredient)
        rec.set('laboratory', m.laboratory)
        rec.set('presentation', m.presentation)
        app.save(rec)
      }
    }

    const apptCol = app.findCollectionByNameOrId('appointments')
    const today = new Date()
    const formatIsoDate = (d, hour, min) => {
      const copy = new Date(d)
      copy.setHours(hour, min, 0, 0)
      return copy.toISOString()
    }

    if (createdPatientIds.length > 0 && doctorUser) {
      const appointmentsData = [
        {
          patient: createdPatientIds[0],
          date_time: formatIsoDate(today, 9, 0),
          status: 'em_andamento',
          reason: 'Consulta de Rotina - Check-up anual',
          notes: 'Paciente relata cansaço moderado.',
        },
        {
          patient: createdPatientIds[1],
          date_time: formatIsoDate(today, 10, 30),
          status: 'confirmada',
          reason: 'Acompanhamento Hipertensão',
          notes: 'Aferição de PA recomendada.',
        },
        {
          patient: createdPatientIds[2],
          date_time: formatIsoDate(today, 14, 0),
          status: 'agendada',
          reason: 'Retorno de Exames',
          notes: 'Trazer hemograma completo.',
        },
        {
          patient: createdPatientIds[3],
          date_time: formatIsoDate(today, 15, 30),
          status: 'agendada',
          reason: 'Avaliação Geral',
          notes: 'Queixa de dor articular leve.',
        },
        {
          patient: createdPatientIds[4],
          date_time: formatIsoDate(today, 17, 0),
          status: 'agendada',
          reason: 'Teleconsulta - Dúvidas de medicação',
          notes: 'Atendimento online.',
        },
      ]

      for (const a of appointmentsData) {
        const rec = new Record(apptCol)
        rec.set('doctor', doctorUser.id)
        rec.set('patient', a.patient)
        rec.set('date_time', a.date_time)
        rec.set('status', a.status)
        rec.set('reason', a.reason)
        rec.set('notes', a.notes)
        try {
          app.save(rec)
        } catch (_) {}
      }

      const mrCol = app.findCollectionByNameOrId('medical_records')
      const mrRec = new Record(mrCol)
      mrRec.set('patient', createdPatientIds[0])
      mrRec.set('doctor', doctorUser.id)
      mrRec.set(
        'soap_subjective',
        'Paciente refere fadiga matinal e dores de cabeça esporádicas. Nega febre ou perda de peso.',
      )
      mrRec.set(
        'soap_objective',
        'PA: 125/82 mmHg, FC: 74 bpm, Ausculta cardíaca e pulmonar normais.',
      )
      mrRec.set('soap_assessment', 'Cefaleia tensional episódica.')
      mrRec.set('soap_plan', 'Prescrito Dipirona em caso de dor. Orientado higiene do sono.')
      mrRec.set('prescribed_medications', [
        {
          medication: 'Dipirona Monoidratada 500mg',
          dosage: '1 cp VO 6/6h se dor',
          instructions: 'Tomar com água',
        },
      ])
      mrRec.set('cid10_codes', [{ code: 'G44.2', description: 'Cefaleia de tensão' }])
      mrRec.set('procedures', ['Orientação de estilo de vida', 'Aferição de sinais vitais'])
      try {
        app.save(mrRec)
      } catch (_) {}

      const docCol = app.findCollectionByNameOrId('documents')
      const docsData = [
        {
          patient: createdPatientIds[0],
          folder: 'exames',
          name: 'Hemograma_Completo_Lipidograma.pdf',
          ai_classified: true,
        },
        {
          patient: createdPatientIds[0],
          folder: 'medicamentos',
          name: 'Receita_Dipirona_500mg.pdf',
          ai_classified: true,
        },
        {
          patient: createdPatientIds[0],
          folder: 'procedimentos',
          name: 'Relatorio_Eletrocardiograma_ECG.pdf',
          ai_classified: true,
        },
        {
          patient: createdPatientIds[0],
          folder: 'agendamentos',
          name: 'Comprovante_Agendamento_Lab.pdf',
          ai_classified: true,
        },
      ]
      for (const d of docsData) {
        const dRec = new Record(docCol)
        dRec.set('patient', d.patient)
        dRec.set('folder', d.folder)
        dRec.set('name', d.name)
        dRec.set('ai_classified', d.ai_classified)
        try {
          app.save(dRec)
        } catch (_) {}
      }
    }
  },
  (app) => {},
)
