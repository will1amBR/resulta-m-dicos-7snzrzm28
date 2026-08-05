migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    col.fields.removeByName('role')
    col.fields.add(
      new SelectField({
        name: 'role',
        values: ['doctor', 'clinic', 'patient', 'admin'],
        maxSelect: 1,
      }),
    )

    if (!col.fields.getByName('clinic_address')) {
      col.fields.add(new TextField({ name: 'clinic_address' }))
    }
    if (!col.fields.getByName('clinic_contact')) {
      col.fields.add(new TextField({ name: 'clinic_contact' }))
    }

    if (!col.fields.getByName('patient_link')) {
      const patientsCol = app.findCollectionByNameOrId('patients')
      col.fields.add(
        new RelationField({
          name: 'patient_link',
          collectionId: patientsCol.id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      col.fields.removeByName('clinic_address')
    } catch (_) {}
    try {
      col.fields.removeByName('clinic_contact')
    } catch (_) {}
    try {
      col.fields.removeByName('patient_link')
    } catch (_) {}
    col.fields.removeByName('role')
    col.fields.add(
      new SelectField({
        name: 'role',
        values: ['doctor', 'admin'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)
