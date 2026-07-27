migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medications')

    if (!col.fields.getByName('indications')) {
      col.fields.add(new TextField({ name: 'indications', max: 2000 }))
    }
    if (!col.fields.getByName('contraindications')) {
      col.fields.add(new TextField({ name: 'contraindications', max: 2000 }))
    }
    if (!col.fields.getByName('interactions')) {
      col.fields.add(new TextField({ name: 'interactions', max: 2000 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medications')
    try {
      col.fields.removeByName('indications')
    } catch (_) {}
    try {
      col.fields.removeByName('contraindications')
    } catch (_) {}
    try {
      col.fields.removeByName('interactions')
    } catch (_) {}
    app.save(col)
  },
)
