import pb from '@/lib/pocketbase/client'
import { Specialty } from '@/types/clinical'

export const getSpecialties = () =>
  pb.collection('specialties').getFullList<Specialty>({ sort: 'name' })
