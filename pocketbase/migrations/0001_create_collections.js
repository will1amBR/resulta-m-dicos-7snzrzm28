migrate(
  (app) => {
    const specialties = new Collection({
      name: 'specialties',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_specialties_name ON specialties (name)'],
    })
    app.save(specialties)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('crm')) {
      users.fields.add(new TextField({ name: 'crm' }))
    }
    if (!users.fields.getByName('cpf_cnpj')) {
      users.fields.add(new TextField({ name: 'cpf_cnpj' }))
    }
    if (!users.fields.getByName('specialty')) {
      users.fields.add(
        new RelationField({ name: 'specialty', collectionId: specialties.id, maxSelect: 1 }),
      )
    }
    app.save(users)

    const patients = new Collection({
      name: 'patients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cpf', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'birth_date', type: 'date' },
        { name: 'insurance', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_patients_cpf ON patients (cpf)'],
    })
    app.save(patients)

    const appointments = new Collection({
      name: 'appointments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'doctor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        { name: 'date_time', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendada', 'confirmada', 'em_andamento', 'finalizada', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'reason', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_appointments_doc_date ON appointments (doctor, date_time)'],
    })
    app.save(appointments)

    const medicalRecords = new Collection({
      name: 'medical_records',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'appointment', type: 'relation', collectionId: appointments.id, maxSelect: 1 },
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        {
          name: 'doctor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'soap_subjective', type: 'text' },
        { name: 'soap_objective', type: 'text' },
        { name: 'soap_assessment', type: 'text' },
        { name: 'soap_plan', type: 'text' },
        { name: 'prescribed_medications', type: 'json' },
        { name: 'cid10_codes', type: 'json' },
        { name: 'procedures', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(medicalRecords)

    const documents = new Collection({
      name: 'documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        {
          name: 'folder',
          type: 'select',
          required: true,
          values: ['exames', 'medicamentos', 'procedimentos', 'agendamentos', 'outros'],
          maxSelect: 1,
        },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'name', type: 'text', required: true },
        { name: 'ai_classified', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_docs_pat_folder ON documents (patient, folder)'],
    })
    app.save(documents)

    const cid10 = new Collection({
      name: 'cid10_codes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_cid10_code ON cid10_codes (code)'],
    })
    app.save(cid10)

    const medications = new Collection({
      name: 'medications',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'active_ingredient', type: 'text' },
        { name: 'laboratory', type: 'text' },
        { name: 'presentation', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_medications_name ON medications (name)'],
    })
    app.save(medications)
  },
  (app) => {
    const colNames = [
      'medications',
      'cid10_codes',
      'documents',
      'medical_records',
      'appointments',
      'patients',
      'specialties',
    ]
    for (const name of colNames) {
      try {
        const c = app.findCollectionByNameOrId(name)
        app.delete(c)
      } catch (_) {}
    }
  },
)
