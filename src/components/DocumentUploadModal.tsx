import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { uploadDocument } from '@/services/documents'
import { DocumentFolder } from '@/types/clinical'

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  onSuccess: () => void
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  patientId,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [folder, setFolder] = useState<DocumentFolder>('outros')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !patientId) return
    setLoading(true)
    try {
      await uploadDocument(patientId, file, docName || file.name, folder)
      onSuccess()
      onOpenChange(false)
      setFile(null)
      setDocName('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar Documento do Paciente</DialogTitle>
          <DialogDescription>
            Envie arquivos PDF ou imagens. A IA classifica a pasta automaticamente caso selecione
            "Outros".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Arquivo</Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const selected = e.target.files?.[0]
                if (selected) {
                  setFile(selected)
                  if (!docName) setDocName(selected.name)
                }
              }}
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-xs">Nome do Documento</Label>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ex: Hemograma_Março.pdf"
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-xs">Pasta Destino</Label>
            <Select value={folder} onValueChange={(val) => setFolder(val as DocumentFolder)}>
              <SelectTrigger className="mt-1 text-xs h-9">
                <SelectValue placeholder="Selecione a pasta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exames">Exames</SelectItem>
                <SelectItem value="medicamentos">Medicamentos</SelectItem>
                <SelectItem value="procedimentos">Procedimentos</SelectItem>
                <SelectItem value="agendamentos">Agendamentos</SelectItem>
                <SelectItem value="outros">Outros (Classificação IA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !file}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Enviando e Classificando...' : 'Anexar Documento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
