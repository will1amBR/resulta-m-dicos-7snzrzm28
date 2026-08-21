migrate(
  (app) => {
    // 1. Extend users with certificate_file and certificate_status
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('certificate_file')) {
      usersCol.fields.add(
        new FileField({
          name: 'certificate_file',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: [
            'application/pdf',
            'application/x-pkcs12',
            'application/octet-stream',
            'application/pkcs12',
            'application/x-x509-ca-cert',
          ],
        }),
      )
    }

    if (!usersCol.fields.getByName('certificate_status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'certificate_status',
          values: ['nao_enviado', 'pendente', 'validado'],
          maxSelect: 1,
        }),
      )
    }

    app.save(usersCol)

    // 2. Create prescriptions collection
    const patientsCol = app.findCollectionByNameOrId('patients')
    const prescriptionsCol = new Collection({
      name: 'prescriptions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          required: true,
          collectionId: patientsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'doctor_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'medications',
          type: 'json',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          values: ['emitida', 'enviada', 'cancelada'],
          maxSelect: 1,
        },
        {
          name: 'certificate_validated',
          type: 'bool',
        },
        {
          name: 'sent_via',
          type: 'select',
          values: ['email', 'whatsapp', 'sms', 'nenhum'],
          maxSelect: 1,
        },
        {
          name: 'sent_at',
          type: 'date',
        },
        {
          name: 'notes',
          type: 'text',
        },
        {
          name: 'ai_alerts',
          type: 'json',
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
        'CREATE INDEX idx_prescriptions_patient ON prescriptions (patient_id)',
        'CREATE INDEX idx_prescriptions_doctor ON prescriptions (doctor_id)',
        'CREATE INDEX idx_prescriptions_created ON prescriptions (created DESC)',
      ],
    })
    app.save(prescriptionsCol)

    // 3. Create notifications collection
    const notificationsCol = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'message',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['warning', 'info', 'success', 'certificate_alert', 'prescription'],
          maxSelect: 1,
        },
        {
          name: 'read',
          type: 'bool',
        },
        {
          name: 'link',
          type: 'text',
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
        'CREATE INDEX idx_notifications_user_created ON notifications (user, created DESC)',
      ],
    })
    app.save(notificationsCol)
  },
  (app) => {
    try {
      const notif = app.findCollectionByNameOrId('notifications')
      app.delete(notif)
    } catch (_) {}

    try {
      const presc = app.findCollectionByNameOrId('prescriptions')
      app.delete(presc)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.fields.removeByName('certificate_file')
      usersCol.fields.removeByName('certificate_status')
      app.save(usersCol)
    } catch (_) {}
  },
)
