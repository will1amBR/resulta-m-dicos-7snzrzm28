migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    if (!col.fields.getByName('ai_alerts')) {
      col.fields.add(new JSONField({ name: 'ai_alerts' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    try {
      col.fields.removeByName('ai_alerts')
    } catch (_) {}
    app.save(col)
  },
)
