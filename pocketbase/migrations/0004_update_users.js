migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('council_type')) {
      col.fields.add(
        new SelectField({
          name: 'council_type',
          values: ['CRM', 'CRN', 'CRP', 'CRO', 'COREN', 'CREFITO'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('council_number')) {
      col.fields.add(new TextField({ name: 'council_number', max: 20 }))
    }
    if (!col.fields.getByName('council_approved')) {
      col.fields.add(new BoolField({ name: 'council_approved' }))
    }
    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['doctor', 'admin'],
          maxSelect: 1,
        }),
      )
    }

    col.listRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin')"
    col.viewRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin')"
    col.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin')"

    app.save(col)

    try {
      const doctorUser = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      doctorUser.set('role', 'admin')
      doctorUser.set('council_type', 'CRM')
      doctorUser.set('council_number', '123456-SP')
      doctorUser.set('council_approved', true)
      app.save(doctorUser)
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      col.fields.removeByName('council_type')
    } catch (_) {}
    try {
      col.fields.removeByName('council_number')
    } catch (_) {}
    try {
      col.fields.removeByName('council_approved')
    } catch (_) {}
    try {
      col.fields.removeByName('role')
    } catch (_) {}
    app.save(col)
  },
)
