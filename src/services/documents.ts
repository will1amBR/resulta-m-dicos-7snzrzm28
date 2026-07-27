import pb from '@/lib/pocketbase/client'
import { DocumentItem } from '@/types/clinical'

export const getDocumentsForPatient = (patientId: string, folder?: string) => {
  const filters = [`patient = "${patientId}"`]
  if (folder && folder !== 'todos') {
    filters.push(`folder = "${folder}"`)
  }
  return pb.collection('documents').getFullList<DocumentItem>({
    filter: filters.join(' && '),
    sort: '-created',
  })
}

export const uploadDocument = (
  patientId: string,
  file: File,
  name: string,
  folder: string = 'outros',
) => {
  const formData = new FormData()
  formData.append('patient', patientId)
  formData.append('folder', folder)
  formData.append('name', name)
  formData.append('file', file)
  formData.append('ai_classified', 'false')

  return pb.collection('documents').create<DocumentItem>(formData)
}

export const updateDocumentFolder = (id: string, folder: string) =>
  pb.collection('documents').update<DocumentItem>(id, { folder, ai_classified: true })

export const deleteDocument = (id: string) => pb.collection('documents').delete(id)
