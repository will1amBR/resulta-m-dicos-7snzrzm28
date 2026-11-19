import pb from '@/lib/pocketbase/client'
import {
  MedicationAlert,
  MedicationRiskLevel,
  maxRiskLevel,
  normalizeMedicationAlert,
  riskRequiresJustification,
} from '@/types/clinical'

export interface AnalyzeMedicationsInput {
  patient: string
  cid10_codes: Array<{ code: string; description?: string } | string>
  prescribed_medications: Array<{ medication: string; dosage: string; instructions?: string }>
}

export interface MedicationAnalysisResult {
  alerts: MedicationAlert[]
  max_risk_level: MedicationRiskLevel
  requires_justification: boolean
}

/**
 * Chama o hook backend /backend/v1/analyze-medications, que monta o contexto
 * clínico completo do paciente (alergias, condições crônicas, medicamentos em
 * uso contínuo, função renal) e roda a análise determinística + enriquecimento
 * com IA. Sempre devolve uma lista de alertas normalizada (nunca lança para
 * falhas de análise — o chamador decide o que fazer com a lista vazia).
 */
export const analyzeMedications = async (
  data: AnalyzeMedicationsInput,
): Promise<MedicationAnalysisResult> => {
  try {
    const res = (await pb.send('/backend/v1/analyze-medications', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })) as {
      alerts?: MedicationAlert[]
      summary?: { max_risk_level?: string; requires_justification?: boolean }
    }

    const alerts = (res.alerts || []).map(normalizeMedicationAlert)
    return {
      alerts,
      max_risk_level: (res.summary?.max_risk_level as MedicationRiskLevel) || maxRiskLevel(alerts),
      requires_justification:
        res.summary?.requires_justification === true || riskRequiresJustification(alerts),
    }
  } catch {
    return { alerts: [], max_risk_level: 'ok', requires_justification: false }
  }
}
