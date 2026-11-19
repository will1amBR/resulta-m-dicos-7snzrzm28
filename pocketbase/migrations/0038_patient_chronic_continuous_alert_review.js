/// MIGRATION 0038 — Persistir condições crônicas e medicamentos de uso contínuo
/// no perfil do paciente + campos de revisão clínica nos alertas ignorados.
///
/// Idempotente: cada campo só é criado se ainda não existir na coleção.

migrate(
  (app) => {
    // ---------------------------------------------------------------
    // 1. patients.chronic_conditions / patients.continuous_medications
    //    Texto livre separado por ';' — mesmo formato do campo allergies.
    // ---------------------------------------------------------------
    const patients = app.findCollectionByNameOrId('patients')

    if (!patients.fields.getByName('chronic_conditions')) {
      patients.fields.add(
        new TextField({
          name: 'chronic_conditions',
          required: false,
          max: 5000,
        }),
      )
    }

    if (!patients.fields.getByName('continuous_medications')) {
      patients.fields.add(
        new TextField({
          name: 'continuous_medications',
          required: false,
          max: 5000,
        }),
      )
    }

    app.save(patients)

    // ---------------------------------------------------------------
    // 2. ignored_medication_alerts: revisão pela clínica
    //    review_notes (texto), reviewed_by (usuário da clínica),
    //    reviewed_at (datetime) e status da revisão.
    // ---------------------------------------------------------------
    const alerts = app.findCollectionByNameOrId('ignored_medication_alerts')

    if (!alerts.fields.getByName('review_notes')) {
      alerts.fields.add(
        new TextField({
          name: 'review_notes',
          required: false,
          max: 3000,
        }),
      )
    }

    if (!alerts.fields.getByName('reviewed_by')) {
      alerts.fields.add(
        new RelationField({
          name: 'reviewed_by',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: false,
          cascadeDelete: false,
        }),
      )
    }

    if (!alerts.fields.getByName('reviewed_at')) {
      alerts.fields.add(
        new DateField({
          name: 'reviewed_at',
          required: false,
        }),
      )
    }

    if (!alerts.fields.getByName('review_status')) {
      alerts.fields.add(
        new SelectField({
          name: 'review_status',
          required: false,
          maxSelect: 1,
          values: ['pendente', 'observado', 'inaceitavel'],
        }),
      )
    }

    app.save(alerts)
  },
  (app) => {
    // Revert: remove somente os campos desta migração, se existirem.
    const patients = app.findCollectionByNameOrId('patients')
    for (const name of ['chronic_conditions', 'continuous_medications']) {
      const f = patients.fields.getByName(name)
      if (f) patients.fields.removeByName(name)
    }
    app.save(patients)

    const alerts = app.findCollectionByNameOrId('ignored_medication_alerts')
    for (const name of ['review_notes', 'reviewed_by', 'reviewed_at', 'review_status']) {
      const f = alerts.fields.getByName(name)
      if (f) alerts.fields.removeByName(name)
    }
    app.save(alerts)
  },
)
