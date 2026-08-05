import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { UserRole } from '@/types/clinical'

interface SignUpData {
  role: UserRole
  email: string
  password: string
  name: string
  crm?: string
  specialty?: string
  councilType?: string
  councilNumber?: string
  cnpj?: string
  clinicAddress?: string
  clinicContact?: string
  cpf?: string
  phone?: string
  birthDate?: string
}

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  userRole: string
  signUp: (data: SignUpData) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const record = await pb
          .collection('users')
          .authRefresh({ expand: 'specialty,patient_link' })
        setUser(record.record)
        setIsAuthenticated(true)
      } catch {
        pb.authStore.clear()
        setUser(null)
        setIsAuthenticated(false)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
    })
    if (pb.authStore.isValid) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (data: SignUpData) => {
    try {
      const userData: Record<string, any> = {
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        name: data.name,
        role: data.role,
      }

      if (data.role === 'doctor') {
        userData.crm = data.crm
        userData.specialty = data.specialty
        userData.council_type = data.councilType
        userData.council_number = data.councilNumber
      } else if (data.role === 'clinic') {
        userData.cpf_cnpj = data.cnpj
        userData.clinic_address = data.clinicAddress
        userData.clinic_contact = data.clinicContact
      } else if (data.role === 'patient') {
        userData.cpf_cnpj = data.cpf
      }

      const created = await pb.collection('users').create(userData)
      await pb.collection('users').authWithPassword(data.email, data.password)

      if (data.role === 'patient' && data.cpf) {
        let patientRecord
        try {
          patientRecord = await pb.collection('patients').getFirstListItem(`cpf = "${data.cpf}"`)
        } catch {
          patientRecord = await pb.collection('patients').create({
            name: data.name,
            cpf: data.cpf,
            phone: data.phone || '',
            email: data.email,
            birth_date: data.birthDate || undefined,
          })
        }
        await pb.collection('users').update(created.id, { patient_link: patientRecord.id })
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  const userRole = user?.role || 'doctor'

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, userRole, signUp, signIn, signOut, loading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
