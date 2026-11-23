/// <reference path="../pb_data/types.d.ts" />
// Migração idempotente:
// 1) Coleção prescription_dispensations — prova de dispensação da farmácia
//    (consulta pública /consulta-receita, sem login).
// 2) Coleção clinic_onboarding_dismissals — estado do guia de primeiro uso da clínica.

migrate(
  (app) => {
    // ---------------------------------------------------------------
    // 1. prescription_dispensations
    // ---------------------------------------------------------------
    let dispensations = null
    try {
      dispensations = app.findCollectionByNameOrId('prescription_dispensations')
    } catch (_) {
      dispensations = null
    }

    if (!dispensations) {
      const prescriptions = app.findCollectionByNameOrId('prescriptions')

      dispensations = new Collection({
        type: 'base',
        name: 'prescription_dispensations',
        fields: [
          {
            name: 'prescription',
            type: 'relation',
            required: true,
            collectionId: prescriptions.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'verification_code',
            type: 'text',
            required: true,
            max: 60,
          },
          {
            // Identificação livre da farmácia (opcional, sem login)
            name: 'pharmacy_name',
            type: 'text',
            required: false,
            max: 200,
          },
        ],
        indexes: [
          'CREATE INDEX idx_pd_prescription ON prescription_dispensations (prescription)',
          'CREATE INDEX idx_pd_created ON prescription_dispensations (created)',
        ],
        listRule: 'prescription.doctor_id = @request.auth.id',
        viewRule: 'prescription.doctor_id = @request.auth.id',
        createRule: '', // consulta pública: qualquer farmácia registra a prova
        updateRule: null,
        deleteRule: null,
      })
      app.save(dispensations)
    }

    // ---------------------------------------------------------------
    // 2. clinic_onboarding_dismissals
    // ---------------------------------------------------------------
    let onboarding = null
    try {
      onboarding = app.findCollectionByNameOrId('clinic_onboarding_dismissals')
    } catch (_) {
      onboarding = null
    }

    if (!onboarding) {
      const users = app.findCollectionByNameOrId('users')

      onboarding = new Collection({
        type: 'base',
        name: 'clinic_onboarding_dismissals',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: users.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'dismissed',
            type: 'bool',
            required: false,
          },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_cod_user ON clinic_onboarding_dismissals (user)'],
        listRule: 'user.id = @request.auth.id',
        viewRule: 'user.id = @request.auth.id',
        createRule: 'user.id = @request.auth.id',
        updateRule: 'user.id = @request.auth.id',
        deleteRule: null,
      })
      app.save(onboarding)
    }
  },
  (app) => {
    try {
      const c = app.findCollectionByNameOrId('prescription_dispensations')
      app.delete(c)
    } catch (_) {}
    try {
      const c2 = app.findCollectionByNameOrId('clinic_onboarding_dismissals')
      app.delete(c2)
    } catch (_) {}
  },
)
