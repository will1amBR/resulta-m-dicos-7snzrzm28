migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var clinicaMedicaId = ''
    try {
      var spec = app.findFirstRecordByData('specialties', 'name', 'Clínica Médica')
      clinicaMedicaId = spec.id
    } catch (_) {}

    var demoDoctor = null
    try {
      demoDoctor = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico@resulta.med')
    } catch (_) {
      demoDoctor = new Record(usersCol)
      demoDoctor.setEmail('demo.medico@resulta.med')
      demoDoctor.setPassword('Skip@Pass')
      demoDoctor.setVerified(true)
      demoDoctor.set('name', 'Dr. Demo Médico')
      demoDoctor.set('crm', '654321-SP')
      demoDoctor.set('specialty', clinicaMedicaId)
      demoDoctor.set('cpf_cnpj', '987.654.321-00')
      demoDoctor.set('role', 'doctor')
      demoDoctor.set('council_type', 'CRM')
      demoDoctor.set('council_number', '654321')
      demoDoctor.set('council_approved', true)
      app.save(demoDoctor)
    }

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'demo.clinica@resulta.med')
    } catch (_) {
      var demoClinic = new Record(usersCol)
      demoClinic.setEmail('demo.clinica@resulta.med')
      demoClinic.setPassword('Skip@Pass')
      demoClinic.setVerified(true)
      demoClinic.set('name', 'Clínica Demo Resulta')
      demoClinic.set('role', 'clinic')
      demoClinic.set('cpf_cnpj', '12.345.678/0001-90')
      demoClinic.set('clinic_address', 'Av. Paulista, 1000 - São Paulo, SP')
      demoClinic.set('clinic_contact', '(11) 3000-1000')
      app.save(demoClinic)
    }

    var demoPatientRecord = null
    try {
      demoPatientRecord = app.findFirstRecordByData('patients', 'cpf', '999.888.777-66')
    } catch (_) {
      var patientsCol = app.findCollectionByNameOrId('patients')
      demoPatientRecord = new Record(patientsCol)
      demoPatientRecord.set('name', 'Paciente Demo Silva')
      demoPatientRecord.set('cpf', '999.888.777-66')
      demoPatientRecord.set('phone', '(11) 91234-5678')
      demoPatientRecord.set('email', 'demo.paciente@resulta.med')
      demoPatientRecord.set('birth_date', '1990-05-15 00:00:00.000Z')
      demoPatientRecord.set('insurance', 'Unimed')
      app.save(demoPatientRecord)
    }

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'demo.paciente@resulta.med')
    } catch (_) {
      var demoPatientUser = new Record(usersCol)
      demoPatientUser.setEmail('demo.paciente@resulta.med')
      demoPatientUser.setPassword('Skip@Pass')
      demoPatientUser.setVerified(true)
      demoPatientUser.set('name', 'Paciente Demo Silva')
      demoPatientUser.set('role', 'patient')
      demoPatientUser.set('cpf_cnpj', '999.888.777-66')
      demoPatientUser.set('patient_link', demoPatientRecord.id)
      app.save(demoPatientUser)
    }

    if (demoDoctor) {
      var allPatients = app.findRecordsByFilter('patients', '', '-created', 10, 0)
      var today = new Date()
      var formatIso = function (d, h, m) {
        var c = new Date(d)
        c.setHours(h, m, 0, 0)
        return c.toISOString()
      }

      var apptCol = app.findCollectionByNameOrId('appointments')
      var existingAppts = app.findRecordsByFilter(
        'appointments',
        "doctor = '" + demoDoctor.id + "'",
        '-created',
        1,
        0,
      )
      if (existingAppts.length === 0) {
        var demoAppts = [
          { pi: 0, h: 8, m: 0, s: 'confirmada', r: 'Consulta de rotina - Check-up' },
          { pi: 1, h: 9, m: 30, s: 'agendada', r: 'Retorno de exames laboratoriais' },
          { pi: 2, h: 11, m: 0, s: 'agendada', r: 'Avaliação de pressão arterial' },
          { pi: 3, h: 14, m: 0, s: 'confirmada', r: 'Acompanhamento diabetes' },
          { pi: 4, h: 16, m: 0, s: 'agendada', r: 'Teleconsulta - cefaleia' },
        ]
        for (var i = 0; i < demoAppts.length; i++) {
          var da = demoAppts[i]
          if (da.pi < allPatients.length) {
            var rec = new Record(apptCol)
            rec.set('doctor', demoDoctor.id)
            rec.set('patient', allPatients[da.pi].id)
            rec.set('date_time', formatIso(today, da.h, da.m))
            rec.set('status', da.s)
            rec.set('reason', da.r)
            try {
              app.save(rec)
            } catch (_) {}
          }
        }

        var patAppt = new Record(apptCol)
        patAppt.set('doctor', demoDoctor.id)
        patAppt.set('patient', demoPatientRecord.id)
        patAppt.set('date_time', formatIso(today, 10, 0))
        patAppt.set('status', 'confirmada')
        patAppt.set('reason', 'Consulta demo - avaliação geral')
        try {
          app.save(patAppt)
        } catch (_) {}

        var tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 7)
        var futureAppt = new Record(apptCol)
        futureAppt.set('doctor', demoDoctor.id)
        futureAppt.set('patient', demoPatientRecord.id)
        futureAppt.set('date_time', formatIso(tomorrow, 15, 0))
        futureAppt.set('status', 'agendada')
        futureAppt.set('reason', 'Retorno - acompanhamento')
        try {
          app.save(futureAppt)
        } catch (_) {}
      }

      var existingMR = app.findRecordsByFilter(
        'medical_records',
        "patient = '" + demoPatientRecord.id + "'",
        '-created',
        1,
        0,
      )
      if (existingMR.length === 0) {
        var mrCol = app.findCollectionByNameOrId('medical_records')
        var mrRec = new Record(mrCol)
        mrRec.set('patient', demoPatientRecord.id)
        mrRec.set('doctor', demoDoctor.id)
        mrRec.set(
          'soap_subjective',
          'Paciente refere cefaleia há 3 dias, intensidade moderada, predominantemente frontal. Nega febre, náuseas ou alterações visuais.',
        )
        mrRec.set(
          'soap_objective',
          'PA: 130/85 mmHg, FC: 78 bpm, FR: 16 irpm, Temp: 36.5°C. Exame neurológico sem alterações.',
        )
        mrRec.set('soap_assessment', 'Cefaleia tensional episódica. PA limítrofe.')
        mrRec.set(
          'soap_plan',
          'Analgésico conforme necessário. Orientações de higiene do sono. Retorno em 30 dias.',
        )
        mrRec.set('prescribed_medications', [
          {
            medication: 'Dipirona Monoidratada 500mg',
            dosage: '1 cp VO 6/6h se dor',
            instructions: 'Tomar com bastante água',
          },
          {
            medication: 'Losartana Potássica 50mg',
            dosage: '1 cp VO 1x/dia pela manhã',
            instructions: 'Aferir PA regularmente',
          },
        ])
        mrRec.set('cid10_codes', [
          { code: 'G44.2', description: 'Cefaleia de tensão' },
          { code: 'I10', description: 'Hipertensão essencial (primária)' },
        ])
        mrRec.set('procedures', [
          'Aferição de sinais vitais',
          'Exame neurológico',
          'Orientações de estilo de vida',
        ])
        try {
          app.save(mrRec)
        } catch (_) {}
      }

      var existingDocs = app.findRecordsByFilter(
        'documents',
        "patient = '" + demoPatientRecord.id + "'",
        '-created',
        1,
        0,
      )
      if (existingDocs.length === 0) {
        var docCol = app.findCollectionByNameOrId('documents')
        var demoDocs = [
          { folder: 'exames', name: 'Hemograma_Completo_Demo.pdf' },
          { folder: 'medicamentos', name: 'Receita_Medica_Demo.pdf' },
          { folder: 'procedimentos', name: 'ECG_Eletrocardiograma_Demo.pdf' },
          { folder: 'agendamentos', name: 'Comprovante_Agendamento_Demo.pdf' },
        ]
        for (var j = 0; j < demoDocs.length; j++) {
          var d = demoDocs[j]
          var dRec = new Record(docCol)
          dRec.set('patient', demoPatientRecord.id)
          dRec.set('folder', d.folder)
          dRec.set('name', d.name)
          dRec.set('ai_classified', true)
          try {
            app.save(dRec)
          } catch (_) {}
        }
      }
    }

    var medUpdates = [
      {
        name: 'Dipirona Monoidratada 500mg',
        indications: 'Analgésico e antitérmico. Dor leve a moderada, febre.',
        contraindications:
          'Gravidez terceiro trimestre, discrasias sanguíneas, asma analgésica, hipersensibilidade a dipirona.',
        interactions: 'Potencializa efeito de álcool e sedativos. Reduz eficácia de ciclosporina.',
      },
      {
        name: 'Losartana Potássica 50mg',
        indications: 'Hipertensão arterial, insuficiência cardíaca, nefropatia diabética.',
        contraindications:
          'Gravidez, estenose bilateral de artéria renal, angioedema prévio por BRA.',
        interactions:
          'Hipercalemia com diuréticos poupadores de potássio e IECA. Potencializa anti-hipertensivos.',
      },
    ]
    for (var k = 0; k < medUpdates.length; k++) {
      var mu = medUpdates[k]
      try {
        var medRec = app.findFirstRecordByData('medications', 'name', mu.name)
        if (!medRec.getString('indications')) {
          medRec.set('indications', mu.indications)
          medRec.set('contraindications', mu.contraindications)
          medRec.set('interactions', mu.interactions)
          app.save(medRec)
        }
      } catch (_) {}
    }
  },
  (app) => {},
)
