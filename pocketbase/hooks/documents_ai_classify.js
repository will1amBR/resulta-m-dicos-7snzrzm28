onRecordAfterCreateSuccess((e) => {
  const isClassified = e.record.getBool('ai_classified')
  if (isClassified) return e.next()

  const fileName = e.record.getString('name')
  if (!fileName) return e.next()

  try {
    const response = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente médico especialista em organizar documentos de pacientes nas seguintes categorias: exames, medicamentos, procedimentos, agendamentos, outros. Responda APENAS com a palavra da categoria.',
        },
        {
          role: 'user',
          content: 'Classifique este documento pelo nome: ' + fileName,
        },
      ],
    })

    let category = 'outros'
    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      const text = (response.choices[0].message.content || '').toLowerCase().trim()
      if (text.includes('exame')) category = 'exames'
      else if (
        text.includes('medicamento') ||
        text.includes('receita') ||
        text.includes('prescricao')
      )
        category = 'medicamentos'
      else if (text.includes('procedimento') || text.includes('cirurgia') || text.includes('ecg'))
        category = 'procedimentos'
      else if (
        text.includes('agendamento') ||
        text.includes('comprovante') ||
        text.includes('consulta')
      )
        category = 'agendamentos'
    }

    const rec = $app.findRecordById('documents', e.record.id)
    rec.set('folder', category)
    rec.set('ai_classified', true)
    $app.save(rec)
  } catch (err) {
    console.log('Error classifying document AI: ' + err.message)
  }

  return e.next()
}, 'documents')
