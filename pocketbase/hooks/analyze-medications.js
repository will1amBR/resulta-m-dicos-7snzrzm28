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
        var rec = $app.findFirstRecordByFilter('medications', 'name = {:name}', medNames[j])
        medInfo.push({
          name: rec.getString('name'),
          indications: rec.getString('indications'),
          contraindications: rec.getString('contraindications'),
          interactions: rec.getString('interactions'),
        })
      } catch (_) {
        medInfo.push({
          name: medNames[j],
          indications: '',
          contraindications: '',
          interactions: '',
        })
      }
    }

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
      'Você é um farmacêutico clínico especialista. Analise as medicações prescritas contra as condições/diagnósticos do paciente (CID-10). Retorne APENAS um array JSON válido (sem markdown, sem texto adicional) com alertas no formato: [{"medication":"nome","severity":"high|medium|none","message":"descrição do alerta em português"}]. Inclua um alerta para cada medicação analisada. Use \'high\' para contraindicações absolutas, \'medium\' para precauções, \'none\' quando não há conflito.'

    var userContent =
      'Condições do paciente (CID-10):\n' +
      cidDescriptions.join('\n') +
      '\n\nMedicações prescritas:\n'
    for (var m = 0; m < medInfo.length; m++) {
      var med = medInfo[m]
      userContent += '- ' + med.name + '\n'
      userContent += '  Indicações: ' + med.indications + '\n'
      userContent += '  Contraindicações: ' + med.contraindications + '\n'
      userContent += '  Interações: ' + med.interactions + '\n'
      if (prescribedMeds[m] && prescribedMeds[m].dosage) {
        userContent += '  Posologia prescrita: ' + prescribedMeds[m].dosage + '\n'
      }
      userContent += '\n'
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
