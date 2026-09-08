import pb from '@/lib/pocketbase/client'
import { LabResult } from '@/types/clinical'

export async function getPatientLabResults(
  patientId: string,
  markerCode?: string,
): Promise<LabResult[]> {
  let filter = `patient = '${patientId}'`
  if (markerCode && markerCode !== 'todos') {
    filter += ` && marker_code = '${markerCode}'`
  }

  const records = await pb.collection('lab_results').getList<LabResult>(1, 200, {
    filter,
    sort: 'collected_at', // cronológico para gráficos de evolução
  })
  return records.items
}

export async function createLabResult(data: {
  patientId: string
  markerName: string
  markerCode: string
  value: number
  unit: string
  referenceRange?: string
  isAbnormal?: boolean
  collectedAt: string
  sourceDocumentName?: string
}): Promise<LabResult> {
  const created = await pb.collection('lab_results').create<LabResult>({
    patient: data.patientId,
    marker_name: data.markerName,
    marker_code: data.markerCode,
    value: data.value,
    unit: data.unit,
    reference_range: data.referenceRange || '',
    is_abnormal: !!data.isAbnormal,
    collected_at: data.collectedAt,
    source_document_name: data.sourceDocumentName || 'Lançamento Manual',
  })
  return created
}
