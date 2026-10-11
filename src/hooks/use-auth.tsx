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
  isDemoMode: boolean
  signUp: (data: SignUpData) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  demoSignIn: (
    role: 'doctor' | 'clinic' | 'patient' | 'secretaria' | 'faxineira',
  ) => Promise<{ error: any }>
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
  const [isDemoMode, setIsDemoMode] = useState(
    typeof localStorage !== 'undefined' && localStorage.getItem('demoMode') === 'true',
  )

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
        email: data.email.trim().toLowerCase(),
        password: data.password,
        passwordConfirm: data.password,
        name: data.name.trim(),
        role: data.role,
      }

      if (data.role === 'doctor') {
        userData.crm = data.councilNumber || data.crm || ''
        userData.council_number = data.councilNumber || data.crm || ''
        userData.council_type = data.councilType || 'CRM'
        if (data.specialty) {
          userData.specialty = data.specialty
        }
        // Médicos recém cadastrados começam com registro profissional para aprovação rápida
        userData.council_approved = false
        userData.certificate_status = 'nao_enviado'
      } else if (data.role === 'clinic') {
        userData.cpf_cnpj = data.cnpj || ''
        userData.clinic_address = data.clinicAddress || ''
        userData.clinic_contact = data.clinicContact || ''
      } else if (data.role === 'patient') {
        userData.cpf_cnpj = data.cpf || ''
      }

      // 1. Cria usuário na coleção users
      const created = await pb.collection('users').create(userData)

      // 2. Autentica imediatamente
      await pb.collection('users').authWithPassword(userData.email, data.password)

      // 3. Se for paciente, vincula ou cria registro na tabela patients
      if (data.role === 'patient' && data.cpf) {
        let patientRecord
        try {
          patientRecord = await pb.collection('patients').getFirstListItem(`cpf = "${data.cpf}"`)
        } catch {
          try {
            patientRecord = await pb.collection('patients').create({
              name: data.name.trim(),
              cpf: data.cpf.trim(),
              phone: data.phone || '',
              email: userData.email,
              birth_date: data.birthDate || undefined,
            })
          } catch {
            // Se falhar ao criar o paciente por restrição ou já existir, tenta buscar novamente
            try {
              patientRecord = await pb
                .collection('patients')
                .getFirstListItem(`cpf = "${data.cpf}"`)
            } catch {
              /* ignora e não bloqueia cadastro */
            }
          }
        }
        if (patientRecord?.id) {
          try {
            await pb.collection('users').update(created.id, { patient_link: patientRecord.id })
          } catch {
            /* ignore */
          }
        }
      }

      // Tenta enviar verificação de email sem travar o cadastro caso o SMTP não esteja configurado
      try {
        await pb.collection('users').requestVerification(userData.email)
      } catch {
        // SMTP pode não estar configurado no ambiente de teste; cadastro prossegue normalmente
      }

      // Atualiza o estado do usuário logado
      await refreshUser()

      return { error: null }
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
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

  const demoSignIn = async (role: 'doctor' | 'clinic' | 'patient' | 'secretaria' | 'faxineira') => {
    const demoCreds = {
      doctor: { email: 'demo.medico@resulta.med', password: 'Skip@Pass' },
      clinic: { email: 'demo.clinica@resulta.med', password: 'Skip@Pass' },
      secretaria: { email: 'demo.secretaria@resulta.med', password: 'Skip@Pass' },
      faxineira: { email: 'demo.faxineira@resulta.med', password: 'Skip@Pass' },
      patient: { email: 'demo.paciente@resulta.med', password: 'Skip@Pass' },
    }
    try {
      const cred = demoCreds[role]
      await pb.collection('users').authWithPassword(cred.email, cred.password)
      localStorage.setItem('demoMode', 'true')
      setIsDemoMode(true)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    localStorage.removeItem('demoMode')
    setIsDemoMode(false)
  }

  const userRole = user?.role || 'doctor'

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userRole,
        isDemoMode,
        signUp,
        signIn,
        demoSignIn,
        signOut,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
