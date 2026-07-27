migrate(
  (app) => {
    const medCol = app.findCollectionByNameOrId('medications')
    if (!medCol.fields.getByName('indications')) {
      medCol.fields.add(new TextField({ name: 'indications', required: true, max: 2000 }))
    }
    if (!medCol.fields.getByName('contraindications')) {
      medCol.fields.add(new TextField({ name: 'contraindications', required: true, max: 2000 }))
    }
    if (!medCol.fields.getByName('interactions')) {
      medCol.fields.add(new TextField({ name: 'interactions', max: 2000 }))
    }
    app.save(medCol)

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('council_type')) {
      usersCol.fields.add(
        new SelectField({
          name: 'council_type',
          values: ['CRM', 'CRN', 'CRP', 'CRO', 'COREN', 'CREFITO'],
          maxSelect: 1,
        }),
      )
    }
    if (!usersCol.fields.getByName('council_number')) {
      usersCol.fields.add(new TextField({ name: 'council_number', max: 20 }))
    }
    if (!usersCol.fields.getByName('council_approved')) {
      usersCol.fields.add(new BoolField({ name: 'council_approved' }))
    }
    app.save(usersCol)

    const medData = [
      {
        name: 'Dipirona Monoidratada 500mg',
        indications:
          'Alívio de dor leve a moderada, febre. Dose adulto: 500-1000mg via oral a cada 6-8 horas.',
        contraindications:
          'Hipersensibilidade à dipirona, gravidez terceiro trimestre, lactentes < 3 meses, insuficiência hepática grave, porfiria aguda.',
        interactions:
          'Potencializa efeito de álcool. Ciclosporina (reduz níveis). Anticoagulantes orais (monitorar).',
      },
      {
        name: 'Paracetamol 750mg',
        indications:
          'Alívio de dor leve a moderada e febre. Dose adulto: 750mg via oral a cada 6-8 horas, máx 4g/dia.',
        contraindications:
          'Hipersensibilidade ao paracetamol, insuficiência hepática grave, hepatite aguda, alcoolismo crônico.',
        interactions: 'Warfarina (aumenta INR). Barbitúricos e fenitoína (hepatotoxicidade).',
      },
      {
        name: 'Amoxicilina 500mg',
        indications:
          'Infecções respiratórias, otite, sinusite, faringite, ITU. Dose adulto: 500mg via oral a cada 8h.',
        contraindications:
          'Alergia a penicilinas, mononucleose infecciosa. Uso cauteloso em insuficiência renal.',
        interactions:
          'Aumento de efeito com probenecida. Reduz eficácia de anticoncepcionais orais. Alopurinol (rash).',
      },
      {
        name: 'Losartana Potássica 50mg',
        indications:
          'Hipertensão arterial, insuficiência cardíaca, nefropatia diabética. Dose adulto: 50-100mg via oral 1x/dia.',
        contraindications:
          'Gravidez, hipersensibilidade aos componentes, estenose bilateral de artéria renal. Insuficiência hepática grave.',
        interactions:
          'AINEs (reduzem efeito anti-hipertensivo). Diuréticos poupadores de potássio (hipercalemia). Lítio (toxicidade).',
      },
      {
        name: 'Omeprazol 20mg',
        indications:
          'Úlcera gástrica/duodenal, refluxo gastroesofágico, erradicação de H. pylori. Dose adulto: 20-40mg via oral 1x/dia.',
        contraindications:
          'Hipersensibilidade ao omeprazol ou substitutos benzimidazólicos. Uso concomitante com nelfinavir.',
        interactions:
          'Reduz metabolismo de warfarina, diazepam, fenitoína. Antiácidos reduzem absorção. Clopidogrel (reduz eficácia).',
      },
      {
        name: 'Metformina 850mg',
        indications:
          'Diabetes mellitus tipo 2, especialmente em pacientes obesos. Dose adulto: 850mg via oral 2-3x/dia com refeições.',
        contraindications:
          'Insuficiência renal (TFG < 30), cetoacidose diabética, insuficiência hepática grave, alcoolismo, gravidez.',
        interactions:
          'Contraste iodado (acidose lática - suspender 48h). Cimetidina (aumenta níveis). AINEs (potencializa nefrotoxicidade).',
      },
      {
        name: 'Ibuprofeno 600mg',
        indications:
          'Dor leve a moderada, febre, processos inflamatórios. Dose adulto: 600mg via oral a cada 8h.',
        contraindications:
          'Úlcera péptica ativa, insuficiência renal ou hepática grave, asma sensível a AINEs, gravidez terceiro trimestre.',
        interactions:
          'Anticoagulantes (aumenta risco de sangramento). Diuréticos e anti-hipertensivos (reduzem efeito). Lítio (toxicidade).',
      },
    ]

    for (const m of medData) {
      try {
        const rec = app.findFirstRecordByData('medications', 'name', m.name)
        rec.set('indications', m.indications)
        rec.set('contraindications', m.contraindications)
        rec.set('interactions', m.interactions)
        app.save(rec)
      } catch (_) {}
    }

    try {
      const doctor = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      if (!doctor.getBool('council_approved')) {
        doctor.set('council_type', 'CRM')
        doctor.set('council_number', '123456-SP')
        doctor.set('council_approved', true)
        app.save(doctor)
      }
    } catch (_) {}
  },
  (app) => {
    const medCol = app.findCollectionByNameOrId('medications')
    for (const f of ['indications', 'contraindications', 'interactions']) {
      const field = medCol.fields.getByName(f)
      if (field) medCol.fields.remove(field.id)
    }
    app.save(medCol)

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    for (const f of ['council_type', 'council_number', 'council_approved']) {
      const field = usersCol.fields.getByName(f)
      if (field) usersCol.fields.remove(field.id)
    }
    app.save(usersCol)
  },
)
