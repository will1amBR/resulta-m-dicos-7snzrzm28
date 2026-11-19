migrate(
  (app) => {
    // 1. Campo allergies (texto livre) na coleção patients — alimentado pela
    // ficha de saúde do paciente e lido pela análise cruzada de medicamentos.
    const patients = app.findCollectionByNameOrId('patients')
    try {
      patients.fields.add(new TextField({ name: 'allergies', max: 2000 }))
      app.save(patients)
    } catch (e) {
      // Campo já existe — migração idempotente
    }

    // 2. Coleção ignored_medication_alerts — histórico estruturado de alertas
    // de risco (contraindicação/precaução) ignorados com justificativa clínica,
    // para revisão pela área da clínica.
    let existing = null
    try {
      existing = app.findCollectionByNameOrId('ignored_medication_alerts')
    } catch (e) {
      existing = null
    }
    if (!existing) {
      const col = new Collection({
        name: 'ignored_medication_alerts',
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
            collectionId: app.findCollectionByNameOrId('patients').id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'doctor',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          {
            name: 'prescription',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('prescriptions').id,
            maxSelect: 1,
          },
          { name: 'medication_name', type: 'text', required: true },
          {
            name: 'risk_level',
            type: 'select',
            required: true,
            values: ['contraindicacao', 'precaucao'],
            maxSelect: 1,
          },
          { name: 'alert_reason', type: 'text' },
          { name: 'alert_suggestion', type: 'text' },
          { name: 'justification', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_ima_patient ON ignored_medication_alerts (patient)',
          'CREATE INDEX idx_ima_doctor ON ignored_medication_alerts (doctor)',
          'CREATE INDEX idx_ima_created ON ignored_medication_alerts (created)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('ignored_medication_alerts'))
    } catch (e) {}
    try {
      const patients = app.findCollectionByNameOrId('patients')
      patients.fields.removeByName('allergies')
      app.save(patients)
    } catch (e) {}
  },
)
