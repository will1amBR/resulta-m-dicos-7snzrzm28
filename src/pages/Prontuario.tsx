import { useState, useEffect, useCallback } from 'react'
import { FileText, Printer, Save, Pill, ClipboardList, Activity } from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getMedicalRecordsForPatient, createMedicalRecord } from '@/services/medical_records'
import { analyzeMedications } from '@/services/medications'
import { MedicalRecord, MedicationAlert, PrescribedMedication, CidCode } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MedicationAutocomplete } from '@/components/MedicationAutocomplete'
import { CidAutocomplete } from '@/components/CidAutocomplete'
import { MedicationAlerts } from '@/components/MedicationAlerts'
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
  const [prescribedMeds, setPrescribedMeds] = useState<PrescribedMedication[]>([])
  const [cid10Codes, setCid10Codes] = useState<CidCode[]>([])
  const [procedures, setProcedures] = useState<string[]>([])
  const [procedureInput, setProcedureInput] = useState('')
  const [alerts, setAlerts] = useState<MedicationAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  const loadRecords = useCallback(() => {
    if (activePatient) {
      getMedicalRecordsForPatient(activePatient.id)
        .then(setRecords)
        .catch(() => {})
    }
  }, [activePatient])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const runAnalysis = async (meds: PrescribedMedication[], cids: CidCode[]) => {
    if (!activePatient || meds.length === 0 || cids.length === 0) {
      setAlerts([])
      return
    }
    setAlertsLoading(true)
    try {
      const result = await analyzeMedications({
        patient: activePatient.id,
        cid10_codes: cids,
        prescribed_medications: meds,
      })
      setAlerts(result.alerts || [])
    } catch {
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }

  const handleAddMed = (med: PrescribedMedication) => {
    const updated = [...prescribedMeds, med]
    setPrescribedMeds(updated)
    runAnalysis(updated, cid10Codes)
  }

  const handleAddCid = (code: CidCode) => {
    const exists = cid10Codes.some((c) => c.code === code.code)
    if (exists) return
    const updated = [...cid10Codes, code]
    setCid10Codes(updated)
    runAnalysis(prescribedMeds, updated)
  }

  const handleRemoveMed = (idx: number) => {
    const updated = prescribedMeds.filter((_, i) => i !== idx)
    setPrescribedMeds(updated)
    runAnalysis(updated, cid10Codes)
  }

  const handleRemoveCid = (code: string) => {
    const updated = cid10Codes.filter((c) => c.code !== code)
    setCid10Codes(updated)
    runAnalysis(prescribedMeds, updated)
  }

  const handleAddProcedure = () => {
    if (!procedureInput.trim()) return
    setProcedures([...procedures, procedureInput.trim()])
    setProcedureInput('')
  }

  const handleSave = async () => {
    if (!activePatient || !user) return
    setLoading(true)
    setAlertsLoading(true)
    try {
      await createMedicalRecord({
        patient: activePatient.id,
        doctor: user.id,
        soap_subjective: subjective,
        soap_objective: objective,
        soap_assessment: assessment,
        soap_plan: plan,
        prescribed_medications: prescribedMeds,
        cid10_codes: cid10Codes,
        procedures,
      })
      toast({ title: 'Nova evolução registrada!' })

      if (prescribedMeds.length > 0 && cid10Codes.length > 0) {
        try {
          const result = await analyzeMedications({
            patient: activePatient.id,
            cid10_codes: cid10Codes,
            prescribed_medications: prescribedMeds,
          })
          setAlerts(result.alerts || [])
        } catch {
          /* intentionally ignored */
        }
      }
      setAlertsLoading(false)

      setSubjective('')
      setObjective('')
      setAssessment('')
      setPlan('')
      setPrescribedMeds([])
      setCid10Codes([])
      setProcedures([])
      loadRecords()
    } catch {
      toast({ title: 'Erro ao salvar evolução', variant: 'destructive' })
      setAlertsLoading(false)
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
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-subtle no-print">
        <div>
          <h1 className="font-bold text-lg text-slate-900">Prontuário Completo</h1>
          <p className="text-xs text-slate-500">
            Paciente: <strong>{activePatient.name}</strong> (CPF: {activePatient.cpf})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs no-print"
        >
          <Printer className="h-4 w-4 mr-1" /> 📄 Exportar Prontuário (PDF)
        </Button>
      </div>

      <div className="print-only hidden">
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold' }}>Prontuário Médico</h1>
        <p style={{ fontSize: '12pt' }}>
          Paciente: <strong>{activePatient.name}</strong> — CPF: {activePatient.cpf}
        </p>
        <p style={{ fontSize: '12pt' }}>
          Médico: <strong>{user?.name || ''}</strong> — CRM:{' '}
          {user?.crm || user?.council_number || ''}
        </p>
        <p style={{ fontSize: '12pt' }}>Data: {new Date().toLocaleString('pt-BR')}</p>
        <hr style={{ margin: '12pt 0' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 space-y-3 shadow-subtle no-print">
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

            <div className="border-t pt-2">
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Pill className="h-3.5 w-3.5 text-blue-600" /> Prescrição de Medicamentos
              </label>
              {prescribedMeds.length > 0 && (
                <div className="space-y-1 mb-2">
                  {prescribedMeds.map((med, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-blue-50 border rounded text-[11px]"
                    >
                      <div>
                        <span className="font-medium">{med.medication}</span>
                        <span className="text-slate-500 ml-2">— {med.dosage}</span>
                        {med.instructions && (
                          <span className="text-slate-400 ml-1">({med.instructions})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <MedicationAutocomplete onAdd={handleAddMed} />
            </div>

            <div className="border-t pt-2">
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <ClipboardList className="h-3.5 w-3.5 text-blue-600" /> Diagnósticos CID-10
              </label>
              {cid10Codes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {cid10Codes.map((c) => (
                    <Badge
                      key={c.code}
                      variant="secondary"
                      className="text-[10px] cursor-pointer"
                      onClick={() => handleRemoveCid(c.code)}
                    >
                      {c.code} — {c.description} ×
                    </Badge>
                  ))}
                </div>
              )}
              <CidAutocomplete onSelect={handleAddCid} />
            </div>

            <div className="border-t pt-2">
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Activity className="h-3.5 w-3.5 text-blue-600" /> Procedimentos
              </label>
              {procedures.length > 0 && (
                <div className="space-y-1 mb-2">
                  {procedures.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border rounded text-[11px]"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => setProcedures(procedures.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <Input
                  placeholder="Novo procedimento..."
                  value={procedureInput}
                  onChange={(e) => setProcedureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddProcedure()
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddProcedure}
                  className="h-8 text-xs"
                >
                  Add
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
            >
              <Save className="h-4 w-4 mr-1" /> {loading ? 'Salvando...' : 'Salvar Evolução'}
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-3 shadow-subtle max-h-[600px] overflow-y-auto no-print">
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
                {r.prescribed_medications && r.prescribed_medications.length > 0 && (
                  <div className="mt-1">
                    <strong className="text-blue-700">Medicações:</strong>
                    <ul className="list-disc list-inside text-[11px] text-slate-600">
                      {r.prescribed_medications.map((m, i) => (
                        <li key={i}>
                          {m.medication} — {m.dosage}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.cid10_codes && r.cid10_codes.length > 0 && (
                  <div className="mt-1">
                    <strong className="text-blue-700">CID-10:</strong>{' '}
                    {r.cid10_codes.map((c) => `${c.code} (${c.description})`).join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {(alerts.length > 0 || alertsLoading) && (
        <div className="bg-white border rounded-lg p-4 shadow-subtle no-print">
          <MedicationAlerts alerts={alerts} loading={alertsLoading} />
        </div>
      )}

      <div className="print-only hidden">
        {records.map((r) => (
          <div key={r.id} style={{ marginBottom: '20pt', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold' }}>
              Atendimento — {r.created ? new Date(r.created).toLocaleString('pt-BR') : ''}
            </h2>
            <table style={{ width: '100%', fontSize: '12pt', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', width: '120pt', verticalAlign: 'top' }}>
                    Subjetivo:
                  </td>
                  <td>{r.soap_subjective || '—'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Objetivo:</td>
                  <td>{r.soap_objective || '—'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Avaliação:</td>
                  <td>{r.soap_assessment || '—'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Plano:</td>
                  <td>{r.soap_plan || '—'}</td>
                </tr>
              </tbody>
            </table>
            {r.prescribed_medications && r.prescribed_medications.length > 0 && (
              <div style={{ marginTop: '12pt' }}>
                <h3 style={{ fontSize: '13pt', fontWeight: 'bold' }}>Medicamentos Prescritos</h3>
                <table
                  style={{
                    width: '100%',
                    fontSize: '12pt',
                    borderCollapse: 'collapse',
                    border: '1px solid #ccc',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ccc', padding: '4pt', textAlign: 'left' }}>
                        Medicamento
                      </th>
                      <th style={{ border: '1px solid #ccc', padding: '4pt', textAlign: 'left' }}>
                        Posologia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.prescribed_medications.map((m, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '4pt' }}>{m.medication}</td>
                        <td style={{ border: '1px solid #ccc', padding: '4pt' }}>{m.dosage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {r.cid10_codes && r.cid10_codes.length > 0 && (
              <p style={{ fontSize: '12pt', marginTop: '8pt' }}>
                <strong>CID-10:</strong>{' '}
                {r.cid10_codes.map((c) => `${c.code} — ${c.description}`).join('; ')}
              </p>
            )}
            {r.procedures && r.procedures.length > 0 && (
              <p style={{ fontSize: '12pt', marginTop: '8pt' }}>
                <strong>Procedimentos:</strong> {r.procedures.join('; ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
