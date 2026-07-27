import { createContext, useContext, useState, ReactNode } from 'react'
import { Patient } from '@/types/clinical'

interface ActivePatientContextType {
  activePatient: Patient | null
  setActivePatient: (patient: Patient | null) => void
  activeAppointmentId: string | null
  setActiveAppointmentId: (id: string | null) => void
}

const ActivePatientContext = createContext<ActivePatientContextType | undefined>(undefined)

export const ActivePatientProvider = ({ children }: { children: ReactNode }) => {
  const [activePatient, setActivePatient] = useState<Patient | null>(null)
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null)

  return (
    <ActivePatientContext.Provider
      value={{ activePatient, setActivePatient, activeAppointmentId, setActiveAppointmentId }}
    >
      {children}
    </ActivePatientContext.Provider>
  )
}

export const useActivePatient = () => {
  const ctx = useContext(ActivePatientContext)
  if (!ctx) throw new Error('useActivePatient must be used within ActivePatientProvider')
  return ctx
}
