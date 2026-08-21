import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, FileText, ArrowLeft, Upload } from 'lucide-react'
import { getPatient } from '@/services/patients'
import { getMedicalRecordsForPatient } from '@/services/medical_records'
import { getDocumentsForPatient } from '@/services/documents'
import { Patient, MedicalRecord, DocumentItem } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DocumentUploadModal } from '@/components/DocumentUploadModal'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)

  const loadAll = async () => {
    if (!id) return
    try {
      const p = await getPatient(id)
      setPatient(p)
      const recs = await getMedicalRecordsForPatient(id)
      setRecords(recs)
      const docs = await getDocumentsForPatient(id)
      setDocuments(docs)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  if (!patient) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">Carregando ficha do paciente...</div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/pacientes')} className="text-xs">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Pacientes
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{patient.name}</CardTitle>
              <p className="text-xs text-slate-500">
                CPF: {patient.cpf} | Tel: {patient.phone || 'N/A'}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-600">{patient.insurance || 'Particular'}</Badge>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" /> Histórico de Prontuários (
              {records.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-slate-400">Nenhum prontuário registrado ainda.</p>
            ) : (
              records.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 border rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {r.created ? new Date(r.created).toLocaleDateString('pt-BR') : 'Data recente'}
                  </span>
                  {r.soap_subjective && (
                    <p>
                      <strong>Subjetivo:</strong> {r.soap_subjective}
                    </p>
                  )}
                  {r.soap_assessment && (
                    <p>
                      <strong>Avaliação:</strong> {r.soap_assessment}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold">
              Documentos Anexados ({documents.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadOpen(true)}
              className="h-7 text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Anexar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs max-h-96 overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-slate-400">Nenhum documento cadastrado.</p>
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 border rounded-md flex justify-between items-center bg-slate-50 gap-2 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate" title={d.name}>
                      {d.name}
                    </p>
                    <span className="text-[10px] capitalize text-slate-500">Pasta: {d.folder}</span>
                  </div>
                  {d.ai_classified && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] shrink-0 bg-amber-50 text-amber-800 border-amber-200"
                    >
                      IA
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {id && (
        <DocumentUploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          patientId={id}
          onSuccess={loadAll}
        />
      )}
    </div>
  )
}
