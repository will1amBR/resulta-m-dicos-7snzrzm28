import pb from '@/lib/pocketbase/client'
import { SpecialtyTemplate } from '@/types/clinical'

export async function getSpecialtyTemplates(specialty?: string): Promise<SpecialtyTemplate[]> {
  let filter = ''
  if (specialty && specialty !== 'todas') {
    filter = `specialty ~ '${specialty}'`
  }

  const records = await pb.collection('specialty_templates').getList<SpecialtyTemplate>(1, 50, {
    filter,
    sort: 'name',
  })
  return records.items
}

export async function getTemplateById(id: string): Promise<SpecialtyTemplate | null> {
  try {
    return await pb.collection('specialty_templates').getOne<SpecialtyTemplate>(id)
  } catch {
    return null
  }
}
