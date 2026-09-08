routerAdd(
  'POST',
  '/backend/v1/transcribe-soap',
  (e) => {
    const body = e.requestInfo().body || {}
    const transcript = (body.transcript || '').trim()
    const patientName = body.patient_name || 'Paciente'
    const doctorName = body.doctor_name || 'Médico'

    if (!transcript) {
      return e.badRequestError('O texto da transcrição é obrigatório.')
    }

    const systemPrompt =
      'Você é um assistente médico especialista em documentação clínica e prontuário no formato SOAP. ' +
      'A partir do diálogo ou transcrição de uma consulta médica, estruture um resumo clínico rigoroso, fidedigno e profissional. ' +
      'Divida nas 4 seções SOAP:\n' +
      '- Subjetivo (S): Queixa principal, histórico da moléstia atual, sintomas relatados pelo paciente, medicações em uso relatadas.\n' +
      '- Objetivo (O): Exame físico citado, sinais vitais mencionados, exames complementares citados no diálogo.\n' +
      '- Avaliação (A): Hipóteses diagnósticas ou diagnósticos confirmados levantados na consulta.\n' +
      '- Plano (P): Condutas acordadas, receitas prescritas, exames solicitados, orientações e retornos.\n' +
      'Também sugira possíveis CIDs pertinentes (código e descrição) e medicações mencionadas.\n' +
      'Retorne APENAS um objeto JSON válido, sem markdown ou explicações fora do JSON:\n' +
      '{\n' +
      '  "soap_subjective": "...",\n' +
      '  "soap_objective": "...",\n' +
      '  "soap_assessment": "...",\n' +
      '  "soap_plan": "...",\n' +
      '  "suggested_cids": [{"code": "I10", "description": "Hipertensão arterial"}],\n' +
      '  "suggested_medications": [{"medication": "Nome", "dosage": "posologia"}]\n' +
      '}'

    const userContent =
      'PACIENTE: ' +
      patientName +
      '\nMÉDICO: ' +
      doctorName +
      '\n\nTRANSCRIÇÃO DO DIÁLOGO:\n' +
      transcript

    try {
      const response = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      })

      let soapResult = {
        soap_subjective: '',
        soap_objective: '',
        soap_assessment: '',
        soap_plan: '',
        suggested_cids: [],
        suggested_medications: [],
      }

      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content || ''
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1))
            if (parsed.soap_subjective) soapResult.soap_subjective = parsed.soap_subjective
            if (parsed.soap_objective) soapResult.soap_objective = parsed.soap_objective
            if (parsed.soap_assessment) soapResult.soap_assessment = parsed.soap_assessment
            if (parsed.soap_plan) soapResult.soap_plan = parsed.soap_plan
            if (Array.isArray(parsed.suggested_cids))
              soapResult.suggested_cids = parsed.suggested_cids
            if (Array.isArray(parsed.suggested_medications))
              soapResult.suggested_medications = parsed.suggested_medications
          } catch (_) {}
        }
      }

      if (!soapResult.soap_subjective && !soapResult.soap_plan) {
        soapResult.soap_subjective = 'Transcrição da consulta: ' + transcript
        soapResult.soap_assessment = 'Avaliação clínica realizada em teleconsulta.'
        soapResult.soap_plan = 'Orientações transmitidas ao paciente.'
      }

      return e.json(200, soapResult)
    } catch (err) {
      return e.json(500, {
        error: 'Erro ao gerar SOAP com IA: ' + err.message,
        soap_subjective: transcript,
        soap_objective: '',
        soap_assessment: '',
        soap_plan: '',
        suggested_cids: [],
        suggested_medications: [],
      })
    }
  },
  $apis.requireAuth(),
)
