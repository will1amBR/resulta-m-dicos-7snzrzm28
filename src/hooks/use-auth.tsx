import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (data: {
    email: string
    password: string
    name: string
    crm: string
    specialty?: string
    cpfCnpj?: string
    councilType?: string
    councilNumber?: string
  }) => Promise<{ error: any }>
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
        const record = await pb.collection('users').authRefresh({ expand: 'specialty' })
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

  const signUp = async (data: {
    email: string
    password: string
    name: string
    crm: string
    specialty?: string
    cpfCnpj?: string
    councilType?: string
    councilNumber?: string
  }) => {
    try {
      await pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        name: data.name,
        crm: data.crm,
        specialty: data.specialty,
        cpf_cnpj: data.cpfCnpj,
        council_type: data.councilType,
        council_number: data.councilNumber,
      })
      await pb.collection('users').authWithPassword(data.email, data.password)
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

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, signUp, signIn, signOut, loading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
