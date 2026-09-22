migrate(
  (app) => {
    // 1. Atualizar roles na coleção users para incluir 'secretaria' e 'faxineira'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.fields.removeByName('role')
    usersCol.fields.add(
      new SelectField({
        name: 'role',
        values: ['doctor', 'clinic', 'patient', 'admin', 'secretaria', 'faxineira'],
        maxSelect: 1,
      }),
    )
    app.save(usersCol)

    // 2. Coleção clinic_supplies (Insumos da clínica)
    const suppliesCol = new Collection({
      name: 'clinic_supplies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'quantity', type: 'number', required: true },
        { name: 'min_quantity', type: 'number', required: true },
        { name: 'unit', type: 'text', required: true },
        { name: 'location', type: 'text' },
        { name: 'cost_price', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_supplies_name ON clinic_supplies (name)'],
    })
    app.save(suppliesCol)

    // 3. Coleção clinic_supply_movements (Movimentações de insumos - entradas/baixas)
    const movementsCol = new Collection({
      name: 'clinic_supply_movements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'supply',
          type: 'relation',
          collectionId: suppliesCol.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['entrada', 'saida_atendimento', 'ajuste', 'descarte'],
          maxSelect: 1,
        },
        { name: 'quantity', type: 'number', required: true },
        { name: 'reason', type: 'text' },
        {
          name: 'patient',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'batch_number', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_csm_supply ON clinic_supply_movements (supply)',
        'CREATE INDEX idx_csm_created ON clinic_supply_movements (created)',
      ],
    })
    app.save(movementsCol)

    // 4. Coleção cleaning_checklists (Rotinas e checklists de limpeza da faxineira)
    const cleaningCol = new Collection({
      name: 'cleaning_checklists',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'shift',
          type: 'select',
          required: true,
          values: ['manha', 'tarde', 'noite'],
          maxSelect: 1,
        },
        {
          name: 'staff',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'items', type: 'json' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'em_andamento', 'concluido'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cc_date ON cleaning_checklists (date)'],
    })
    app.save(cleaningCol)

    // 5. Coleção whatsapp_queue (Fila e registro de mensagens preparadas para WhatsApp)
    const waQueueCol = new Collection({
      name: 'whatsapp_queue',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'phone', type: 'text', required: true },
        { name: 'recipient_name', type: 'text', required: true },
        {
          name: 'patient',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          values: [
            'confirmacao_consulta',
            'lembrete_consulta',
            'envio_documento',
            'aniversario',
            'retorno_agendado',
            'outro',
          ],
          maxSelect: 1,
        },
        { name: 'message', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'enviada', 'falha'],
          maxSelect: 1,
        },
        { name: 'scheduled_for', type: 'date' },
        { name: 'sent_at', type: 'date' },
        { name: 'meta_api_message_id', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_wq_status ON whatsapp_queue (status)',
        'CREATE INDEX idx_wq_phone ON whatsapp_queue (phone)',
      ],
    })
    app.save(waQueueCol)

    // 6. Coleção crm_leads (Cards do CRM da clínica - pacientes e leads fora do sistema)
    const crmLeadsCol = new Collection({
      name: 'crm_leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'interest_specialty', type: 'text' },
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: [
            'lead_novo',
            'primeiro_contato',
            'agendamento_em_negociacao',
            'paciente_ativo',
            'inativo',
          ],
          maxSelect: 1,
        },
        {
          name: 'patient',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
        },
        { name: 'source', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'estimated_value', type: 'number' },
        { name: 'last_contact_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cl_stage ON crm_leads (stage)',
        'CREATE INDEX idx_cl_phone ON crm_leads (phone)',
      ],
    })
    app.save(crmLeadsCol)
  },
  (app) => {
    try {
      const crm = app.findCollectionByNameOrId('crm_leads')
      app.delete(crm)
    } catch (_) {}
    try {
      const wa = app.findCollectionByNameOrId('whatsapp_queue')
      app.delete(wa)
    } catch (_) {}
    try {
      const cl = app.findCollectionByNameOrId('cleaning_checklists')
      app.delete(cl)
    } catch (_) {}
    try {
      const csm = app.findCollectionByNameOrId('clinic_supply_movements')
      app.delete(csm)
    } catch (_) {}
    try {
      const cs = app.findCollectionByNameOrId('clinic_supplies')
      app.delete(cs)
    } catch (_) {}
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.fields.removeByName('role')
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['doctor', 'clinic', 'patient', 'admin'],
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    } catch (_) {}
  },
)
