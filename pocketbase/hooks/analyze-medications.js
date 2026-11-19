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

    // ---------------------------------------------------------------
    // 1. CONTEXTO CLÍNICO DO PACIENTE (mesmo formato do serviço
    //    frontend src/services/patient-clinical-context.ts)
    // ---------------------------------------------------------------
    var ctx = {
      name: '',
      age: null,
      sex: 'não informado',
      allergies: [],
      chronic_conditions: [],
      continuous_medications: [],
      renal_function: { creatinine_mg_dl: null, collected_at: null },
    }

    try {
      var patientRec = $app.findRecordById('patients', patientId)
      ctx.name = patientRec.getString('name') || ''

      // Idade a partir da data de nascimento
      var birthDate = patientRec.getString('birth_date') || ''
      if (birthDate) {
        var by = parseInt(birthDate.substring(0, 4))
        if (!isNaN(by) && by > 1900) {
          ctx.age = new Date().getFullYear() - by
        }
      }

      // Alergias registradas no cadastro (separadas por , ; ou quebra de linha)
      var rawAllergies = patientRec.getString('allergies') || ''
      if (rawAllergies) {
        var parts = rawAllergies.split(/[,;\n]/)
        for (var pa = 0; pa < parts.length; pa++) {
          var allergy = String(parts[pa]).trim()
          var low = allergy.toLowerCase()
          if (
            allergy &&
            low !== 'nenhuma' &&
            low !== 'neg' &&
            low !== 'não' &&
            low.indexOf('nega alergia') !== 0 &&
            low.indexOf('sem alergia') !== 0
          ) {
            ctx.allergies.push(allergy)
          }
        }
      }
      // Condições crônicas declaradas no perfil do cadastro (texto separado
      // por ';' ou quebra de linha — mesmo formato do campo allergies).
      // Cada item pode vir como "Nome", "E11 Diabetes" ou "Diabetes (E11)".
      var rawChronic = ''
      try {
        rawChronic = patientRec.getString('chronic_conditions') || ''
      } catch (ccErr) {
        rawChronic = ''
      }
      if (rawChronic) {
        var ccParts = rawChronic.split(/[;\n]/)
        for (var ccP = 0; ccP < ccParts.length; ccP++) {
          var ccLabel = String(ccParts[ccP]).trim()
          if (!ccLabel) continue
          var ccCode = ccLabel.match(/\b[A-Z]\d{2}(?:\.\d)?\b/)
          var ccDesc = ccLabel.replace(/\s*\([^)]*CID[^)]*\)\s*/gi, ' ').trim()
          if (ccCode && !ccCode.index) {
            // formato "E11 Diabetes": remove o código do início da descrição
            ccDesc =
              ccLabel
                .substring(ccCode[0].length)
                .replace(/^[\s\-–—:]+/, '')
                .trim() || ccLabel
          }
          var ccEntry = { code: ccCode ? ccCode[0] : '', description: ccDesc || ccLabel }
          var ccExists = false
          for (var ccE = 0; ccE < ctx.chronic_conditions.length; ccE++) {
            var eC = ctx.chronic_conditions[ccE]
            if (
              (ccEntry.code && eC.code === ccEntry.code) ||
              (!ccEntry.code && eC.description.toLowerCase() === ccEntry.description.toLowerCase())
            ) {
              ccExists = true
              break
            }
          }
          if (!ccExists) ctx.chronic_conditions.push(ccEntry)
        }
      }

      // Medicamentos de uso contínuo declarados no perfil do cadastro.
      // Formato gravado pelo perfil: "Nome — dosagem"; mantém só o nome.
      var rawCont = ''
      try {
        rawCont = patientRec.getString('continuous_medications') || ''
      } catch (cmErr) {
        rawCont = ''
      }
      if (rawCont) {
        var cmParts = rawCont.split(/[;\n]/)
        for (var cmP = 0; cmP < cmParts.length; cmP++) {
          var cmLabel = String(cmParts[cmP]).trim()
          if (!cmLabel) continue
          var cmName = cmLabel.split(/\s+[-–—]\s+/)[0].trim()
          if (cmName && ctx.continuous_medications.indexOf(cmName) === -1) {
            ctx.continuous_medications.push(cmName)
          }
        }
      }
    } catch (_) {}

    // Condições crônicas: CID-10 do histórico de prontuários
    try {
      var records = $app.findRecordsByFilter(
        'medical_records',
        "patient = '" + patientId + "'",
        '-created',
        20,
        0,
      )
      var byCode = {}
      for (var r = 0; r < records.length; r++) {
        var cids = records[r].get('cid10_codes')
        var cidsArr = []
        try {
          cidsArr = JSON.parse(cids) || []
        } catch (jsonErr) {
          cidsArr = Array.isArray(cids) ? cids : []
        }
        if (!Array.isArray(cidsArr)) cidsArr = []
        for (var cIdx = 0; cIdx < cidsArr.length; cIdx++) {
          var cidItem = cidsArr[cIdx]
          if (cidItem && cidItem.code && !byCode[cidItem.code]) {
            byCode[cidItem.code] = cidItem.description || cidItem.code
          }
        }
      }
      var condCodes = Object.keys(byCode)
      for (var cc = 0; cc < condCodes.length; cc++) {
        ctx.chronic_conditions.push({ code: condCodes[cc], description: byCode[condCodes[cc]] })
      }
    } catch (_) {}

    // Medicamentos em uso contínuo: prescrições ativas anteriores
    try {
      var rxList = $app.findRecordsByFilter(
        'prescriptions',
        "patient_id = '" +
          patientId +
          "' && (status = 'emitida' || status = 'enviada' || status = 'aguardando_renovacao')",
        '-created',
        10,
        0,
      )
      var seenMeds = {}
      for (var rxI = 0; rxI < rxList.length; rxI++) {
        var rxMeds = rxList[rxI].get('medications')
        var rxMedsArr = []
        try {
          rxMedsArr = JSON.parse(rxMeds) || []
        } catch (jsonErr2) {
          rxMedsArr = Array.isArray(rxMeds) ? rxMeds : []
        }
        if (!Array.isArray(rxMedsArr)) rxMedsArr = []
        for (var mIdx = 0; mIdx < rxMedsArr.length; mIdx++) {
          var mName = rxMedsArr[mIdx] && rxMedsArr[mIdx].medication
          if (mName && !seenMeds[mName]) {
            seenMeds[mName] = true
            ctx.continuous_medications.push(mName)
          }
        }
      }
    } catch (_) {}

    // Função renal: creatinina mais recente
    try {
      var labs = $app.findRecordsByFilter(
        'lab_results',
        "patient = '" + patientId + "' && marker_code = 'creatinina'",
        '-collected_at',
        1,
        0,
      )
      if (labs.length > 0) {
        var labVal = labs[0].getFloat('value')
        if (labVal > 0) {
          ctx.renal_function.creatinine_mg_dl = labVal
          ctx.renal_function.collected_at = labs[0].getString('collected_at')
        }
      }
    } catch (_) {}

    // ---------------------------------------------------------------
    // 2. ENRIQUECER CONDIÇÕES COM AS CIDs DA PRÓPRIA CONSULTA
    //    (as CIDs enviadas no body entram também como quadro atual)
    // ---------------------------------------------------------------
    var cidDescriptions = []
    var consultationCodes = {}
    for (var k = 0; k < cid10Codes.length; k++) {
      var c = cid10Codes[k]
      if (typeof c === 'string') {
        cidDescriptions.push(c)
        consultationCodes[c.split(' ')[0]] = true
      } else if (c && c.code) {
        cidDescriptions.push(c.code + ' - ' + (c.description || ''))
        consultationCodes[c.code] = true
        if (
          !ctx.chronic_conditions.some(function (cc2) {
            return cc2.code === c.code
          })
        ) {
          ctx.chronic_conditions.push({ code: c.code, description: c.description || c.code })
        }
      }
    }

    // ---------------------------------------------------------------
    // 3. BUSCAR DADOS DOS MEDICAMENTOS NO CATÁLOGO
    // ---------------------------------------------------------------
    var medInfo = []
    for (var j = 0; j < medNames.length; j++) {
      try {
        var allMeds = $app.findRecordsByFilter('medications', '', '-created', 200, 0)
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

    // ---------------------------------------------------------------
    // 4. ANÁLISE DETERMINÍSTICA LOCAL (camada 1 — sempre roda)
    //    Cruza: alergias, contraindicações, interações (medicamento a
    //    medicamento e contra medicamentos em uso contínuo) e função renal.
    // ---------------------------------------------------------------
    var ALLERGY_MATCHES = [
      { keys: ['dipirona', 'dipyrone', 'metamizol'], alt: 'Paracetamol' },
      { keys: ['penicilina', 'penicillin', 'amoxicilina', 'amoxicillin'], alt: 'Clorfeniramina' },
      { keys: ['frutos do mar', 'frutos do mar'], alt: 'Paracetamol' },
      { keys: ['sulfas', 'sulfa', 'sulfonamida'], alt: 'Cefalexina' },
      { keys: ['aspirina', 'aas', 'ácido acetilsalicílico'], alt: 'Dipirona' },
      { keys: ['ibuprofeno', 'ibuprofen'], alt: 'Dipirona' },
      { keys: ['naproxeno'], alt: 'Dipirona' },
      { keys: ['codeína', 'codeine', 'opioides'], alt: 'Paracetamol' },
      { keys: ['iode', 'iodo'], alt: 'Metformina' },
      { keys: ['látex', 'latex'], alt: '' },
    ]

    var CONTRAINDICATION_MATCHES = [
      // hepática
      {
        cidPatterns: ['K70', 'K71', 'K72', 'K73', 'K74', 'K76', 'B15', 'B16', 'B17', 'B18', 'B19'],
        keywords: ['hepatic'],
        meds: ['Paracetamol', 'paracetamol', 'Dipirona', 'metamizol'],
        level: 'contraindicacao',
        reason: 'Doença hepática: risco de hepatotoxicidade',
        alt: 'Evitar analgésicos hepatoxicos; considerar AINE com cautela',
      },
      // renal
      {
        cidPatterns: ['N18', 'N19', 'I12', 'I13'],
        keywords: ['renal', 'insufici'],
        meds: [
          'Metformina',
          'metformin',
          'Losartana',
          'losartan',
          'Ibuprofeno',
          'ibuprofen',
          'Naproxeno',
        ],
        level: 'contraindicacao',
        reason: 'Doença renal: risco de acidose lática / agravamento da função renal',
        alt: 'Ajustar dose ou trocar por classe alternativa',
      },
      {
        cidPatterns: ['N18', 'N19'],
        keywords: ['renal'],
        meds: ['Enalapril', 'enalapril', 'Captopril', 'captopril'],
        level: 'precaucao',
        reason: 'IECA em doença renal: monitorar potássio e creatinina',
        alt: '',
      },
      // úlcera / GI
      {
        cidPatterns: ['K25', 'K26', 'K27', 'K29'],
        keywords: ['ulcera', 'úlcera', 'gastrite'],
        meds: [
          'Ibuprofeno',
          'ibuprofen',
          'Naproxeno',
          'Aspirina',
          'AAS',
          'Ketoprofeno',
          'Diclofenaco',
        ],
        level: 'contraindicacao',
        reason: 'Úlcera/gastrite: AINEs aumentam risco de sangramento GI',
        alt: 'Prefira Paracetamol ou Dipirona para dor/febre',
      },
      // asma
      {
        cidPatterns: ['J45', 'J46'],
        keywords: ['asma', 'broncoespasmo'],
        meds: ['Aspirina', 'AAS', 'Ibuprofeno', 'Naproxeno'],
        level: 'precaucao',
        reason: 'Asma: AINEs podem desencadear broncoespasmo',
        alt: 'Prefira Paracetamol ou Dipirona',
      },
      // gravidez — não detectável via CID aqui, mas por idade/sexo
      { cidPatterns: [], keywords: [], meds: [], level: 'atencao', reason: '', alt: '' },
      // cardiovascular
      {
        cidPatterns: ['I21', 'I22', 'I25', 'I20'],
        keywords: ['infarto', 'isquemic'],
        meds: ['Sildenafil', 'Tadalafila', 'vardenafil'],
        level: 'contraindicacao',
        reason: 'Doença cardíaca isquêmica: nitratos/inibidores de PDE5 são contraindicados',
        alt: 'Avaliar alternativa cardiossegura',
      },
      // hipertensão
      {
        cidPatterns: ['I10'],
        keywords: ['hipertens'],
        meds: ['AAS', 'Aspirina', 'Ibuprofeno', 'Diclofenaco', 'Naproxeno'],
        level: 'atencao',
        reason: 'Hipertensão: AINEs podem elevar a pressão arterial',
        alt: 'Monitorar PA; prefira Paracetamol para dor',
      },
      // diabetes
      {
        cidPatterns: ['E10', 'E11', 'E14'],
        keywords: ['diabet'],
        meds: ['Prednisona', 'prednisona', 'Dexametasona', 'corticoide'],
        level: 'atencao',
        reason: 'Diabetes: corticoides elevam a glicemia',
        alt: 'Monitorar glicemia; considerar pauta alternativa',
      },
      // hipotireoidismo
      {
        cidPatterns: ['E03'],
        keywords: ['hipotireo'],
        meds: [],
        level: 'atencao',
        reason: '',
        alt: '',
      },
    ]

    var INTERACTION_PAIRS = [
      {
        a: ['warfarina', 'coumadin', 'varfarina'],
        b: ['aas', 'aspirina', 'ibuprofeno', 'naproxeno', 'diclofenaco'],
        level: 'contraindicacao',
        reason: 'Anticoagulante + AINE: risco alto de sangramento',
        alt: 'Use Paracetamol ou Dipirona para dor',
      },
      {
        a: ['warfarina', 'varfarina', 'coumadin'],
        b: ['amoxicilina', 'azitromicina', 'ciprofloxacino'],
        level: 'precaucao',
        reason: 'Antibiótico pode potencializar anticoagulante',
        alt: 'Monitorar INR',
      },
      {
        a: ['lisinopril', 'enalapril', 'captopril', 'losartana'],
        b: ['espironolactona', 'potássio'],
        level: 'precaucao',
        reason: 'Risco de hipercalemia (potássio elevado)',
        alt: 'Monitorar potássio sérico',
      },
      {
        a: ['metformina'],
        b: ['contraste'],
        level: 'atencao',
        reason: 'Contraste iodado: suspender metformina no exame',
        alt: '',
      },
      {
        a: ['sildenafil', 'tadalafila'],
        b: ['nitroglicerina', 'isosorbida', 'nitratos'],
        level: 'contraindicacao',
        reason: 'Inibidor de PDE5 + nitrato: hipotensão grave',
        alt: 'Contraindicação absoluta',
      },
      {
        a: ['fluoxetina', 'sertralina', 'paroxetina', 'citalopram'],
        b: ['tramadol', 'codeína', 'sumatriptano'],
        level: 'precaucao',
        reason: 'Risco de síndrome serotoninérgica',
        alt: 'Monitorar sintomas; considerar alternativa',
      },
      {
        a: ['levotiroxina'],
        b: ['omeprazol', 'carbonato de cálcio', 'ferro'],
        level: 'atencao',
        reason: 'Reduz absorção da levotiroxina',
        alt: 'Separar as tomadas em pelo menos 4 horas',
      },
      {
        a: ['litio', 'lítio'],
        b: ['ibuprofeno', 'diclofenaco', 'naproxeno'],
        level: 'precaucao',
        reason: 'AINE reduz clearance de lítio: risco de toxicidade',
        alt: 'Prefira Paracetamol',
      },
      {
        a: ['digoxina'],
        b: ['amiodarona', 'verapamil', 'diltiazem'],
        level: 'precaucao',
        reason: 'Eleva níveis plasmáticos de digoxina',
        alt: 'Monitorar digoxinemia',
      },
      {
        a: ['metotrexato'],
        b: ['aas', 'aspirina', 'ibuprofeno', 'naproxeno', 'sulfasalazina'],
        level: 'contraindicacao',
        reason: 'AINE reduz excreção de metotrexato: toxicidade hematológica',
        alt: 'Prefira Paracetamol',
      },
      {
        a: ['estatinas', 'sinvastatina', 'atorvastatina'],
        b: ['azitromicina', 'claritromicina', 'eritromicina', 'cetoconazol'],
        level: 'atencao',
        reason: 'Risco de miopatia/rabdomiólise',
        alt: 'Monitorar CK; considerar pausa temporária',
      },
      {
        a: ['dipirona'],
        b: ['ciclosporina', 'tacrolimus'],
        level: 'atencao',
        reason: 'Interação farmacocinética possível',
        alt: '',
      },
      {
        a: ['clopidogrel'],
        b: ['omeprazol', 'esomeprazol'],
        level: 'atencao',
        reason: 'IPP reduz ativação do clopidogrel',
        alt: 'Preferir pantoprazol',
      },
    ]

    var KIDNEY_DRUGS = [
      'metformina',
      'losartana',
      'losartan',
      'enalapril',
      'captopril',
      'ibuprofeno',
      'naproxeno',
      'diclofenaco',
      'litio',
      'lítio',
    ]

    function norm(s) {
      return String(s || '')
        .toLowerCase()
        .trim()
    }

    function findLevelForMedsFromAllergy(drugText) {
      var t = norm(drugText)
      for (var i = 0; i < ALLERGY_MATCHES.length; i++) {
        for (var j2 = 0; j2 < ALLERGY_MATCHES[i].keys.length; j2++) {
          if (t.indexOf(ALLERGY_MATCHES[i].keys[j2]) !== -1) return ALLERGY_MATCHES[i]
        }
      }
      return null
    }

    function drugMatchesRule(drugText, ruleMedList) {
      var t = norm(drugText)
      for (var i = 0; i < ruleMedList.length; i++) {
        if (t.indexOf(norm(ruleMedList[i])) !== -1) return true
      }
      return false
    }

    function cidMatchesRule(cidList, rule) {
      for (var i = 0; i < cidList.length; i++) {
        var code = norm(cidList[i].code || cidList[i])
        for (var j3 = 0; j3 < rule.cidPatterns.length; j3++) {
          if (code.indexOf(rule.cidPatterns[j3].toLowerCase()) === 0) return true
        }
        var desc = norm(cidList[i].description || '')
        for (var k2 = 0; k2 < rule.keywords.length; k2++) {
          if (desc.indexOf(rule.keywords[k2]) !== -1) return true
        }
      }
      return false
    }

    var alerts = []
    var seenAlertKeys = {}

    function pushAlert(medName, level, reason, suggestion, source) {
      var key = norm(medName) + '|' + level + '|' + norm(reason)
      if (seenAlertKeys[key]) return
      seenAlertKeys[key] = true
      alerts.push({
        medication: medName,
        risk_level: level, // contraindicacao | precaucao | atencao | ok
        message: reason,
        suggestion: suggestion || '',
        reason: reason,
        source: source || 'deterministico',
      })
    }

    // (a) Alergias × medicamento prescrito
    for (var aI = 0; aI < ctx.allergies.length; aI++) {
      var allergy = ctx.allergies[aI]
      var allergyMatch = findLevelForMedsFromAllergy(allergy)
      if (!allergyMatch) continue
      for (var mi2 = 0; mi2 < medInfo.length; mi2++) {
        if (
          drugMatchesRule(
            medInfo[mi2].name + ' ' + medInfo[mi2].active_ingredient,
            allergyMatch.keys,
          )
        ) {
          pushAlert(
            medInfo[mi2].name,
            'contraindicacao',
            'Paciente relata alergia a "' +
              allergy +
              '". "' +
              medInfo[mi2].name +
              '" pertence a essa classe — risco de reação alérgica.',
            allergyMatch.alt
              ? 'Alternativa sugerida: ' + allergyMatch.alt
              : 'Escolher medicamento de outra classe terapêutica.',
            'deterministico',
          )
        }
      }
    }

    // (b) Contraindicações × condições crônicas (CID-10 do histórico + da consulta)
    for (var cmI = 0; cmI < CONTRAINDICATION_MATCHES.length; cmI++) {
      var rule = CONTRAINDICATION_MATCHES[cmI]
      if (!rule.meds.length || (!rule.cidPatterns.length && !rule.keywords.length)) continue
      if (!cidMatchesRule(ctx.chronic_conditions, rule)) continue
      for (var mi3 = 0; mi3 < medInfo.length; mi3++) {
        var drugText = medInfo[mi3].name + ' ' + medInfo[mi3].active_ingredient
        if (drugMatchesRule(drugText, rule.meds)) {
          pushAlert(
            medInfo[mi3].name,
            rule.level,
            rule.reason + ' — condição detectada no quadro clínico do paciente (CID-10).',
            rule.alt,
            'deterministico',
          )
        }
      }
    }

    // (c) Função renal × fármacos nefrotóxicos / ajuste de dose
    if (
      ctx.renal_function.creatinine_mg_dl !== null &&
      ctx.renal_function.creatinine_mg_dl >= 1.5
    ) {
      for (var kdI = 0; kdI < medInfo.length; kdI++) {
        if (
          drugMatchesRule(medInfo[kdI].name + ' ' + medInfo[kdI].active_ingredient, KIDNEY_DRUGS)
        ) {
          pushAlert(
            medInfo[kdI].name,
            ctx.renal_function.creatinine_mg_dl >= 2.0 ? 'contraindicacao' : 'precaucao',
            'Creatinina elevada (' +
              ctx.renal_function.creatinine_mg_dl +
              ' mg/dL): risco de acúmulo/toxicidade do fármaco.',
            'Considerar ajuste de dose ou alternativa sem cleared renal',
            'deterministico',
          )
          break
        }
      }
    }

    // (d) Interações entre os próprios fármacos prescritos
    for (var pA = 0; pA < medInfo.length; pA++) {
      for (var pB = pA + 1; pB < medInfo.length; pB++) {
        var drugA =
          medInfo[pA].name + ' ' + medInfo[pA].active_ingredient + ' ' + medInfo[pA].interactions
        var drugB =
          medInfo[pB].name + ' ' + medInfo[pB].active_ingredient + ' ' + medInfo[pB].interactions
        for (var ipI = 0; ipI < INTERACTION_PAIRS.length; ipI++) {
          var pair = INTERACTION_PAIRS[ipI]
          var ab = drugMatchesRule(drugA, pair.a) && drugMatchesRule(drugB, pair.b)
          var ba = drugMatchesRule(drugB, pair.a) && drugMatchesRule(drugA, pair.b)
          if (ab || ba) {
            pushAlert(
              medInfo[pA].name + ' + ' + medInfo[pB].name,
              pair.level,
              pair.reason + ' (interação "' + medInfo[pA].name + '" × "' + medInfo[pB].name + '").',
              pair.alt,
              'deterministico',
            )
          }
        }
      }
    }

    // (e) Interações com medicamentos de uso contínuo (prescrições anteriores)
    for (var contI = 0; contI < ctx.continuous_medications.length; contI++) {
      var contMed = ctx.continuous_medications[contI]
      for (var ni = 0; ni < medInfo.length; ni++) {
        var drugNew =
          medInfo[ni].name + ' ' + medInfo[ni].active_ingredient + ' ' + medInfo[ni].interactions
        var drugCont = contMed
        for (var ipI2 = 0; ipI2 < INTERACTION_PAIRS.length; ipI2++) {
          var pair2 = INTERACTION_PAIRS[ipI2]
          var ab2 = drugMatchesRule(drugNew, pair2.a) && drugMatchesRule(drugCont, pair2.b)
          var ba2 = drugMatchesRule(drugCont, pair2.a) && drugMatchesRule(drugNew, pair2.b)
          if (ab2 || ba2) {
            pushAlert(
              medInfo[ni].name + ' + ' + contMed,
              pair2.level,
              pair2.reason + ' (medicamento em uso contínuo: "' + contMed + '").',
              pair2.alt,
              'deterministico',
            )
          }
        }
      }
    }

    // (f) Alertas 'ok' para medicamentos sem conflito detectado
    var medsWithAlerts = {}
    for (var wA = 0; wA < alerts.length; wA++) {
      var aName = norm(alerts[wA].medication)
      for (var wB = 0; wB < medInfo.length; wB++) {
        var bName = norm(medInfo[wB].name)
        if (aName.indexOf(bName) !== -1 || bName.indexOf(aName) !== -1) {
          medsWithAlerts[bName] = true
        }
      }
    }
    for (var wC = 0; wC < medInfo.length; wC++) {
      var cName = norm(medInfo[wC].name)
      if (!medsWithAlerts[cName]) {
        pushAlert(
          medInfo[wC].name,
          'ok',
          'Sem conflitos detectados com alergias, condições crônicas (CID-10) ou medicamentos em uso.',
          '',
          'deterministico',
        )
      }
    }

    // ---------------------------------------------------------------
    // 5. ENRIQUECIMENTO COM IA (camada 2 — opcional)
    //    Só roda se $ai estiver disponível; se falhar, o resultado
    //    determinístico é mantido.
    // ---------------------------------------------------------------
    var aiAlerts = []
    try {
      var systemPrompt =
        'Você é um farmacêutico clínico especialista em farmacovigilância. ' +
        'Analise as medicações prescritas contra o CONTEXTO CLÍNICO COMPLETO do paciente ' +
        '(idade, sexo, alergias, condições crônicas CID-10, medicamentos de uso contínuo, função renal) ' +
        'e entre os próprios fármacos prescritos. Use os dados oficiais do catálogo (indicações, contraindicações, interações). ' +
        'Retorne APENAS um array JSON válido, sem markdown, no formato exato: ' +
        '[{"medication":"nome","risk_level":"contraindicacao|precaucao|atencao|ok","reason":"justificativa clínica legível","suggestion":"alternativa terapêutica ou conduta","source":"ia"}]'

      var userContent =
        'CONTEXTO CLÍNICO DO PACIENTE:\n' +
        JSON.stringify(ctx) +
        '\n\nDIAGNÓSTICOS DA CONSULTA:\n' +
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
          '\n\nCATÁLOGO DISPONÍVEL NA BASE (referência para alternativas):\n' +
          catalogSummary.slice(0, 20).join('\n')
      }

      var response = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      })

      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        var text = response.choices[0].message.content || ''
        var jsonStart = text.indexOf('[')
        var jsonEnd = text.lastIndexOf(']')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            var parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1))
            if (Array.isArray(parsed)) aiAlerts = parsed
          } catch (_) {}
        }
      }
    } catch (err) {
      // IA indisponível: a análise determinística basta
      console.log('analyze-medications: AI unavailable, using deterministic layer only')
    }

    // ---------------------------------------------------------------
    // 6. MESCLAR: o pior nível entre determinístico e IA vence.
    // ---------------------------------------------------------------
    var SEVERITY_ORDER = { contraindicacao: 3, precaucao: 2, atencao: 1, ok: 0 }
    function levelOf(a) {
      if (!a) return 0
      if (a.risk_level && SEVERITY_ORDER[a.risk_level] !== undefined)
        return SEVERITY_ORDER[a.risk_level]
      if (a.gravity === 'precaucao') return 2
      if (a.gravity === 'alto') return 3
      if (a.severity === 'high') return 3
      if (a.severity === 'medium') return 2
      return 0
    }
    function normMed(s) {
      return norm(s).split(/[/+]/)[0].trim()
    }

    for (var aiI = 0; aiI < aiAlerts.length; aiI++) {
      var aiA = aiAlerts[aiI]
      if (!aiA || !aiA.medication) continue
      var key2 = normMed(aiA.medication)
      var best = null
      for (var dI = 0; dI < alerts.length; dI++) {
        var dn = normMed(alerts[dI].medication)
        if (dn === key2 || dn.indexOf(key2) !== -1 || key2.indexOf(dn) !== -1) {
          if (!best || levelOf(aiA) > levelOf(alerts[dI])) best = alerts[dI]
        }
      }
      if (best) {
        if (levelOf(aiA) > levelOf(best)) {
          best.risk_level = aiA.risk_level || best.risk_level
          best.message = aiA.reason || aiA.message || best.message
          best.suggestion = aiA.suggestion || best.suggestion
          best.reason = best.message
          best.source = 'ia+deterministico'
        }
      } else {
        alerts.push({
          medication: aiA.medication,
          risk_level: aiA.risk_level || 'atencao',
          message: aiA.reason || aiA.message || '',
          suggestion: aiA.suggestion || '',
          reason: aiA.reason || aiA.message || '',
          source: 'ia',
        })
      }
    }

    // ---------------------------------------------------------------
    // 7. RESUMO: nível máximo e necessidade de justificativa
    // ---------------------------------------------------------------
    var maxLevel = 'ok'
    var maxRank = 0
    for (var fi = 0; fi < alerts.length; fi++) {
      var lr = levelOf(alerts[fi])
      if (lr > maxRank) {
        maxRank = lr
        maxLevel = alerts[fi].risk_level || 'ok'
      }
    }
    var requiresJustification = maxRank >= 2 // contraindicacao | precaucao

    return e.json(200, {
      alerts: alerts,
      summary: {
        max_risk_level: maxLevel,
        requires_justification: requiresJustification,
        patient_context_used: {
          allergies: ctx.allergies.length,
          chronic_conditions: ctx.chronic_conditions.length,
          continuous_medications: ctx.continuous_medications.length,
          has_renal_function: ctx.renal_function.creatinine_mg_dl !== null,
        },
      },
    })
  },
  $apis.requireAuth(),
)
