routerAdd(
  'POST',
  '/backend/v1/analyze-medications',
  (e) => {
    const body = e.requestInfo().body || {}
    const patientId = body.patient || ''
    const cid10Codes = body.cid10_codes || []
    const prescribedMeds = body.prescribed_medications || []

    if (!patientId) return e.badRequestError('patient ID is required')
    if (!Array.isArray(cid10Codes) || cid10Codes.length === 0) {
      return e.json(200, { alerts: [] })
    }
    if (!Array.isArray(prescribedMeds) || prescribedMeds.length === 0) {
      return e.json(200, { alerts: [] })
    }

    var medNames = []
    for (var i = 0; i < prescribedMeds.length; i++) {
      if (prescribedMeds[i].medication) medNames.push(prescribedMeds[i].medication)
    }

    var medInfo = []
    for (var j = 0; j < medNames.length; j++) {
      try {
        // Tenta encontrar por nome exato ou contenção
        var allMeds = $app.findRecordsByFilter('medications', '', '-created', 100, 0)
        var targetClean = medNames[j].toLowerCase().trim()
        var matched = null
        for (var mi = 0; mi < allMeds.length; mi++) {
          var recName = (allMeds[mi].getString('name') || '').toLowerCase()
          var recActive = (allMeds[mi].getString('active_ingredient') || '').toLowerCase()
          if (
            recName === targetClean ||
            targetClean.includes(recName) ||
            recName.includes(targetClean) ||
            (recActive && targetClean.includes(recActive))
          ) {
            matched = allMeds[mi]
            break
          }
        }

        if (matched) {
          medInfo.push({
            name: matched.getString('name'),
            active_ingredient: matched.getString('active_ingredient'),
            indications: matched.getString('indications'),
            contraindications: matched.getString('contraindications'),
            interactions: matched.getString('interactions'),
          })
        } else {
          medInfo.push({
            name: medNames[j],
            active_ingredient: '',
            indications: '',
            contraindications: '',
            interactions: '',
          })
        }
      } catch (_) {
        medInfo.push({
          name: medNames[j],
          active_ingredient: '',
          indications: '',
          contraindications: '',
          interactions: '',
        })
      }
    }

    // Buscar lista de medicamentos do seed para sugerir alternativas seguras
    var catalogSummary = []
    try {
      var allCatalog = $app.findRecordsByFilter('medications', '', 'name', 50, 0)
      for (var ci = 0; ci < allCatalog.length; ci++) {
        catalogSummary.push(
          allCatalog[ci].getString('name') +
            ' (' +
            allCatalog[ci].getString('active_ingredient') +
            ') - Ind: ' +
            allCatalog[ci].getString('indications') +
            ' | Contraind: ' +
            allCatalog[ci].getString('contraindications'),
        )
      }
    } catch (_) {}

    var cidDescriptions = []
    for (var k = 0; k < cid10Codes.length; k++) {
      var c = cid10Codes[k]
      if (typeof c === 'string') {
        cidDescriptions.push(c)
      } else if (c && c.code) {
        cidDescriptions.push(c.code + ' - ' + (c.description || ''))
      }
    }

    var systemPrompt =
      'Você é um farmacêutico clínico e médico especialista em farmacovigilância e segurança do paciente. ' +
      'Analise detalhadamente as medicações prescritas contra os diagnósticos/condições do paciente (CID-10) e entre os próprios fármacos prescritos (interações medicamentosas). ' +
      'Utilize os dados oficiais farmacológicos fornecidos (indicações, contraindicações e interações). ' +
      'Caso haja contraindicação (ex: doença/insuficiência hepática com Paracetamol, úlcera ou asma com AINEs/AAS, insuficiência renal com Metformina, gravidez/estenose renal com Losartana, etc.) ou interação grave, ' +
      'retorne um alerta claro explicando o risco E SUGIRA UMA ALTERNATIVA TERAPÊUTICA SEGURA E ACIONÁVEL presente no catálogo ou padrão clínico (ex: para dor/febre em paciente hepático sugerir Dipirona; para dor em úlcera sugerir Paracetamol ou analgésico não-AINE; para diabetes renal avaliar ajuste ou outra classe). ' +
      'Retorne APENAS um array JSON válido sem blocos de código nem markdown, no formato exato: ' +
      '[{"medication":"nome","severity":"high|medium|none","message":"descrição detalhada do risco clínico","suggestion":"sugestão de alternativa ou conduta clínica acionável"}]'

    var userContent =
      'CONDIÇÕES DO PACIENTE (CID-10 / Diagnósticos):\n' +
      cidDescriptions.join('\n') +
      '\n\nMEDICAÇÕES PRESCRITAS:\n'
    for (var m = 0; m < medInfo.length; m++) {
      var med = medInfo[m]
      userContent +=
        '- ' + med.name + ' (Princípio ativo: ' + (med.active_ingredient || 'N/A') + ')\n'
      if (med.indications) userContent += '  Indicações registradas: ' + med.indications + '\n'
      if (med.contraindications)
        userContent += '  Contraindicações registradas: ' + med.contraindications + '\n'
      if (med.interactions) userContent += '  Interações registradas: ' + med.interactions + '\n'
      if (prescribedMeds[m] && prescribedMeds[m].dosage) {
        userContent += '  Posologia prescrita: ' + prescribedMeds[m].dosage + '\n'
      }
      userContent += '\n'
    }

    if (catalogSummary.length > 0) {
      userContent +=
        '\n\nCATÁLOGO DE MEDICAMENTOS DISPONÍVEIS NA BASE (Use como referência para alternativas):\n' +
        catalogSummary.slice(0, 20).join('\n')
    }

    try {
      var response = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      })

      var alerts = []
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        var text = response.choices[0].message.content || ''
        var jsonStart = text.indexOf('[')
        var jsonEnd = text.lastIndexOf(']')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          var jsonStr = text.substring(jsonStart, jsonEnd + 1)
          try {
            var parsed = JSON.parse(jsonStr)
            if (Array.isArray(parsed)) alerts = parsed
          } catch (_) {}
        }
      }

      return e.json(200, { alerts: alerts })
    } catch (err) {
      return e.json(500, { error: 'AI analysis temporarily unavailable', alerts: [] })
    }
  },
  $apis.requireAuth(),
)
