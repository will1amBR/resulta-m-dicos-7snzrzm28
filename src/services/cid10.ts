import pb from '@/lib/pocketbase/client'
import { Cid10Code } from '@/types/clinical'

export const searchCid10 = (query: string) => {
  const filter = query ? `code ~ "${query}" || description ~ "${query}"` : ''
  return pb.collection('cid10_codes').getList<Cid10Code>(1, 20, {
    filter,
    sort: 'code',
  })
}
