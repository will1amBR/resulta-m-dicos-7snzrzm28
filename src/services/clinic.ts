import pb from '@/lib/pocketbase/client'
import { Appointment, Patient, ClinicStats } from '@/types/clinical'

export const getClinicDoctors = () =>
  pb.collection('users').getFullList({
    filter: 'role = "doctor"',
    sort: '-created',
    expand: 'specialty',
  })

export const getClinicAppointments = (
  doctorId?: string,
  statusFilter?: string,
  dateFilter?: string,
) => {
  const filters: string[] = []
  if (doctorId) filters.push(`doctor = "${doctorId}"`)
  if (statusFilter && statusFilter !== 'todos') filters.push(`status = "${statusFilter}"`)
  if (dateFilter)
    filters.push(`date_time >= "${dateFilter} 00:00:00" && date_time <= "${dateFilter} 23:59:59"`)
  return pb.collection('appointments').getFullList<Appointment>({
    filter: filters.join(' && '),
    sort: 'date_time',
    expand: 'patient,doctor',
  })
}

export const getClinicPatients = (search?: string) => {
  const filter = search ? `name ~ "${search}" || cpf ~ "${search}"` : ''
  return pb.collection('patients').getFullList<Patient>({ filter, sort: '-created' })
}

export const getClinicStats = async (): Promise<ClinicStats> => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [doctors, todayAppts, scheduledAppts, patients] = await Promise.all([
    pb.collection('users').getFullList({ filter: 'role = "doctor"' }),
    pb
      .collection('appointments')
      .getFullList({
        filter: `date_time >= "${todayStr} 00:00:00" && date_time <= "${todayStr} 23:59:59"`,
      }),
    pb.collection('appointments').getFullList({ filter: 'status = "agendada"' }),
    pb.collection('patients').getFullList({}),
  ])
  return {
    doctorCount: doctors.length,
    todayAppointmentCount: todayAppts.length,
    scheduledCount: scheduledAppts.length,
    patientCount: patients.length,
  }
}

export const updateClinicProfile = (userId: string, data: Record<string, any>) =>
  pb.collection('users').update(userId, data)
