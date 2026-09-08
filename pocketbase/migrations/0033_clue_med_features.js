migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const patientsCol = app.findCollectionByNameOrId('patients')
    const usersId = usersCol.id
    const patientsId = patientsCol.id

    // 1. Coleção access_grants (Modelo Aberto - LGPD e autorizações temporárias 24h)
    let accessGrantsCol
    try {
      accessGrantsCol = app.findCollectionByNameOrId('access_grants')
    } catch (_) {
      accessGrantsCol = new Collection({
        name: 'access_grants',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'patient',
            type: 'relation',
            required: true,
            collectionId: patientsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'granted_to_user',
            type: 'relation',
            required: false,
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'target_name', type: 'text' },
          {
            name: 'target_role',
            type: 'select',
            values: ['doctor', 'clinic', 'other'],
            maxSelect: 1,
          },
          { name: 'scope', type: 'text' }, // ex: "prontuario,exames,prescricoes" ou "completo"
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ativa', 'pendente', 'revogada', 'expirada', 'negada'],
            maxSelect: 1,
          },
          { name: 'reason', type: 'text' },
          { name: 'expires_at', type: 'date', required: true },
          { name: 'revoked_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_ag_patient ON access_grants (patient)',
          'CREATE INDEX idx_ag_user ON access_grants (granted_to_user)',
          'CREATE INDEX idx_ag_status ON access_grants (status)',
        ],
      })
      app.save(accessGrantsCol)
    }

    // 2. Coleção access_audit_log (Auditoria completa de acessos)
    let accessAuditCol
    try {
      accessAuditCol = app.findCollectionByNameOrId('access_audit_log')
    } catch (_) {
      accessAuditCol = new Collection({
        name: 'access_audit_log',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'patient',
            type: 'relation',
            required: true,
            collectionId: patientsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'actor_user',
            type: 'relation',
            required: false,
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'actor_name', type: 'text' },
          { name: 'actor_role', type: 'text' },
          {
            name: 'action',
            type: 'select',
            required: true,
            values: ['consultou', 'concedeu_24h', 'revogou', 'solicitou', 'negou'],
            maxSelect: 1,
          },
          { name: 'resource', type: 'text' }, // ex: "Prontuário Clínico", "Exames Laboratoriais", "Prescrições"
          { name: 'details', type: 'text' },
          { name: 'ip_address', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_aal_patient ON access_audit_log (patient)',
          'CREATE INDEX idx_aal_created ON access_audit_log (created)',
        ],
      })
      app.save(accessAuditCol)
    }

    // 3. Coleção clinical_documents (Atestado, Laudo, Encaminhamento, Declaração)
    let clinicalDocsCol
    try {
      clinicalDocsCol = app.findCollectionByNameOrId('clinical_documents')
    } catch (_) {
      clinicalDocsCol = new Collection({
        name: 'clinical_documents',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'doctor', type: 'relation', required: true, collectionId: usersId, maxSelect: 1 },
          {
            name: 'patient',
            type: 'relation',
            required: true,
            collectionId: patientsId,
            maxSelect: 1,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['atestado', 'laudo', 'encaminhamento', 'declaracao'],
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text', required: true },
          { name: 'cid10', type: 'text' },
          { name: 'rest_days', type: 'number' },
          { name: 'specialty_target', type: 'text' },
          { name: 'verification_code', type: 'text', required: true },
          { name: 'certificate_validated', type: 'bool' },
          {
            name: 'status',
            type: 'select',
            values: ['emitido', 'enviado', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'sent_via',
            type: 'select',
            values: ['email', 'whatsapp', 'sms', 'nenhum'],
            maxSelect: 1,
          },
          { name: 'sent_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cd_verification_code ON clinical_documents (verification_code)',
          'CREATE INDEX idx_cd_patient ON clinical_documents (patient)',
          'CREATE INDEX idx_cd_doctor ON clinical_documents (doctor)',
        ],
      })
      app.save(clinicalDocsCol)
    }

    // 4. Coleção lab_results (Marcadores laboratoriais com série temporal)
    let labResultsCol
    try {
      labResultsCol = app.findCollectionByNameOrId('lab_results')
    } catch (_) {
      labResultsCol = new Collection({
        name: 'lab_results',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'patient',
            type: 'relation',
            required: true,
            collectionId: patientsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'marker_name', type: 'text', required: true },
          { name: 'marker_code', type: 'text' }, // ex: "hemoglobina", "tsh", "creatinina", "glicemia", "colesterol_total", "hba1c"
          { name: 'value', type: 'number', required: true },
          { name: 'unit', type: 'text' }, // ex: "g/dL", "mg/dL", "mcUI/mL", "%"
          { name: 'reference_range', type: 'text' }, // ex: "12.0 - 16.0" ou "70 - 99"
          { name: 'is_abnormal', type: 'bool' },
          { name: 'collected_at', type: 'date', required: true },
          { name: 'source_document_name', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_lr_patient_marker ON lab_results (patient, marker_code)',
          'CREATE INDEX idx_lr_patient_date ON lab_results (patient, collected_at)',
        ],
      })
      app.save(labResultsCol)
    }

    // 5. Coleção specialty_templates (Modelos de prontuário por especialidade)
    let specialtyTemplatesCol
    try {
      specialtyTemplatesCol = app.findCollectionByNameOrId('specialty_templates')
    } catch (_) {
      specialtyTemplatesCol = new Collection({
        name: 'specialty_templates',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'specialty', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'soap_subjective', type: 'text' },
          { name: 'soap_objective', type: 'text' },
          { name: 'soap_assessment', type: 'text' },
          { name: 'soap_plan', type: 'text' },
          { name: 'default_cid10', type: 'json' },
          { name: 'default_medications', type: 'json' },
          { name: 'checklist_items', type: 'json' },
          { name: 'is_system', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_st_specialty ON specialty_templates (specialty)'],
      })
      app.save(specialtyTemplatesCol)
    }

    // ==========================================
    // SEED DE DADOS DEMO
    // ==========================================

    // Obter IDs dos registros demo existentes
    let demoPatientRecord = null
    let demoDoctorRecord = null
    let demoClinicRecord = null

    try {
      demoPatientRecord = app.findFirstRecordByData('patients', 'cpf', '999.888.777-66')
    } catch (_) {
      try {
        const anyPatients = app.findRecordsByFilter('patients', '', '-created', 1, 0)
        if (anyPatients.length > 0) demoPatientRecord = anyPatients[0]
      } catch (_) {}
    }

    try {
      demoDoctorRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico@resulta.med')
    } catch (_) {
      try {
        demoDoctorRecord = app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'william@korenambiental.com',
        )
      } catch (_) {}
    }

    try {
      demoClinicRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.clinica@resulta.med')
    } catch (_) {}

    const patientId = demoPatientRecord ? demoPatientRecord.id : null
    const doctorId = demoDoctorRecord ? demoDoctorRecord.id : null
    const clinicId = demoClinicRecord ? demoClinicRecord.id : null

    // Seed 1: Specialty Templates
    const templatesToSeed = [
      {
        name: 'Clínica Geral / Medicina de Família',
        specialty: 'Clínica Geral',
        description: 'Modelo abrangente para atendimento clínico ambulatorial.',
        soap_subjective:
          'Paciente comparece para consulta de rotina/seguimento. Refere queixas atuais de: [descrever]. Nega febre recente, perda ponderal inexplicada ou sintomas de alarme. Histórico familiar de HAS e DM.',
        soap_objective:
          'BEG, corado, hidratado, acianótico, anictérico.\nPA: 120/80 mmHg | FC: 72 bpm | SatO2: 98% em ar ambiente | Peso: 74 kg | Altura: 1.72 m (IMC: 25.0 kg/m²).\nAparelho respiratório: MV presente bilateralmente sem ruídos adventícios.\nAparelho cardiovascular: RCR 2T BNF sem sopros audíveis.\nAbdome: plano, flácido, indolor à palpação, RHA presentes.',
        soap_assessment:
          '1. Hipertensão arterial sistêmica primária controlada (I10)\n2. Rastreamento e acompanhamento de rotina de saúde do adulto.',
        soap_plan:
          '1. Manter medicações de uso contínuo.\n2. Solicitação de exames laboratoriais de controle (hemograma, glicemia, creatinina, perfil lipídico).\n3. Reforço de MEV: dieta hipossódica e atividade física 150 min/semana.\n4. Retorno em 3 meses com exames.',
        default_cid10: [
          { code: 'I10', description: 'Hipertensão essencial (primária)' },
          { code: 'Z00.0', description: 'Exame médico geral' },
        ],
        default_medications: [
          { medication: 'Losartana Potássica 50mg', dosage: '1 comprimido via oral pela manhã' },
        ],
        checklist_items: [
          'Verificar pressão arterial em ambos os braços',
          'Calcular IMC e circunferência abdominal',
          'Revisar vacinação do adulto',
          'Orientar estilo de vida',
        ],
        is_system: true,
      },
      {
        name: 'Cardiologia - Hipertensão e Risco Cardiovascular',
        specialty: 'Cardiologia',
        description: 'Avaliação cardiovascular estruturada com estratificação de risco.',
        soap_subjective:
          'Paciente retorna para estratificação de risco cardiovascular. Nega dor torácica típica, palpitações, dispneia aos esforços ou ortopneia. Sem episódios sincopais. Tolerando medicações sem efeitos colaterais.',
        soap_objective:
          'PA de consultório: 128/82 mmHg | FC: 68 bpm regular.\nCarótidas: pulsos simétricos sem sopros.\nIctus cordis no 5º EIC na LHC, sem impulsões paraesternais. BNF 2T normofonéticas sem B3/B4.\nSem edema de membros inferiores ou estase jugular a 45º.',
        soap_assessment:
          '1. Risco cardiovascular intermediário a alto.\n2. Dislipidemia mista e HAS estágio 1 compensada.',
        soap_plan:
          '1. Otimizar estatinas para meta de LDL < 70 mg/dL.\n2. Solicitar ECG de 12 derivações e Ecocardiograma transtorácico.\n3. Prescrição de AAS em prevenção se indicado.',
        default_cid10: [
          { code: 'I10', description: 'Hipertensão primária' },
          { code: 'E78.2', description: 'Hiperlipidemia mista' },
        ],
        default_medications: [
          { medication: 'Atorvastatina 20mg', dosage: '1 cp à noite' },
          { medication: 'Enalapril 10mg', dosage: '1 cp de 12/12h' },
        ],
        checklist_items: [
          'Ausculta carotídea realizada',
          'Pulsos periféricos palpados',
          'Meta de LDL avaliada',
          'ECG recente revisado',
        ],
        is_system: true,
      },
      {
        name: 'Endocrinologia - Diabetes Mellitus Tipo 2',
        specialty: 'Endocrinologia',
        description: 'Modelo focado no controle glicêmico, HbA1c e prevenção de complicações.',
        soap_subjective:
          'Paciente portador de DM2 em acompanhamento. Traz mapa glicêmico com glicemias de jejum médias entre 110-140 mg/dL. Nega sintomas de hipoglicemia severa. Nega queixas de parestesias em MMII ou turvação visual.',
        soap_objective:
          'Peso: 82.5 kg | Circunferência abdominal: 96 cm.\nExame dos pés: pulsos pediosos e tibiais posteriores presentes. Teste do monofilamento 10g preservado em 10 pontos. Sem calosidades ou lesões tróficas.',
        soap_assessment:
          '1. Diabetes mellitus não-insulino-dependente sem complicações agudas (E11.9).\n2. Sobrepeso com adiposidade central.',
        soap_plan:
          '1. Ajuste de Metformina e avaliação de iSGLT2 para proteção cardiorrenal.\n2. Solicitação de HbA1c, microalbuminúria em amostra isolada e fundo de olho anual.\n3. Encaminhamento para nutricionista.',
        default_cid10: [
          { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sem complicações' },
        ],
        default_medications: [
          { medication: 'Metformina 850mg', dosage: '1 cp após o almoço e jantar' },
        ],
        checklist_items: [
          'Exame dos pés com monofilamento',
          'Avaliação de fundo de olho anual checada',
          'Microalbuminúria anual checada',
          'Meta de HbA1c discutida',
        ],
        is_system: true,
      },
      {
        name: 'Pediatria - Puericultura',
        specialty: 'Pediatria',
        description: 'Acompanhamento do crescimento, desenvolvimento neuropsicomotor e vacinas.',
        soap_subjective:
          'Responsável refere boa aceitação alimentar e sono regular. Sem febre ou queixas agudas. Evacuações e diurese fisiológicas.',
        soap_objective:
          'Peso: percentil 50 | Estatura: percentil 50 | Perímetro cefálico: percentil 50.\nDNPM adequado para a idade. Fontanela anterior normotensa. Otoscopia e oroscopia sem hiperemia. Sem linfonodomegalias.',
        soap_assessment: 'Puericultura normal, desenvolvimento adequado para a idade.',
        soap_plan:
          '1. Manter suplementação de ferro profilático e vitamina D conforme SBP.\n2. Calendário vacinal checado e em dia.\n3. Próximo retorno conforme cronograma.',
        default_cid10: [{ code: 'Z00.1', description: 'Exame de rotina de saúde da criança' }],
        default_medications: [
          { medication: 'Colecalciferol 200 UI/gota', dosage: '2 gotas ao dia pela manhã' },
        ],
        checklist_items: [
          'Curvas de crescimento plotadas',
          'Marcos do DNPM checados',
          'Carteira de vacinação revisada',
          'Orientações de prevenção de acidentes',
        ],
        is_system: true,
      },
    ]

    for (let t = 0; t < templatesToSeed.length; t++) {
      const tmpl = templatesToSeed[t]
      try {
        app.findFirstRecordByData('specialty_templates', 'name', tmpl.name)
      } catch (_) {
        const rec = new Record(specialtyTemplatesCol)
        rec.set('name', tmpl.name)
        rec.set('specialty', tmpl.specialty)
        rec.set('description', tmpl.description)
        rec.set('soap_subjective', tmpl.soap_subjective)
        rec.set('soap_objective', tmpl.soap_objective)
        rec.set('soap_assessment', tmpl.soap_assessment)
        rec.set('soap_plan', tmpl.soap_plan)
        rec.set('default_cid10', tmpl.default_cid10)
        rec.set('default_medications', tmpl.default_medications)
        rec.set('checklist_items', tmpl.checklist_items)
        rec.set('is_system', true)
        app.save(rec)
      }
    }

    // Seed 2: Access Grants & Audit Log (se houver paciente demo)
    if (patientId) {
      // Concessão 1: Ativa para Dr. Demo Médico (expira em 24h a partir de agora)
      const now = new Date()
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const past2Days = new Date(now.getTime() - 48 * 60 * 60 * 1000)

      try {
        const existingGrants = app.findRecordsByFilter(
          'access_grants',
          `patient = '${patientId}'`,
          '',
          1,
          0,
        )
        if (existingGrants.length === 0) {
          // Concessão ativa (Dr. Demo Médico)
          const grant1 = new Record(accessGrantsCol)
          grant1.set('patient', patientId)
          if (doctorId) grant1.set('granted_to_user', doctorId)
          grant1.set('target_name', 'Dr. Demo Médico')
          grant1.set('target_role', 'doctor')
          grant1.set('scope', 'prontuario,exames,prescricoes')
          grant1.set('status', 'ativa')
          grant1.set('reason', 'Consulta médica presencial / telemedicina agendada')
          grant1.set('expires_at', in24h.toISOString())
          app.save(grant1)

          // Concessão 2: Expirada (Clínica Demo)
          const grant2 = new Record(accessGrantsCol)
          grant2.set('patient', patientId)
          if (clinicId) grant2.set('granted_to_user', clinicId)
          grant2.set('target_name', 'Clínica Demo Resulta')
          grant2.set('target_role', 'clinic')
          grant2.set('scope', 'exames,prescricoes')
          grant2.set('status', 'expirada')
          grant2.set('reason', 'Check-up corporativo e exames ocupacionais')
          grant2.set('expires_at', past2Days.toISOString())
          app.save(grant2)

          // Concessão 3: Pendente (Dra. Juliana Cardiologista)
          const grant3 = new Record(accessGrantsCol)
          grant3.set('patient', patientId)
          grant3.set('target_name', 'Dra. Mariana Costa (Cardiologista)')
          grant3.set('target_role', 'doctor')
          grant3.set('scope', 'prontuario,exames')
          grant3.set('status', 'pendente')
          grant3.set('reason', 'Solicitação para segunda opinião cardiológica')
          grant3.set('expires_at', in24h.toISOString())
          app.save(grant3)

          // Auditoria 1: Paciente concedeu 24h ao médico
          const audit1 = new Record(accessAuditCol)
          audit1.set('patient', patientId)
          if (doctorId) audit1.set('actor_user', doctorId)
          audit1.set('actor_name', 'Dr. Demo Médico')
          audit1.set('actor_role', 'doctor')
          audit1.set('action', 'consultou')
          audit1.set('resource', 'Prontuário Clínico & Evolução SOAP')
          audit1.set('details', 'Acesso realizado durante teleconsulta via concessão ativa #AG-24H')
          audit1.set('ip_address', '189.40.12.88 (São Paulo - SP)')
          app.save(audit1)

          // Auditoria 2: Médico consultou exames
          const audit2 = new Record(accessAuditCol)
          audit2.set('patient', patientId)
          if (doctorId) audit2.set('actor_user', doctorId)
          audit2.set('actor_name', 'Dr. Demo Médico')
          audit2.set('actor_role', 'doctor')
          audit2.set('action', 'consultou')
          audit2.set('resource', 'Histórico de Marcadores Laboratoriais (Creatinina, TSH)')
          audit2.set('details', 'Visualização de curva de evolução temporal de exames')
          audit2.set('ip_address', '189.40.12.88 (São Paulo - SP)')
          app.save(audit2)

          // Auditoria 3: Concessão autorizada pelo paciente
          const audit3 = new Record(accessAuditCol)
          audit3.set('patient', patientId)
          audit3.set('actor_name', 'Paciente Demo Silva')
          audit3.set('actor_role', 'patient')
          audit3.set('action', 'concedeu_24h')
          audit3.set('resource', 'Autorização de Acesso 24 Horas')
          audit3.set('details', 'Paciente autorizou Dr. Demo Médico por 24 horas via aplicativo')
          audit3.set('ip_address', '201.86.110.14 (São Paulo - SP)')
          app.save(audit3)
        }
      } catch (_) {}

      // Seed 3: Lab Results com curva de evolução temporal (Hemoglobina, TSH, Creatinina, Glicemia)
      try {
        const existingLabs = app.findRecordsByFilter(
          'lab_results',
          `patient = '${patientId}'`,
          '',
          1,
          0,
        )
        if (existingLabs.length === 0) {
          const sampleLabs = [
            // Creatinina (curva temporal)
            {
              marker_name: 'Creatinina Sérica',
              marker_code: 'creatinina',
              value: 0.95,
              unit: 'mg/dL',
              reference_range: '0.70 - 1.20',
              is_abnormal: false,
              collected_at: '2025-06-10 08:00:00.000Z',
              source: 'Bioquímica Geral - Laboratório Fleury',
            },
            {
              marker_name: 'Creatinina Sérica',
              marker_code: 'creatinina',
              value: 1.05,
              unit: 'mg/dL',
              reference_range: '0.70 - 1.20',
              is_abnormal: false,
              collected_at: '2025-10-15 08:00:00.000Z',
              source: 'Painel Renal - Laboratório Fleury',
            },
            {
              marker_name: 'Creatinina Sérica',
              marker_code: 'creatinina',
              value: 1.18,
              unit: 'mg/dL',
              reference_range: '0.70 - 1.20',
              is_abnormal: false,
              collected_at: '2026-02-20 08:00:00.000Z',
              source: 'Controle Ambulatorial - Dasa',
            },
            {
              marker_name: 'Creatinina Sérica',
              marker_code: 'creatinina',
              value: 1.1,
              unit: 'mg/dL',
              reference_range: '0.70 - 1.20',
              is_abnormal: false,
              collected_at: '2026-07-05 08:00:00.000Z',
              source: 'Check-up Anual - Dasa',
            },

            // Hemoglobina
            {
              marker_name: 'Hemoglobina',
              marker_code: 'hemoglobina',
              value: 14.8,
              unit: 'g/dL',
              reference_range: '13.5 - 17.5',
              is_abnormal: false,
              collected_at: '2025-06-10 08:00:00.000Z',
              source: 'Hemograma Completo',
            },
            {
              marker_name: 'Hemoglobina',
              marker_code: 'hemoglobina',
              value: 14.2,
              unit: 'g/dL',
              reference_range: '13.5 - 17.5',
              is_abnormal: false,
              collected_at: '2025-10-15 08:00:00.000Z',
              source: 'Hemograma Completo',
            },
            {
              marker_name: 'Hemoglobina',
              marker_code: 'hemoglobina',
              value: 13.9,
              unit: 'g/dL',
              reference_range: '13.5 - 17.5',
              is_abnormal: false,
              collected_at: '2026-02-20 08:00:00.000Z',
              source: 'Hemograma Completo',
            },
            {
              marker_name: 'Hemoglobina',
              marker_code: 'hemoglobina',
              value: 14.5,
              unit: 'g/dL',
              reference_range: '13.5 - 17.5',
              is_abnormal: false,
              collected_at: '2026-07-05 08:00:00.000Z',
              source: 'Hemograma Completo',
            },

            // TSH (Hormônio Tireoestimulante)
            {
              marker_name: 'TSH Ultra Sensível',
              marker_code: 'tsh',
              value: 2.1,
              unit: 'mcUI/mL',
              reference_range: '0.40 - 4.50',
              is_abnormal: false,
              collected_at: '2025-06-10 08:00:00.000Z',
              source: 'Painel Tireoidiano',
            },
            {
              marker_name: 'TSH Ultra Sensível',
              marker_code: 'tsh',
              value: 2.8,
              unit: 'mcUI/mL',
              reference_range: '0.40 - 4.50',
              is_abnormal: false,
              collected_at: '2025-10-15 08:00:00.000Z',
              source: 'Painel Tireoidiano',
            },
            {
              marker_name: 'TSH Ultra Sensível',
              marker_code: 'tsh',
              value: 3.4,
              unit: 'mcUI/mL',
              reference_range: '0.40 - 4.50',
              is_abnormal: false,
              collected_at: '2026-02-20 08:00:00.000Z',
              source: 'Painel Tireoidiano',
            },
            {
              marker_name: 'TSH Ultra Sensível',
              marker_code: 'tsh',
              value: 2.6,
              unit: 'mcUI/mL',
              reference_range: '0.40 - 4.50',
              is_abnormal: false,
              collected_at: '2026-07-05 08:00:00.000Z',
              source: 'Painel Tireoidiano',
            },

            // Glicemia de Jejum
            {
              marker_name: 'Glicemia de Jejum',
              marker_code: 'glicemia',
              value: 92,
              unit: 'mg/dL',
              reference_range: '70 - 99',
              is_abnormal: false,
              collected_at: '2025-06-10 08:00:00.000Z',
              source: 'Glicemia Plasmática',
            },
            {
              marker_name: 'Glicemia de Jejum',
              marker_code: 'glicemia',
              value: 104,
              unit: 'mg/dL',
              reference_range: '70 - 99',
              is_abnormal: true,
              collected_at: '2025-10-15 08:00:00.000Z',
              source: 'Glicemia Plasmática',
            },
            {
              marker_name: 'Glicemia de Jejum',
              marker_code: 'glicemia',
              value: 98,
              unit: 'mg/dL',
              reference_range: '70 - 99',
              is_abnormal: false,
              collected_at: '2026-02-20 08:00:00.000Z',
              source: 'Glicemia Plasmática',
            },
            {
              marker_name: 'Glicemia de Jejum',
              marker_code: 'glicemia',
              value: 95,
              unit: 'mg/dL',
              reference_range: '70 - 99',
              is_abnormal: false,
              collected_at: '2026-07-05 08:00:00.000Z',
              source: 'Glicemia Plasmática',
            },

            // Colesterol Total
            {
              marker_name: 'Colesterol Total',
              marker_code: 'colesterol_total',
              value: 185,
              unit: 'mg/dL',
              reference_range: '< 190',
              is_abnormal: false,
              collected_at: '2025-06-10 08:00:00.000Z',
              source: 'Perfil Lipídico',
            },
            {
              marker_name: 'Colesterol Total',
              marker_code: 'colesterol_total',
              value: 212,
              unit: 'mg/dL',
              reference_range: '< 190',
              is_abnormal: true,
              collected_at: '2025-10-15 08:00:00.000Z',
              source: 'Perfil Lipídico',
            },
            {
              marker_name: 'Colesterol Total',
              marker_code: 'colesterol_total',
              value: 194,
              unit: 'mg/dL',
              reference_range: '< 190',
              is_abnormal: true,
              collected_at: '2026-02-20 08:00:00.000Z',
              source: 'Perfil Lipídico',
            },
            {
              marker_name: 'Colesterol Total',
              marker_code: 'colesterol_total',
              value: 178,
              unit: 'mg/dL',
              reference_range: '< 190',
              is_abnormal: false,
              collected_at: '2026-07-05 08:00:00.000Z',
              source: 'Perfil Lipídico',
            },
          ]

          for (let l = 0; l < sampleLabs.length; l++) {
            const slab = sampleLabs[l]
            const rec = new Record(labResultsCol)
            rec.set('patient', patientId)
            rec.set('marker_name', slab.marker_name)
            rec.set('marker_code', slab.marker_code)
            rec.set('value', slab.value)
            rec.set('unit', slab.unit)
            rec.set('reference_range', slab.reference_range)
            rec.set('is_abnormal', slab.is_abnormal)
            rec.set('collected_at', slab.collected_at)
            rec.set('source_document_name', slab.source)
            app.save(rec)
          }
        }
      } catch (_) {}

      // Seed 4: Clinical Documents (Atestado, Laudo, Encaminhamento, Declaração)
      if (doctorId) {
        try {
          const existingDocs = app.findRecordsByFilter(
            'clinical_documents',
            `patient = '${patientId}'`,
            '',
            1,
            0,
          )
          if (existingDocs.length === 0) {
            // Documento 1: Atestado Médico
            const doc1 = new Record(clinicalDocsCol)
            doc1.set('doctor', doctorId)
            doc1.set('patient', patientId)
            doc1.set('type', 'atestado')
            doc1.set('title', 'Atestado Médico de Afastamento')
            doc1.set(
              'content',
              'Atesto, para os devidos fins de comprovação laboral, que o(a) paciente esteve sob cuidados médicos nesta data e necessita de repouso pelo período de 3 (três) dias para recuperação clínica.',
            )
            doc1.set('cid10', 'J00 - Nasofaringite aguda (resfriado comum)')
            doc1.set('rest_days', 3)
            doc1.set('verification_code', 'AT-7821-4492')
            doc1.set('certificate_validated', true)
            doc1.set('status', 'enviado')
            doc1.set('sent_via', 'whatsapp')
            app.save(doc1)

            // Documento 2: Encaminhamento
            const doc2 = new Record(clinicalDocsCol)
            doc2.set('doctor', doctorId)
            doc2.set('patient', patientId)
            doc2.set('type', 'encaminhamento')
            doc2.set('title', 'Encaminhamento para Cardiologia')
            doc2.set(
              'content',
              'Encaminho o(a) paciente ao serviço de Cardiologia para avaliação de controle pressórico e estratificação de risco cardiovascular adicional. Paciente em uso de Losartana 50mg/dia com picos pressóricos esporádicos.',
            )
            doc2.set('cid10', 'I10 - Hipertensão essencial')
            doc2.set('specialty_target', 'Cardiologia')
            doc2.set('verification_code', 'EN-3914-8820')
            doc2.set('certificate_validated', true)
            doc2.set('status', 'emitido')
            doc2.set('sent_via', 'nenhum')
            app.save(doc2)

            // Documento 3: Laudo Médico
            const doc3 = new Record(clinicalDocsCol)
            doc3.set('doctor', doctorId)
            doc3.set('patient', patientId)
            doc3.set('type', 'laudo')
            doc3.set('title', 'Laudo de Aptidão Física')
            doc3.set(
              'content',
              'Laudo médico pericial atestando que o(a) paciente encontra-se em bom estado geral de saúde, sem contraindicações cardiovasculares ou osteoarticulares aparentes no momento para a prática de atividades físicas de intensidade leve a moderada.',
            )
            doc3.set('cid10', 'Z02.5 - Exame médico para participação em esportes')
            doc3.set('verification_code', 'LA-5510-9102')
            doc3.set('certificate_validated', true)
            doc3.set('status', 'enviado')
            doc3.set('sent_via', 'email')
            app.save(doc3)

            // Documento 4: Declaração de Comparecimento
            const doc4 = new Record(clinicalDocsCol)
            doc4.set('doctor', doctorId)
            doc4.set('patient', patientId)
            doc4.set('type', 'declaracao')
            doc4.set('title', 'Declaração de Comparecimento em Consulta')
            doc4.set(
              'content',
              'Declaro para os devidos fins que o(a) paciente compareceu a consulta médica eletiva no período das 14:00 às 15:30 horas.',
            )
            doc4.set('verification_code', 'DC-1189-6634')
            doc4.set('certificate_validated', false)
            doc4.set('status', 'emitido')
            doc4.set('sent_via', 'nenhum')
            app.save(doc4)
          }
        } catch (_) {}
      }
    }
  },
  (app) => {
    try {
      const cd = app.findCollectionByNameOrId('clinical_documents')
      app.delete(cd)
    } catch (_) {}
    try {
      const aal = app.findCollectionByNameOrId('access_audit_log')
      app.delete(aal)
    } catch (_) {}
    try {
      const ag = app.findCollectionByNameOrId('access_grants')
      app.delete(ag)
    } catch (_) {}
    try {
      const lr = app.findCollectionByNameOrId('lab_results')
      app.delete(lr)
    } catch (_) {}
    try {
      const st = app.findCollectionByNameOrId('specialty_templates')
      app.delete(st)
    } catch (_) {}
  },
)
