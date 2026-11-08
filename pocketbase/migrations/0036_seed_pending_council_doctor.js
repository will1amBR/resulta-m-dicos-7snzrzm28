// Seed idempotente: garante ao menos 1 médico demo com conselho pendente
// para o painel "Novos Cadastros" da Central de Aprovações.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    let clinicaMedicaId = ''
    try {
      const spec = app.findFirstRecordByData('specialties', 'name', 'Clínica Médica')
      clinicaMedicaId = spec.id
    } catch (_) {}

    // Se já existir algum médico com conselho pendente, nada a fazer.
    const pendentes = app.findRecordsByFilter(
      'users',
      "role = 'doctor' && council_approved = false",
      '-created',
      1,
      0,
    )
    if (pendentes.length > 0) return

    let demoDoctorPendente = null
    try {
      demoDoctorPendente = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'demo.medico.pendente@resulta.med',
      )
    } catch (_) {
      demoDoctorPendente = null
    }

    if (!demoDoctorPendente) {
      demoDoctorPendente = new Record(usersCol)
      demoDoctorPendente.setEmail('demo.medico.pendente@resulta.med')
      demoDoctorPendente.setPassword('Skip@Pass')
      demoDoctorPendente.setVerified(true)
      demoDoctorPendente.set('name', 'Dra. Helena Andrade')
      demoDoctorPendente.set('crm', '123456-RJ')
      demoDoctorPendente.set('specialty', clinicaMedicaId)
      demoDoctorPendente.set('cpf_cnpj', '456.789.123-00')
      demoDoctorPendente.set('role', 'doctor')
      demoDoctorPendente.set('council_type', 'CRM')
      demoDoctorPendente.set('council_number', '123456')
      // Cadastro aguardando validação pela clínica (regra flexível: pode usar o sistema)
      demoDoctorPendente.set('council_approved', false)
      app.save(demoDoctorPendente)
    } else if (!demoDoctorPendente.getBool('council_approved')) {
      // Já existe, mas garante que está marcado como pendente (idempotente)
      demoDoctorPendente.set('council_approved', false)
      app.save(demoDoctorPendente)
    }
  },
  (app) => {
    // Down: remove o demo pendente se ainda não foi aprovado
    try {
      const rec = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico.pendente@resulta.med')
      if (rec && !rec.getBool('council_approved')) {
        app.delete(rec)
      }
    } catch (_) {}
  },
)
