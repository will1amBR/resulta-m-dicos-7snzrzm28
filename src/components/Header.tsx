import { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  User,
  UserCheck,
  Menu,
  AlertTriangle,
  KeyRound,
  CheckCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useActivePatient } from '@/contexts/active-patient-context'
import { useAuth } from '@/hooks/use-auth'
import { getPatients } from '@/services/patients'
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications'
import { Patient, InAppNotification } from '@/types/clinical'
import { useNavigate } from 'react-router-dom'

export function Header({
  onOpenMobileMenu,
  role = 'doctor',
}: {
  onOpenMobileMenu?: () => void
  role?: string
}) {
  const { user } = useAuth()
  const { activePatient, setActivePatient } = useActivePatient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const navigate = useNavigate()

  // Load real in-app notifications
  const loadNotifications = async () => {
    if (!user?.id) return
    const list = await getMyNotifications(10)
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsOpenSearch(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const patients = await getPatients(searchTerm)
        setSearchResults(patients.slice(0, 5))
        setIsOpenSearch(true)
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = async (notif: InAppNotification) => {
    await markNotificationAsRead(notif.id)
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
    if (notif.link) {
      setPopoverOpen(false)
      navigate(notif.link)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="h-16 border-b bg-white px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>
        {role !== 'patient' && (
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar paciente por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-9 text-sm bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            />
            {isOpenSearch && searchResults.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white border rounded-md shadow-lg z-50 py-1">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePatient(p)
                      setIsOpenSearch(false)
                      setSearchTerm('')
                      navigate('/dashboard')
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">CPF: {p.cpf}</p>
                    </div>
                    {p.insurance && (
                      <Badge variant="outline" className="text-xs">
                        {p.insurance}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {role === 'patient' && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-medium">Portal do Paciente</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {role !== 'patient' && activePatient && (
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs text-blue-800">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>
              Consulta: <strong>{activePatient.name}</strong>
            </span>
          </div>
        )}
        {role !== 'patient' && !activePatient && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <User className="h-3.5 w-3.5" />
            <span>Nenhum paciente selecionado</span>
          </div>
        )}

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-3" align="end">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-blue-600" />
                Notificações {unreadCount > 0 && `(${unreadCount})`}
              </h4>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar lidas
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
              {/* If no custom notifications in database, show standard welcome & demo notifications */}
              {notifications.length === 0 ? (
                <>
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-xs">
                    <p className="font-bold text-blue-900">Plataforma Resulta Médicos</p>
                    <p className="text-blue-700 text-[11px] mt-0.5">
                      Sistema de receitas digitais e prontuário ativo.
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5 text-amber-600" /> Certificado Digital
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Envie seu certificado ICP-Brasil em Configurações para validar suas
                      prescrições.
                    </p>
                  </div>
                </>
              ) : (
                notifications.map((notif) => {
                  const isCertAlert = notif.type === 'certificate_alert'
                  const isWarning = notif.type === 'warning'
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        !notif.read
                          ? isCertAlert
                            ? 'bg-amber-50 border-amber-200 font-medium'
                            : 'bg-blue-50/70 border-blue-200'
                          : 'bg-slate-50 border-slate-100 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={`font-bold text-xs ${
                            isCertAlert ? 'text-amber-950' : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p
                        className={`text-[11px] mt-1 leading-relaxed ${
                          isCertAlert ? 'text-amber-800' : 'text-slate-600'
                        }`}
                      >
                        {notif.message}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
