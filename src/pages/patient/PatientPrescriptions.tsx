import { useState, useEffect } from 'react'
import { Pill, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyPrescriptions, PatientPrescription } from '@/services/patient-portal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PatientPrescriptions() {
  const { user } = useAuth()
  const patientId = user?.patient_link
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([])

  useEffect(() => {
    if (!patientId) return
    getMyPrescriptions(patientId)
      .then(setPrescriptions)
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
          <Pill className="h-5 w-5 text-blue-600" /> Minhas Prescrições
        </h1>
        <p className="text-xs text-slate-500">Medicamentos prescritos pelo seu médico.</p>
      </div>

      <div className="space-y-2">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-400">
              Nenhuma prescrição encontrada.
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((med, i) => (
            <Card key={i} className="shadow-subtle">
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{med.medication}</p>
                    <p className="text-xs text-slate-600">{med.dosage}</p>
                    {med.instructions && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{med.instructions}</p>
                    )}
                    {med.recordDate && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(med.recordDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
