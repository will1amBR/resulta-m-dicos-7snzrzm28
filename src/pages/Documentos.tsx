import { useState, useEffect } from 'react'
import { FolderOpen, Upload, Sparkles, FileText, Trash2 } from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getDocumentsForPatient, deleteDocument, updateDocumentFolder } from '@/services/documents'
import { DocumentItem, DocumentFolder } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DocumentUploadModal } from '@/components/DocumentUploadModal'

export default function Documentos() {
  const { activePatient } = useActivePatient()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('todos')
  const [uploadOpen, setUploadOpen] = useState(false)

  const loadDocs = async () => {
    if (!activePatient) return
    try {
      const list = await getDocumentsForPatient(activePatient.id, selectedFolder)
      setDocuments(list)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadDocs()
  }, [activePatient, selectedFolder])

  const handleDelete = async (id: string) => {
    await deleteDocument(id)
    loadDocs()
  }

  const handleFolderChange = async (id: string, folder: DocumentFolder) => {
    await updateDocumentFolder(id, folder)
    loadDocs()
  }

  if (!activePatient) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white border rounded-lg shadow-subtle">
        <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
        <h2 className="font-bold text-slate-800 text-base">Selecione um Paciente</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Selecione um paciente para visualizar e organizar seus exames, medicamentos e atestados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-subtle">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Gestão de Documentos e IA
          </h1>
          <p className="text-xs text-slate-500">
            Documentos de <strong>{activePatient.name}</strong> organizados automaticamente.
          </p>
        </div>

        <Button
          onClick={() => setUploadOpen(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-1" /> Anexar Novo Documento
        </Button>
      </div>

      <div className="flex gap-2 text-xs overflow-x-auto pb-1">
        {['todos', 'exames', 'medicamentos', 'procedimentos', 'agendamentos', 'outros'].map((f) => (
          <Button
            key={f}
            variant={selectedFolder === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFolder(f)}
            className="capitalize text-xs h-8"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center text-xs text-slate-400 border rounded-lg">
            Nenhum documento encontrado nesta pasta.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border rounded-lg p-3 space-y-2 shadow-subtle flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                    <FileText className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{doc.name}</span>
                  </div>
                  {doc.ai_classified && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] bg-amber-50 text-amber-800 border-amber-200"
                    >
                      <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-500" /> IA
                    </Badge>
                  )}
                </div>

                <p className="text-[10px] text-slate-400">
                  Data: {doc.created ? new Date(doc.created).toLocaleDateString('pt-BR') : 'Hoje'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Select
                  value={doc.folder}
                  onValueChange={(val) => handleFolderChange(doc.id, val as DocumentFolder)}
                >
                  <SelectTrigger className="h-7 text-[10px] w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exames">Exames</SelectItem>
                    <SelectItem value="medicamentos">Medicamentos</SelectItem>
                    <SelectItem value="procedimentos">Procedimentos</SelectItem>
                    <SelectItem value="agendamentos">Agendamentos</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(doc.id)}
                  className="h-7 w-7 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        patientId={activePatient.id}
        onSuccess={loadDocs}
      />
    </div>
  )
}
