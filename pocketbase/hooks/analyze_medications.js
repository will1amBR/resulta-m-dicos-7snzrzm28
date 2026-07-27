routerAdd(
  'POST',
  '/backend/v1/analyze-medications',
  (e) => {
    const body = e.requestInfo().body || {}
    const cid10Codes = body.cid10_codes || []
    const prescribedMeds = body.prescribed_medications || []

    if (!prescribedMeds.length) return e.json(200, [])

    const conditions = cid10Codes
      .map(function (c) {
        return c.code + ' - ' + c.description
      })
      .join(', ')

    var medDetails = []
    for (var i = 0; i < prescribedMeds.length; i++) {
      var pm = prescribedMeds[i]
      var safeName = String(pm.medication || '').replace(/"/g, '')
      var found = null
      try {
        var records = $app.findRecordsByFilter('medications', 'name = "' + safeName + '"', '', 1, 0)
        if (records.length > 0) {
          var m = records[0]
          found = {
            name: pm.medication,
            dosage: pm.dosage || '',
            indications: m.getString('indications'),
            contraindications: m.getString('contraindications'),
            interactions: m.getString('interactions'),
          }
        }
      } catch (_) {}
      if (!found) {
        found = {
          name: pm.medication,
          dosage: pm.dosage || '',
          indications: '',
          contraindications: '',
          interactions: '',
        }
      }
      medDetails.push(found)
    }

    var prompt =
      'Voce e um farmaceutico clinico. Analise as seguintes medicacoes prescritas contra as condicoes do paciente (CID-10) e identifique contraindicacoes ou interacoes medicamentosas.\n\nCondicoes do paciente: ' +
      conditions +
      '\n\nMedicacoes prescritas: ' +
      JSON.stringify(medDetails) +
      '\n\nResponda APENAS com um array JSON de alertas. Cada alerta deve ter: medication (string), severity ("high", "medium", "low"), message (string em portugues). Se nao houver problemas, retorne [].'

    try {
      var response = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um assistente farmaceutico especializado em analise de contraindicacoes. Responda sempre com JSON valido, apenas o array.',
          },
          { role: 'user', content: prompt },
        ],
      })

      var alerts = []
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        var text = response.choices[0].message.content || ''
        var jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            alerts = JSON.parse(jsonMatch[0])
          } catch (_) {}
        }
      }

      return e.json(200, alerts)
    } catch (err) {
      return e.json(200, [])
    }
  },
  $apis.requireAuth(),
)
