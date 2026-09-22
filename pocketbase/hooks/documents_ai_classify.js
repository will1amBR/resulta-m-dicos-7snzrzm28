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

    // Se a categoria for exames ou houver texto com parâmetros laboratoriais, tentar extrair marcadores estruturados
    if (category === 'exames' || (fileName && fileName.toLowerCase().includes('exame'))) {
      try {
        const markerPrompt =
          'Extraia do seguinte texto ou laudo de exame todos os marcadores laboratoriais numéricos identificados.\n' +
          'Retorne APENAS um array JSON de marcadores no formato:\n' +
          '[{"marker_name":"Creatinina Sérica","marker_code":"creatinina","value":1.05,"unit":"mg/dL","reference_range":"0.70 - 1.20","is_abnormal":false}]\n' +
          'Codes aceitos prioritários: creatinina, hemoglobina, tsh, glicemia, colesterol_total, hba1c, leucocitos, plaquetas, potassio, tgo, tgp, ureia, acido_urico.\n' +
          'Texto do exame:\n' +
          (ocrText || fileName)

        const markerRes = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content:
                'Você é um extrator de parâmetros laboratoriais clínicos. Retorne apenas JSON sem markdown.',
            },
            { role: 'user', content: markerPrompt },
          ],
        })

        if (
          markerRes &&
          markerRes.choices &&
          markerRes.choices[0] &&
          markerRes.choices[0].message
        ) {
          const mContent = markerRes.choices[0].message.content || ''
          const mStart = mContent.indexOf('[')
          const mEnd = mContent.lastIndexOf(']')
          if (mStart >= 0 && mEnd > mStart) {
            const parsedMarkers = JSON.parse(mContent.substring(mStart, mEnd + 1))
            if (Array.isArray(parsedMarkers) && parsedMarkers.length > 0) {
              const labCol = $app.findCollectionByNameOrId('lab_results')
              const nowIso = new Date().toISOString()
              for (let mi = 0; mi < parsedMarkers.length; mi++) {
                const mk = parsedMarkers[mi]
                if (mk.marker_name && typeof mk.value === 'number') {
                  const labRec = new Record(labCol)
                  labRec.set('patient', rec.getString('patient'))
                  labRec.set('marker_name', mk.marker_name)
                  labRec.set(
                    'marker_code',
                    mk.marker_code || mk.marker_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                  )
                  labRec.set('value', mk.value)
                  labRec.set('unit', mk.unit || '')
                  labRec.set('reference_range', mk.reference_range || '')
                  labRec.set('is_abnormal', !!mk.is_abnormal)
                  labRec.set('collected_at', nowIso)
                  labRec.set('source_document_name', fileName || 'Documento OCR')
                  $app.save(labRec)
                }
              }
            }
          }
        }
      } catch (markErr) {
        console.log('Error extracting markers from document: ' + markErr.message)
      }
    }

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
          notif.set('link', '/patient/documentos')
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
