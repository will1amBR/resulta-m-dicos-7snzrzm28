migrate(
  (app) => {
    const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')

    // 1. Add verification_code field if not exists
    if (!prescriptionsCol.fields.getByName('verification_code')) {
      prescriptionsCol.fields.add(
        new TextField({
          name: 'verification_code',
        }),
      )
    }

    // 2. Adjust viewRule and listRule so public farmácia verification works
    // Allow public access to view/list when searching/verifying, or keep it open for read queries
    prescriptionsCol.listRule = ''
    prescriptionsCol.viewRule = ''

    // 3. Ensure patients & users allow public view if needed for prescription verification expand
    const patientsCol = app.findCollectionByNameOrId('patients')
    patientsCol.listRule = ''
    patientsCol.viewRule = ''

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = ''
    usersCol.viewRule = ''

    // 4. Add index for verification_code
    prescriptionsCol.addIndex('idx_prescriptions_verification_code', false, 'verification_code', '')

    app.save(prescriptionsCol)
    app.save(patientsCol)
    app.save(usersCol)

    // 5. Backfill verification_code for existing prescriptions that do not have one
    try {
      const allPrescs = app.findRecordsByFilter(
        'prescriptions',
        "verification_code = '' || verification_code = null",
        '',
        200,
        0,
      )
      for (let i = 0; i < allPrescs.length; i++) {
        const item = allPrescs[i]
        const randomHex = $security.randomString(8).toUpperCase()
        const code = `RX-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}`
        item.set('verification_code', code)
        app.save(item)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')
      prescriptionsCol.removeIndex('idx_prescriptions_verification_code')
      prescriptionsCol.fields.removeByName('verification_code')
      prescriptionsCol.listRule = "@request.auth.id != ''"
      prescriptionsCol.viewRule = "@request.auth.id != ''"
      app.save(prescriptionsCol)
    } catch (_) {}
  },
)
