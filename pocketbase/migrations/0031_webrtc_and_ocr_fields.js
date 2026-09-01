migrate(
  (app) => {
    // 1. Criar coleção teleconsulta_signals para troca de offer/answer/ice-candidate WebRTC
    const appointmentsCol = app.findCollectionByNameOrId('appointments')

    const signalsCol = new Collection({
      name: 'teleconsulta_signals',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'appointment',
          type: 'relation',
          required: true,
          collectionId: appointmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'sender_role',
          type: 'select',
          required: true,
          values: ['doctor', 'patient'],
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['offer', 'answer', 'ice-candidate', 'hangup', 'ready', 'ping'],
          maxSelect: 1,
        },
        {
          name: 'payload',
          type: 'text',
          required: true,
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
        'CREATE INDEX idx_teleconsulta_signals_appt ON teleconsulta_signals (appointment, created DESC)',
      ],
    })

    app.save(signalsCol)

    // 2. Atualizar a coleção documents adicionando campos de OCR e extração textual se não existirem
    try {
      const docsCol = app.findCollectionByNameOrId('documents')
      if (!docsCol.fields.getByName('ocr_text')) {
        docsCol.fields.add(
          new TextField({
            name: 'ocr_text',
            required: false,
          }),
        )
      }
      if (!docsCol.fields.getByName('ocr_summary')) {
        docsCol.fields.add(
          new TextField({
            name: 'ocr_summary',
            required: false,
          }),
        )
      }
      if (!docsCol.fields.getByName('ocr_status')) {
        docsCol.fields.add(
          new SelectField({
            name: 'ocr_status',
            values: ['pendente', 'processando', 'concluido', 'erro'],
            maxSelect: 1,
          }),
        )
      }
      app.save(docsCol)
    } catch (e) {
      console.log('Nota ao atualizar coleção documents:', e.message)
    }
  },
  (app) => {
    try {
      const signalsCol = app.findCollectionByNameOrId('teleconsulta_signals')
      app.delete(signalsCol)
    } catch (_) {}
  },
)
