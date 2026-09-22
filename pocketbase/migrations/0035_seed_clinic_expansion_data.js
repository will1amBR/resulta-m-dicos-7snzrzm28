migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const suppliesCol = app.findCollectionByNameOrId('clinic_supplies')
    const movementsCol = app.findCollectionByNameOrId('clinic_supply_movements')
    const cleaningCol = app.findCollectionByNameOrId('cleaning_checklists')
    const waCol = app.findCollectionByNameOrId('whatsapp_queue')
    const crmCol = app.findCollectionByNameOrId('crm_leads')
    const patientsCol = app.findCollectionByNameOrId('patients')

    // 1. Criar usuários demo para Secretaria e Faxineira
    let demoSec = null
    try {
      demoSec = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.secretaria@resulta.med')
    } catch (_) {
      demoSec = new Record(usersCol)
      demoSec.setEmail('demo.secretaria@resulta.med')
      demoSec.setPassword('Skip@Pass')
      demoSec.setVerified(true)
      demoSec.set('name', 'Ana Clara (Secretária Demo)')
      demoSec.set('role', 'secretaria')
      demoSec.set('clinic_contact', '(11) 98765-4321')
      app.save(demoSec)
    }

    let demoClean = null
    try {
      demoClean = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.faxineira@resulta.med')
    } catch (_) {
      demoClean = new Record(usersCol)
      demoClean.setEmail('demo.faxineira@resulta.med')
      demoClean.setPassword('Skip@Pass')
      demoClean.setVerified(true)
      demoClean.set('name', 'Maria da Silva (Higienização Demo)')
      demoClean.set('role', 'faxineira')
      demoClean.set('clinic_contact', '(11) 97654-3210')
      app.save(demoClean)
    }

    // 2. Seed de Insumos da Clínica (incluindo alguns com estoque baixo para alerta visual)
    const demoSupplies = [
      {
        name: 'Luvas de Procedimento Látex (M) - Caixa 100un',
        category: 'EPI / Proteção',
        quantity: 12,
        min_quantity: 20, // Estoque baixo!
        unit: 'cx',
        location: 'Armário A1 - Recepção/Triagem',
        cost_price: 32.5,
      },
      {
        name: 'Seringa Descartável 5ml com Agulha',
        category: 'Descartáveis / Injeção',
        quantity: 150,
        min_quantity: 50,
        unit: 'un',
        location: 'Consultório 1 - Gaveta B',
        cost_price: 0.85,
      },
      {
        name: 'Gaze Estéril 7.5x7.5cm (Pacote 10un)',
        category: 'Curativos',
        quantity: 18,
        min_quantity: 40, // Estoque baixo!
        unit: 'pct',
        location: 'Sala de Procedimentos',
        cost_price: 2.1,
      },
      {
        name: 'Álcool em Gel 70% 500ml com pump',
        category: 'Higiene & Antissepsia',
        quantity: 8,
        min_quantity: 10, // Estoque baixo!
        unit: 'frasco',
        location: 'Balcão Recepção / Salas',
        cost_price: 14.9,
      },
      {
        name: 'Espéculo Vaginal Descartável (M)',
        category: 'Materiais de Exame',
        quantity: 45,
        min_quantity: 20,
        unit: 'un',
        location: 'Consultório 2 - Ginecologia',
        cost_price: 4.8,
      },
      {
        name: 'Agulha Hipodérmica 25x7mm',
        category: 'Descartáveis / Injeção',
        quantity: 200,
        min_quantity: 80,
        unit: 'un',
        location: 'Sala de Injeções / Procedimentos',
        cost_price: 0.45,
      },
      {
        name: 'Lençol Descartável Hospitalar Rolo 70x50m',
        category: 'Mobiliário / Higiene',
        quantity: 5,
        min_quantity: 10, // Estoque baixo!
        unit: 'rolo',
        location: 'Almoxarifado Central',
        cost_price: 28.0,
      },
      {
        name: 'Máscara Cirúrgica Tripla com Elástico (Cx 50un)',
        category: 'EPI / Proteção',
        quantity: 35,
        min_quantity: 15,
        unit: 'cx',
        location: 'Recepção / Almoxarifado',
        cost_price: 18.5,
      },
      {
        name: 'Fita Microporosa 25mm x 10m',
        category: 'Curativos',
        quantity: 25,
        min_quantity: 10,
        unit: 'rolo',
        location: 'Consultório 1',
        cost_price: 7.9,
      },
      {
        name: 'Detergente Enzimático Hospitalar 1L',
        category: 'Higiene & Esterilização',
        quantity: 2,
        min_quantity: 4, // Estoque baixo!
        unit: 'frasco',
        location: 'Expurgo / Limpeza',
        cost_price: 45.0,
      },
    ]

    const createdSuppliesMap = {}
    for (let i = 0; i < demoSupplies.length; i++) {
      const s = demoSupplies[i]
      try {
        const existing = app.findFirstRecordByData('clinic_supplies', 'name', s.name)
        createdSuppliesMap[s.name] = existing.id
      } catch (_) {
        const rec = new Record(suppliesCol)
        rec.set('name', s.name)
        rec.set('category', s.category)
        rec.set('quantity', s.quantity)
        rec.set('min_quantity', s.min_quantity)
        rec.set('unit', s.unit)
        rec.set('location', s.location)
        rec.set('cost_price', s.cost_price)
        app.save(rec)
        createdSuppliesMap[s.name] = rec.id
      }
    }

    // 3. Seed de Movimentações de Insumos (Histórico)
    const firstSupplyId = Object.values(createdSuppliesMap)[0]
    if (firstSupplyId) {
      try {
        const existingMov = app.findRecordsByFilter('clinic_supply_movements', '', '-created', 1, 0)
        if (existingMov.length === 0) {
          const movements = [
            {
              supply:
                createdSuppliesMap['Luvas de Procedimento Látex (M) - Caixa 100un'] ||
                firstSupplyId,
              type: 'entrada',
              quantity: 20,
              reason: 'Reposição quinzenal - Nota Fiscal 4920',
              batch_number: 'LT-2025-01',
              date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            },
            {
              supply:
                createdSuppliesMap['Luvas de Procedimento Látex (M) - Caixa 100un'] ||
                firstSupplyId,
              type: 'saida_atendimento',
              quantity: 8,
              reason: 'Consumo em procedimentos e coletas matinais',
              batch_number: 'LT-2025-01',
              date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            },
            {
              supply: createdSuppliesMap['Gaze Estéril 7.5x7.5cm (Pacote 10un)'] || firstSupplyId,
              type: 'saida_atendimento',
              quantity: 12,
              reason: 'Curativos e pequena cirurgia ambulatorial',
              batch_number: 'GZ-8812',
              date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
            },
          ]
          for (let m = 0; m < movements.length; m++) {
            const movRec = new Record(movementsCol)
            movRec.set('supply', movements[m].supply)
            movRec.set('type', movements[m].type)
            movRec.set('quantity', movements[m].quantity)
            movRec.set('reason', movements[m].reason)
            movRec.set('batch_number', movements[m].batch_number)
            movRec.set('date', movements[m].date)
            if (demoSec) movRec.set('user', demoSec.id)
            app.save(movRec)
          }
        }
      } catch (_) {}
    }

    // 4. Seed de Rotina de Limpeza (Checklists)
    try {
      const existingClean = app.findRecordsByFilter('cleaning_checklists', '', '-created', 1, 0)
      if (existingClean.length === 0) {
        const todayIso = new Date().toISOString()
        const yesterdayIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

        const defaultItems = [
          {
            area: 'Consultório 1',
            task: 'Desinfecção de bancadas, maca e estetoscópio',
            done: true,
            time: '08:15',
          },
          {
            area: 'Consultório 1',
            task: 'Troca de lençol descartável e esvaziamento de lixo infectante',
            done: true,
            time: '08:20',
          },
          {
            area: 'Consultório 2 (Gineco)',
            task: 'Higienização de mesa ginecológica e foco de luz',
            done: false,
            time: '',
          },
          {
            area: 'Consultório 2 (Gineco)',
            task: 'Reposição de papel toalha e álcool em gel',
            done: true,
            time: '08:35',
          },
          {
            area: 'Recepção e Espera',
            task: 'Passar pano com desinfetante no piso e cadeiras',
            done: true,
            time: '07:45',
          },
          {
            area: 'Recepção e Espera',
            task: 'Abastecer bebedouro e descartáveis de café/água',
            done: true,
            time: '07:50',
          },
          {
            area: 'Banheiro Pacientes',
            task: 'Limpeza sanitária profunda, espelho e piso',
            done: true,
            time: '08:00',
          },
          {
            area: 'Banheiro Pacientes',
            task: 'Reposição de sabonete líquido e papel higiênico',
            done: true,
            time: '08:05',
          },
          {
            area: 'Banheiro Funcionários',
            task: 'Higienização geral e troca de saco de lixo',
            done: false,
            time: '',
          },
          {
            area: 'Sala de Procedimentos',
            task: 'Desinfecção terminal de superfícies e expurgo',
            done: false,
            time: '',
          },
        ]

        // Checklist de hoje
        const cleanToday = new Record(cleaningCol)
        cleanToday.set('date', todayIso)
        cleanToday.set('shift', 'manha')
        cleanToday.set('items', defaultItems)
        cleanToday.set('status', 'em_andamento')
        cleanToday.set(
          'notes',
          'Turno da manhã em andamento. Consultório 1 e banheiros prioritários concluídos.',
        )
        if (demoClean) cleanToday.set('staff', demoClean.id)
        app.save(cleanToday)

        // Checklist de ontem (concluído)
        const cleanYesterday = new Record(cleaningCol)
        cleanYesterday.set('date', yesterdayIso)
        cleanYesterday.set('shift', 'tarde')
        cleanYesterday.set(
          'items',
          defaultItems.map((it) => ({ ...it, done: true, time: '17:30' })),
        )
        cleanYesterday.set('status', 'concluido')
        cleanYesterday.set(
          'notes',
          'Turno da tarde finalizado. Todas as salas desinfetadas para o dia seguinte.',
        )
        if (demoClean) cleanYesterday.set('staff', demoClean.id)
        app.save(cleanYesterday)
      }
    } catch (_) {}

    // 5. Seed de Fila do WhatsApp
    try {
      const existingWa = app.findRecordsByFilter('whatsapp_queue', '', '-created', 1, 0)
      if (existingWa.length === 0) {
        const waItems = [
          {
            phone: '11912345678',
            recipient_name: 'Paciente Demo Silva',
            type: 'lembrete_consulta',
            message:
              'Olá Paciente Demo Silva, lembramos de sua consulta amanhã às 14:00 na Resulta Clínica com Dr. Demo Médico. Por favor confirme respondendo 1 para SIM.',
            status: 'pendente',
            scheduled_for: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            notes: 'Lembrete automático pré-consulta (Meta API Ready)',
          },
          {
            phone: '11988887777',
            recipient_name: 'Juliana Ferreira',
            type: 'confirmacao_consulta',
            message:
              'Olá Juliana, sua consulta foi confirmada para sexta-feira às 10:30 na Resulta Clínica. Endereço: Av. Paulista, 1000.',
            status: 'enviada',
            sent_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            notes: 'Enviado via link rápido WhatsApp da Secretaria',
          },
          {
            phone: '11977776666',
            recipient_name: 'Carlos Mendes',
            type: 'retorno_agendado',
            message:
              'Olá Carlos, já se passaram 30 dias desde seu último atendimento. Gostaria de agendar seu retorno com Dr. Demo Médico?',
            status: 'pendente',
            scheduled_for: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
            notes: 'Fila de reengajamento',
          },
        ]

        for (let w = 0; w < waItems.length; w++) {
          const waRec = new Record(waCol)
          waRec.set('phone', waItems[w].phone)
          waRec.set('recipient_name', waItems[w].recipient_name)
          waRec.set('type', waItems[w].type)
          waRec.set('message', waItems[w].message)
          waRec.set('status', waItems[w].status)
          if (waItems[w].scheduled_for) waRec.set('scheduled_for', waItems[w].scheduled_for)
          if (waItems[w].sent_at) waRec.set('sent_at', waItems[w].sent_at)
          waRec.set('notes', waItems[w].notes)
          app.save(waRec)
        }
      }
    } catch (_) {}

    // 6. Seed de Leads para o CRM
    try {
      const existingLeads = app.findRecordsByFilter('crm_leads', '', '-created', 1, 0)
      if (existingLeads.length === 0) {
        // Encontrar paciente demo para vincular
        let patDemoId = null
        try {
          const patDemo = app.findFirstRecordByData('patients', 'cpf', '999.888.777-66')
          patDemoId = patDemo.id
        } catch (_) {}

        const demoLeads = [
          {
            name: 'Paciente Demo Silva',
            phone: '(11) 91234-5678',
            email: 'demo.paciente@resulta.med',
            interest_specialty: 'Clínica Médica',
            stage: 'paciente_ativo',
            source: 'Agendamento Direto',
            notes: 'Paciente assíduo, faz acompanhamento de rotina.',
            estimated_value: 350.0,
            patient: patDemoId,
          },
          {
            name: 'Mariana Duarte Souza',
            phone: '(11) 98111-2233',
            email: 'mariana.duarte@gmail.com',
            interest_specialty: 'Dermatologia',
            stage: 'lead_novo',
            source: 'Instagram da Clínica',
            notes: 'Perguntou sobre procedimentos estéticos e tratamento de acne.',
            estimated_value: 450.0,
          },
          {
            name: 'Rodrigo Alcantara Lima',
            phone: '(11) 97222-3344',
            email: 'rodrigo.alcantara@hotmail.com',
            interest_specialty: 'Cardiologia',
            stage: 'primeiro_contato',
            source: 'Indicação de Paciente',
            notes: 'Secretária enviou tabela de horários via WhatsApp, aguardando retorno.',
            estimated_value: 400.0,
          },
          {
            name: 'Camila Peixoto Ramos',
            phone: '(11) 96333-4455',
            email: 'camila.peixoto@empresa.com.br',
            interest_specialty: 'Ginecologia',
            stage: 'agendamento_em_negociacao',
            source: 'Convênio Bradesco Saúde',
            notes: 'Tentando encaixar consulta para próxima terça-feira às 15h.',
            estimated_value: 380.0,
          },
          {
            name: 'Felipe Antunes Rocha',
            phone: '(11) 95444-5566',
            email: 'felipe.antunes@outlook.com',
            interest_specialty: 'Ortopedia',
            stage: 'inativo',
            source: 'Google Ads',
            notes: 'Não respondeu às 2 últimas mensagens de lembrete de agendamento.',
            estimated_value: 300.0,
          },
        ]

        for (let l = 0; l < demoLeads.length; l++) {
          const leadRec = new Record(crmCol)
          leadRec.set('name', demoLeads[l].name)
          leadRec.set('phone', demoLeads[l].phone)
          leadRec.set('email', demoLeads[l].email)
          leadRec.set('interest_specialty', demoLeads[l].interest_specialty)
          leadRec.set('stage', demoLeads[l].stage)
          leadRec.set('source', demoLeads[l].source)
          leadRec.set('notes', demoLeads[l].notes)
          leadRec.set('estimated_value', demoLeads[l].estimated_value)
          if (demoLeads[l].patient) leadRec.set('patient', demoLeads[l].patient)
          app.save(leadRec)
        }
      }
    } catch (_) {}
  },
  (app) => {},
)
