import { useState, useEffect } from 'react'
import { FileText, Printer, Save } from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getMedicalRecordsForPatient, createMedicalRecord } from '@/services/medical_records'
import { MedicalRecord } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Prontuario() {
  const { activePatient } = useActivePatient()
  const { user } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState<MedicalRecord[]>([])

  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activePatient) {
      getMedicalRecordsForPatient(activePatient.id)
        .then(setRecords)
        .catch(() => {})
    }
  }, [activePatient])

  const handleSave = async () => {
    if (!activePatient || !user) return
    setLoading(true)
    try {
      await createMedicalRecord({
        patient: activePatient.id,
        doctor: user.id,
        soap_subjective: subjective,
        soap_objective: objective,
        soap_assessment: assessment,
        soap_plan: plan,
      })
      toast({ title: 'Nova evolução registrada!' })
      setSubjective('')
      setObjective('')
      setAssessment('')
      setPlan('')
      getMedicalRecordsForPatient(activePatient.id).then(setRecords)
    } catch {
      toast({ title: 'Erro ao salvar evolução', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!activePatient) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white border rounded-lg shadow-subtle">
        <FileText className="h-12 w-12 text-slate-300 mb-3" />
        <h2 className="font-bold text-slate-800 text-base">Selecione um Paciente</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Busque um paciente no topo ou selecione-o na agenda do Dashboard para acessar o prontuário
          completo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-subtle">
        <div>
          <h1 className="font-bold text-lg text-slate-900">Prontuário Completo</h1>
          <p className="text-xs text-slate-500">
            Paciente: <strong>{activePatient.name}</strong> (CPF: {activePatient.cpf})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="h-4 w-4 mr-1" /> Imprimir Prontuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 space-y-3 shadow-subtle">
          <h2 className="font-bold text-xs text-slate-800 border-b pb-2">Nova Evolução SOAP</h2>
          <div className="space-y-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Subjetivo (S)</label>
              <Textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                className="h-20 text-xs mt-1"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Objetivo (O)</label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="h-20 text-xs mt-1"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Avaliação (A)</label>
              <Textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="h-20 text-xs mt-1"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Plano (P)</label>
              <Textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="h-20 text-xs mt-1"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-1" /> {loading ? 'Salvando...' : 'Salvar Evolução'}
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-3 shadow-subtle max-h-[600px] overflow-y-auto">
          <h2 className="font-bold text-xs text-slate-800 border-b pb-2">
            Histórico Cronológico ({records.length})
          </h2>
          {records.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum registro anterior encontrado.</p>
          ) : (
            records.map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border rounded-md space-y-1.5 text-xs">
                <span className="text-[10px] text-blue-700 font-bold block border-b pb-1">
                  Atendimento em{' '}
                  {r.created ? new Date(r.created).toLocaleString('pt-BR') : 'Data não informada'}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
