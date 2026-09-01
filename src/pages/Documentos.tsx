import { useState, useEffect } from 'react'
import {
  FolderOpen,
  Upload,
  Sparkles,
  FileText,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  FileUp,
  Clock,
  Calendar,
  User,
} from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getDocumentsForPatient, deleteDocument, updateDocumentFolder } from '@/services/documents'
import { getPatients } from '@/services/patients'
import { DocumentItem, DocumentFolder, Patient } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { DocumentUploadModal } from '@/components/DocumentUploadModal'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Documentos() {
  const { activePatient, setActivePatient } = useActivePatient()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Patient selector fallback
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null)

  useEffect(() => {
    getPatients()
      .then((list) => {
        setAllPatients(list)
        if (!activePatient && list.length > 0) {
          setActivePatient(list[0])
        }
      })
      .catch(() => {})
  }, [])

  const loadDocs = async () => {
    if (!activePatient) return
    setLoadingDocs(true)
    try {
      const list = await getDocumentsForPatient(activePatient.id, selectedFolder)
      setDocuments(list)
    } catch {
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [activePatient, selectedFolder])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o documento "${name}"?`)) {
      await deleteDocument(id)
      toast({ title: 'Documento excluído com sucesso' })
      loadDocs()
    }
  }

  const handleFolderChange = async (id: string, folder: DocumentFolder) => {
    await updateDocumentFolder(id, folder)
    toast({ title: 'Pasta atualizada com sucesso' })
    loadDocs()
  }

  const getFileUrl = (doc: DocumentItem) => {
    if (!doc.file) return null
    return pb.files.getURL(doc as any, doc.file)
  }

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  })

  if (!activePatient) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-subtle space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Selecione um Paciente</h2>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Escolha um paciente para visualizar, organizar em pastas e enviar exames, receitas e
              atestados com classificação automática por IA.
            </p>
          </div>
          {allPatients.length > 0 && (
            <div className="w-full max-w-xs pt-2">
              <Select
                onValueChange={(pId) => {
                  const found = allPatients.find((p) => p.id === pId)
                  if (found) setActivePatient(found)
                }}
              >
                <SelectTrigger className="text-xs h-10">
                  <SelectValue placeholder="Selecionar paciente da lista..." />
                </SelectTrigger>
                <SelectContent>
                  {allPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.cpf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-lg text-slate-900 truncate">
              Gestão de Documentos do Paciente
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Paciente ativo:{' '}
              <strong className="text-slate-800 font-semibold">{activePatient.name}</strong>
              {activePatient.cpf && ` (CPF: ${activePatient.cpf})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Seletor rápido de paciente */}
          {allPatients.length > 1 && (
            <Select
              value={activePatient.id}
              onValueChange={(pId) => {
                const found = allPatients.find((p) => p.id === pId)
                if (found) setActivePatient(found)
              }}
            >
              <SelectTrigger className="h-9 text-xs w-44 hidden md:flex truncate">
                <SelectValue placeholder="Trocar paciente" />
              </SelectTrigger>
              <SelectContent>
                {allPatients.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => setUploadOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-3.5 shadow-sm shrink-0"
          >
            <Upload className="h-4 w-4 mr-1.5 shrink-0" /> Anexar Documento
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Folders scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'exames', label: 'Exames' },
            { id: 'medicamentos', label: 'Medicamentos' },
            { id: 'procedimentos', label: 'Procedimentos' },
            { id: 'agendamentos', label: 'Agendamentos' },
            { id: 'outros', label: 'Outros' },
          ].map((f) => (
            <Button
              key={f.id}
              variant={selectedFolder === f.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder(f.id)}
              className="capitalize text-xs h-8 px-3 whitespace-nowrap shrink-0"
            >
              {f.label}
              {f.id === 'todos' && documents.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-75">({documents.length})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="w-full">
        {loadingDocs ? (
          <div className="flex items-center justify-center py-16 bg-white border border-slate-200 rounded-xl">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-2xl space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Nenhum documento nesta pasta</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Anexe exames laboratoriais, relatórios médicos ou prescrições para este paciente.
            </p>
            <Button
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="bg-blue-600 text-white text-xs mt-2"
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Anexar Primeiro Documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const fileUrl = getFileUrl(doc)
              const dtFormatted = doc.created
                ? new Date(doc.created).toLocaleDateString('pt-BR')
                : 'Hoje'

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group min-w-0 max-w-full"
                >
                  {/* Top content */}
                  <div className="space-y-3 min-w-0 w-full overflow-hidden">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold capitalize bg-slate-100 text-slate-700 truncate shrink min-w-0 max-w-[130px]"
                      >
                        {doc.folder}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.ocr_status === 'concluido' && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-emerald-600" /> OCR
                          </Badge>
                        )}
                        {doc.ai_classified && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-amber-600" /> IA
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 min-w-0 pt-1">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3
                          className="font-bold text-xs text-slate-900 truncate leading-snug break-all"
                          title={doc.name}
                        >
                          {doc.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <Calendar className="h-3 w-3 shrink-0" /> {dtFormatted}
                        </p>
                        {doc.ocr_summary && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2 line-clamp-2 break-words">
                            <strong>Resumo OCR:</strong> {doc.ocr_summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-2 min-w-0 w-full">
                    <div className="flex-1 min-w-0 max-w-[130px]">
                      <Select
                        value={doc.folder}
                        onValueChange={(val) => handleFolderChange(doc.id, val as DocumentFolder)}
                      >
                        <SelectTrigger className="h-7 text-[10px] w-full bg-slate-50 border-slate-200 truncate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exames" className="text-xs">
                            Exames
                          </SelectItem>
                          <SelectItem value="medicamentos" className="text-xs">
                            Medicamentos
                          </SelectItem>
                          <SelectItem value="procedimentos" className="text-xs">
                            Procedimentos
                          </SelectItem>
                          <SelectItem value="agendamentos" className="text-xs">
                            Agendamentos
                          </SelectItem>
                          <SelectItem value="outros" className="text-xs">
                            Outros
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedDocPreview(doc)}
                        className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        title="Visualizar documento"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (fileUrl) {
                            window.open(fileUrl, '_blank')
                          } else {
                            toast({
                              title: 'Download iniciado',
                              description: `Baixando documento ${doc.name}...`,
                            })
                          }
                        }}
                        className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        title="Baixar arquivo"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir documento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      <DocumentUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        patientId={activePatient.id}
        onSuccess={loadDocs}
      />

      {/* Modal de Pré-Visualização */}
      {selectedDocPreview && (
        <Dialog open={!!selectedDocPreview} onOpenChange={() => setSelectedDocPreview(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 truncate">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="truncate">{selectedDocPreview.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Paciente: <strong>{activePatient.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pasta Destino:</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedDocPreview.folder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data de Envio:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDocPreview.created
                      ? new Date(selectedDocPreview.created).toLocaleString('pt-BR')
                      : 'Recente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classificação por IA:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDocPreview.ai_classified ? 'Sim (Inteligente)' : 'Manual'}
                  </span>
                </div>
                {selectedDocPreview.ocr_summary && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Resumo Clínico OCR:</span>
                    <p className="font-medium text-slate-900 bg-white p-2 rounded border text-[11px]">
                      {selectedDocPreview.ocr_summary}
                    </p>
                  </div>
                )}
                {selectedDocPreview.ocr_text && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">
                      Texto Extraído (OCR Completo):
                    </span>
                    <div className="font-mono text-[10px] text-slate-800 bg-white p-2.5 rounded border max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {selectedDocPreview.ocr_text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocPreview(null)}
                className="text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const url = getFileUrl(selectedDocPreview)
                  if (url) {
                    window.open(url, '_blank')
                  } else {
                    toast({
                      title: 'Download',
                      description: `Baixando documento ${selectedDocPreview.name}...`,
                    })
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Abrir / Baixar Arquivo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
