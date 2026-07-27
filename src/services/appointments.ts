import pb from '@/lib/pocketbase/client'
import { Appointment } from '@/types/clinical'

export const getAppointments = (doctorId?: string, dateFilter?: string) => {
  const filters: string[] = []
  if (doctorId) filters.push(`doctor = "${doctorId}"`)
  if (dateFilter)
    filters.push(`date_time >= "${dateFilter} 00:00:00" && date_time <= "${dateFilter} 23:59:59"`)

  return pb.collection('appointments').getFullList<Appointment>({
    filter: filters.join(' && '),
    sort: 'date_time',
    expand: 'patient,doctor',
  })
}

export const createAppointment = (data: Partial<Appointment>) =>
  pb.collection('appointments').create<Appointment>(data, { expand: 'patient' })

export const updateAppointment = (id: string, data: Partial<Appointment>) =>
  pb.collection('appointments').update<Appointment>(id, data, { expand: 'patient' })

export const deleteAppointment = (id: string) => pb.collection('appointments').delete(id)
