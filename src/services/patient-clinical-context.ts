import pb from '@/lib/pocketbase/client'
import { Patient } from '@/types/clinical'

/**
 * Contexto clínico do paciente para a análise cruzada de medicamentos.
 * Montado a partir do banco: alergias, condições crônicas (CID-10 ativos do
 * prontuário), idade/sexo, medicamentos em uso contínuo e função renal
 * (quando houver creatinina registrada em lab_results).
 */

export interface PatientClinicalContext {
  patient_id: string
  name: string
  age: number | null
  sex: 'masculino' | 'feminino' | 'não informado'
  allergies: string[]
  chronic_conditions: Array<{ code: string; description: string }>
  continuous_medications: string[]
  renal_function: {
    creatinine_mg_dl: number | null
    collected_at: string | null
  }
}

const AGE_ALLERGIES = ['Dipirona', 'Penicilina', 'Frutos do Mar']

const ALLERGY_STOPWORDS = ['nenhuma', 'neg', 'sem alergia', 'nega alergia', 'não']

function cleanAllergyValue(raw: string): string {
  const value = (raw || '').trim()
  if (!value) return ''
  const lower = value.toLowerCase()
  if (ALLERGY_STOPWORDS.some((w) => lower.startsWith(w))) return ''
  return value
}

function computeAge(birthDate?: string): number | null {
  if (!birthDate) return null
  const parsed = new Date(birthDate)
  if (isNaN(parsed.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - parsed.getFullYear()
  const monthDiff = now.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

/** Busca a creatinina mais recente do paciente (função renal). */
async function getLatestCreatinine(
  patientId: string,
): Promise<{ value: number; collected_at: string } | null> {
  try {
    const list = await pb.collection('lab_results').getList(1, 1, {
      filter: `patient = '${patientId}' && marker_code = 'creatinina'`,
      sort: '-collected_at',
    })
    const row = list.items[0]
    if (!row || typeof row.value !== 'number') return null
    return { value: row.value, collected_at: row.collected_at || null }
  } catch {
    return null
  }
}

/**
 * Condições crônicas declaradas no perfil do paciente (campo do cadastro,
 * texto separado por ';' — mesmo formato das alergias). Cada item pode vir
 * como "Nome" ou "CID Nome"/"Nome (CID)".
 */
function splitProfileText(raw?: string | null): string[] {
  return String(raw || '')
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function extractCidFromLabel(label: string): string | null {
  const m = label.match(/\b[A-Z]\d{2}(?:\.\d)?\b/)
  return m ? m[0] : null
}

async function getProfileChronicConditions(
  patientId: string,
): Promise<Array<{ code: string; description: string }>> {
  try {
    const rec = await pb.collection('patients').getOne(patientId)
    return splitProfileText((rec as any)?.chronic_conditions).map((label) => ({
      code: extractCidFromLabel(label) || '',
      description: label.replace(/\s*\([^)]*CID[^)]*\)\s*/gi, ' ').trim() || label,
    }))
  } catch {
    return []
  }
}

/** CID-10 ativos: junta o histórico de prontuários (registros mais recentes). */
async function getChronicConditions(
  patientId: string,
): Promise<Array<{ code: string; description: string }>> {
  try {
    const list = await pb.collection('medical_records').getList(1, 20, {
      filter: `patient = '${patientId}'`,
      sort: '-created',
    })
    const byCode = new Map<string, string>()
    for (const rec of list.items) {
      const cids = rec.cid10_codes || []
      for (const cid of cids) {
        if (!cid?.code) continue
        if (!byCode.has(cid.code)) byCode.set(cid.code, cid.description || cid.code)
      }
    }
    return Array.from(byCode.entries()).map(([code, description]) => ({ code, description }))
  } catch {
    return []
  }
}

/** Medicamentos em uso contínuo declarados no perfil do paciente. */
async function getProfileContinuousMedications(patientId: string): Promise<string[]> {
  try {
    const rec = await pb.collection('patients').getOne(patientId)
    return splitProfileText((rec as any)?.continuous_medications).map((label) =>
      // Formato gravado pelo perfil: "Nome — dosagem"; mantém só o nome p/ casar regras
      label.split(/\s+—\s+/)[0].trim(),
    )
  } catch {
    return []
  }
}

/** Medicamentos em uso contínuo: união das prescrições mais recentes do paciente. */
async function getContinuousMedications(patientId: string): Promise<string[]> {
  try {
    const list = await pb.collection('prescriptions').getList(1, 10, {
      filter: `patient_id = '${patientId}' && (status = 'emitida' || status = 'enviada' || status = 'aguardando_renovacao')`,
      sort: '-created',
    })
    const names: string[] = []
    for (const rx of list.items) {
      const meds = rx.medications || []
      for (const m of meds) {
        if (m?.medication && !names.includes(m.medication)) names.push(m.medication)
      }
    }
    return names
  } catch {
    return []
  }
}

/**
 * Alergias registradas: usa o campo allergies do registro do paciente quando
 * existir; caso contrário, usa a ficha de saúde (fonte demo atual, que guarda
 * os valores padrão no componente de perfil).
 */
async function getPatientAllergies(patientId: string): Promise<string[]> {
  try {
    const rec = await pb.collection('patients').getOne(patientId)
    const raw = (rec.allergies || '') as string
    if (raw) {
      return raw
        .split(/[,;\n]/)
        .map(cleanAllergyValue)
        .filter(Boolean)
    }
  } catch {
    /* campo pode não existir — segue para o fallback */
  }
  return AGE_ALLERGIES
}

/**
 * Monta o contexto clínico completo do paciente para análise cruzada.
 * Falha suave em cada fonte: se uma coleção não responder, o campo fica
 * vazio/nulo e a análise continua com o que estiver disponível.
 */
export async function buildPatientClinicalContext(
  patient: Patient | { id: string; name?: string } | null,
): Promise<PatientClinicalContext | null> {
  if (!patient?.id) return null

  let patientRecord: Patient | null = null
  try {
    patientRecord = await pb.collection('patients').getOne<Patient>(patient.id)
  } catch {
    patientRecord = null
  }

  const source: Patient | null = patientRecord || (patient as Patient)

  const [allergies, profileConditions, recordConditions, profileMeds, rxMeds, renal] =
    await Promise.all([
      getPatientAllergies(patient.id),
      getProfileChronicConditions(patient.id),
      getChronicConditions(patient.id),
      getProfileContinuousMedications(patient.id),
      getContinuousMedications(patient.id),
      getLatestCreatinine(patient.id),
    ])

  // Condições crônicas: união do perfil declarado + histórico (CID-10),
  // sem duplicar pelo código CID nem pela descrição.
  const seenCondition = new Set<string>()
  const conditions: Array<{ code: string; description: string }> = []
  for (const cond of [...profileConditions, ...recordConditions]) {
    const key = (cond.code || cond.description).toLowerCase()
    if (!key || seenCondition.has(key)) continue
    seenCondition.add(key)
    conditions.push(cond)
  }

  // Uso contínuo: união do perfil declarado + prescrições ativas (case-insensitive).
  const seenMeds = new Set<string>()
  const meds: string[] = []
  for (const med of [...profileMeds, ...rxMeds]) {
    const key = med.toLowerCase()
    if (!key || seenMeds.has(key)) continue
    seenMeds.add(key)
    meds.push(med)
  }

  return {
    patient_id: patient.id,
    name: source?.name || '',
    age: computeAge(source?.birth_date),
    sex:
      (source as any)?.gender === 'f'
        ? 'feminino'
        : (source as any)?.gender === 'm'
          ? 'masculino'
          : 'não informado',
    allergies,
    chronic_conditions: conditions,
    continuous_medications: meds,
    renal_function: {
      creatinine_mg_dl: renal?.value ?? null,
      collected_at: renal?.collected_at ?? null,
    },
  }
}
