/// <reference path="../pb_data/types.d.ts" />
// Prova de dispensação: quando uma farmácia registra a consulta pública da
// receita, cria a prova e notifica o médico prescritor in-app (sino), com
// anti-spam (agregação de consultas repetidas em janela curta).

const ANTI_SPAM_WINDOW_MIN = 60 // minutos sem notificar de novo a mesma receita

onRecordAfterCreateSuccess((e) => {
  const prescriptionId = e.record.getString('prescription')
  const code = e.record.getString('verification_code') || prescriptionId
  const pharmacyName = e.record.getString('pharmacy_name') || ''

  if (!prescriptionId) return e.next()

  try {
    let rx = null
    try {
      rx = $app.findRecordById('prescriptions', prescriptionId)
    } catch (_) {
      return e.next()
    }

    const doctorId = rx.getString('doctor_id')
    if (!doctorId) return e.next()

    let patientName = 'o paciente'
    try {
      const pat = $app.findRecordById('patients', rx.getString('patient_id'))
      if (pat) patientName = pat.getString('name') || patientName
    } catch (_) {}

    // --- Anti-spam: já existe notificação recente (não lida) para esta receita?
    const windowStart = new Date(Date.now() - ANTI_SPAM_WINDOW_MIN * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
    let duplicateFound = false
    try {
      $app.findFirstRecordByFilter(
        'notifications',
        'user = {:uid} && type = "prescription" && read = false && created > {:since} && message ~ {:code}',
        { uid: doctorId, since: windowStart, code: code },
      )
      duplicateFound = true
    } catch (_) {
      duplicateFound = false
    }

    // Sempre registra a prova; notifica apenas na primeira consulta da janela.
    if (!duplicateFound) {
      const col = $app.findCollectionByNameOrId('notifications')
      const n = new Record(col)
      n.set('user', doctorId)
      n.set('title', 'Receita consultada por farmácia')
      n.set(
        'message',
        'A receita ' +
          code +
          ' do paciente ' +
          patientName +
          ' foi consultada' +
          (pharmacyName ? ' pela farmácia "' + pharmacyName + '"' : ' por uma farmácia') +
          ' — possível dispensação em andamento.',
      )
      n.set('type', 'prescription')
      n.set('read', false)
      n.set('link', '/receitas')
      $app.save(n)
    }

    // Agrega contagem na própria prova (para o badge "N consultas")
    try {
      let total = 0
      const rows = $app.findRecordsByFilter(
        'prescription_dispensations',
        'prescription = {:pid}',
        '-created',
        0,
        0,
        { pid: prescriptionId },
      )
      total = rows ? rows.length : 0
      if (e.record) {
        e.record.set('consult_count', total)
      }
    } catch (err) {
      console.log('dispensations: falha ao calcular contagem: ' + err.message)
    }
  } catch (err) {
    console.log('dispensations: erro ao notificar médico: ' + err.message)
  }

  return e.next()
}, 'prescription_dispensations')
