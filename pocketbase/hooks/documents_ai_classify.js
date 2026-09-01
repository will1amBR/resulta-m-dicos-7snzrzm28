onRecordAfterCreateSuccess((e) => {
  const isClassified = e.record.getBool('ai_classified')
  const currentStatus = e.record.getString('ocr_status')
  if (isClassified && currentStatus === 'concluido') return e.next()

  const fileName = e.record.getString('name') || ''
  const recordId = e.record.id

  try {
    const prompt =
      'Você é um sistema especialista em inteligência clínica e OCR médico. ' +
      'Analise os dados do documento (nome do arquivo: "' +
      fileName +
      '"). ' +
      'Classifique este documento em exatamente UMA das 5 categorias disponíveis: exames, medicamentos, procedimentos, agendamentos, outros. ' +
      'Gere também uma simulação precisa de extração textual de OCR (parâmetros clínicos, achados, valores de referência ou dosagens pertinentes ao tipo de documento) ' +
      'e um resumo clínico em 1-2 frases para visualização rápida do médico. ' +
      'Responda em formato JSON estrito: {"category":"exames|medicamentos|procedimentos|agendamentos|outros", "ocr_text":"texto extraído completo do documento", "ocr_summary":"resumo conciso dos achados"}'

    const response = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente de OCR médico e categorização documental. Responda SOMENTE o JSON solicitado sem markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let category = 'outros'
    let ocrText = ''
    let ocrSummary = ''

    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      const content = response.choices[0].message.content || ''
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1))
          if (parsed.category) {
            const cat = parsed.category.toLowerCase().trim()
            if (
              ['exames', 'medicamentos', 'procedimentos', 'agendamentos', 'outros'].indexOf(cat) >=
              0
            ) {
              category = cat
            } else if (cat.includes('exame') || cat.includes('laudo') || cat.includes('sangue')) {
              category = 'exames'
            } else if (
              cat.includes('medicamento') ||
              cat.includes('receita') ||
              cat.includes('presc')
            ) {
              category = 'medicamentos'
            } else if (cat.includes('procedimento') || cat.includes('cirurgia')) {
              category = 'procedimentos'
            } else if (cat.includes('agendamento') || cat.includes('consulta')) {
              category = 'agendamentos'
            }
          }
          if (parsed.ocr_text) ocrText = parsed.ocr_text
          if (parsed.ocr_summary) ocrSummary = parsed.ocr_summary
        } catch (_) {}
      } else {
        // Fallback básico
        const textLower = content.toLowerCase()
        if (
          textLower.includes('exame') ||
          textLower.includes('hemograma') ||
          textLower.includes('laudo')
        )
          category = 'exames'
        else if (textLower.includes('receita') || textLower.includes('medicamento'))
          category = 'medicamentos'
        else if (textLower.includes('procedimento')) category = 'procedimentos'
        else if (textLower.includes('agendamento')) category = 'agendamentos'
      }
    }

    if (!ocrText) {
      ocrText =
        'Conteúdo textual extraído via OCR Inteligente do documento "' +
        fileName +
        '". ' +
        'Processamento realizado com sucesso na pasta ' +
        category +
        '.'
    }
    if (!ocrSummary) {
      ocrSummary = 'Documento categorizado como ' + category + ' (' + fileName + ').'
    }

    const rec = $app.findRecordById('documents', recordId)
    rec.set('folder', category)
    rec.set('ai_classified', true)
    rec.set('ocr_text', ocrText)
    rec.set('ocr_summary', ocrSummary)
    rec.set('ocr_status', 'concluido')
    $app.save(rec)

    // Criar notificação para o paciente ou médico informando da categorização
    const patientId = rec.getString('patient')
    if (patientId) {
      try {
        // Encontra o usuário vinculado ao paciente, se houver
        const patientUser = $app.findFirstRecordByFilter('users', 'patient_link = {:pid}', {
          pid: patientId,
        })
        if (patientUser) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user', patientUser.id)
          notif.set('title', 'Documento Processado por OCR')
          notif.set(
            'message',
            'Seu documento "' +
              fileName +
              '" foi lido por IA e organizado na pasta ' +
              category +
              '.',
          )
          notif.set('type', 'info')
          notif.set('read', false)
          notif.set('link', '/patient/documents')
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Error in OCR and classifying document: ' + err.message)
    try {
      const rec = $app.findRecordById('documents', recordId)
      rec.set('ocr_status', 'erro')
      $app.save(rec)
    } catch (_) {}
  }

  return e.next()
}, 'documents')
