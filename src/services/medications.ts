import pb from '@/lib/pocketbase/client'
import { Medication } from '@/types/clinical'

export const searchMedications = (query: string) => {
  const filter = query ? `name ~ "${query}" || active_ingredient ~ "${query}"` : ''
  return pb.collection('medications').getList<Medication>(1, 20, {
    filter,
    sort: 'name',
  })
}
