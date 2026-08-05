import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyMedicalRecords } from '@/services/patient-portal'
import { MedicalRecord } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function PatientRecords() {
  const { user } = useAuth()
  const patientId = user?.patient_link
  const [records, setRecords] = useState<MedicalRecord[]>([])

  useEffect(() => {
    if (!patientId) return
    getMyMedicalRecords(patientId)
      .then(setRecords)
      .catch(() => {})
  }, [patientId])

  if (!patientId) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Contate a recepção para vincular seu prontuário.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" /> Meu Prontuário
        </h1>
        <p className="text-xs text-slate-500">Registros compartilhados pelo seu médico.</p>
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-400">
              Nenhum registro encontrado.
            </CardContent>
          </Card>
        ) : (
          records.map((r) => (
            <Card key={r.id} className="shadow-subtle">
              <CardContent className="p-4 space-y-2 text-xs">
                <span className="text-[10px] text-blue-700 font-bold block border-b pb-1">
                  {r.created ? new Date(r.created).toLocaleString('pt-BR') : 'Data'}
                </span>
                {r.soap_subjective && (
                  <p>
                    <strong>S:</strong> {r.soap_subjective}
                  </p>
                )}
                {r.soap_objective && (
                  <p>
                    <strong>O:</strong> {r.soap_objective}
                  </p>
                )}
                {r.soap_assessment && (
                  <p>
                    <strong>A:</strong> {r.soap_assessment}
                  </p>
                )}
                {r.soap_plan && (
                  <p>
                    <strong>P:</strong> {r.soap_plan}
                  </p>
                )}
                {r.cid10_codes && r.cid10_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <strong className="text-blue-700 text-[11px]">CID-10:</strong>
                    {r.cid10_codes.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {c.code}
                      </Badge>
                    ))}
                  </div>
                )}
                {r.prescribed_medications && r.prescribed_medications.length > 0 && (
                  <div className="pt-1">
                    <strong className="text-blue-700 text-[11px]">Medicações:</strong>
                    <ul className="list-disc list-inside text-[11px] text-slate-600">
                      {r.prescribed_medications.map((m, i) => (
                        <li key={i}>
                          {m.medication} — {m.dosage}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.procedures && r.procedures.length > 0 && (
                  <div className="pt-1">
                    <strong className="text-blue-700 text-[11px]">Procedimentos:</strong>{' '}
                    {r.procedures.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
