import { useState, useEffect } from 'react'
import { FolderOpen, FileText, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyDocuments } from '@/services/patient-portal'
import { DocumentItem, DocumentFolder } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

export default function PatientDocuments() {
  const { user } = useAuth()
  const patientId = user?.patient_link
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [folder, setFolder] = useState<string>('todos')

  const loadData = async () => {
    if (!patientId) return
    try {
      const list = await getMyDocuments(patientId)
      setDocuments(list)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  if (!patientId) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Contate a recepção para vincular seu prontuário.
      </div>
    )
  }

  const filtered = folder === 'todos' ? documents : documents.filter((d) => d.folder === folder)
  const folders = ['todos', 'exames', 'medicamentos', 'procedimentos', 'agendamentos', 'outros']

  const getFileUrl = (doc: DocumentItem) => {
    if (!doc.file) return '#'
    return pb.files.getURL(doc as any, doc.file)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-600" /> Meus Documentos
        </h1>
        <p className="text-xs text-slate-500">Documentos liberados pelo seu médico.</p>
      </div>

      <div className="flex gap-2 text-xs overflow-x-auto pb-1">
        {folders.map((f) => (
          <Button
            key={f}
            variant={folder === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFolder(f)}
            className="capitalize text-xs h-8"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center text-xs text-slate-400 border rounded-lg">
            Nenhum documento nesta pasta.
          </div>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="bg-white border rounded-lg p-3 space-y-2 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">{doc.name}</span>
                </div>
                {doc.ai_classified && (
                  <Badge variant="secondary" className="text-[9px]">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    IA
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-slate-400 capitalize">Pasta: {doc.folder}</p>
              {doc.file && (
                <a href={getFileUrl(doc)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                    Visualizar
                  </Button>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
