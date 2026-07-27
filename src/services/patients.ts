import pb from '@/lib/pocketbase/client'
import { Patient } from '@/types/clinical'

export const getPatients = (search?: string) => {
  const filter = search ? `name ~ "${search}" || cpf ~ "${search}"` : ''
  return pb.collection('patients').getFullList<Patient>({
    filter,
    sort: '-created',
  })
}

export const getPatient = (id: string) => pb.collection('patients').getOne<Patient>(id)

export const createPatient = (data: Partial<Patient>) =>
  pb.collection('patients').create<Patient>(data)

export const updatePatient = (id: string, data: Partial<Patient>) =>
  pb.collection('patients').update<Patient>(id, data)

export const deletePatient = (id: string) => pb.collection('patients').delete(id)
