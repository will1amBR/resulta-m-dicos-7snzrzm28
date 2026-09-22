import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCog,
  Settings,
  LogOut,
  Stethoscope,
  Boxes,
  MessageSquare,
  Kanban,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ClinicSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { userRole } = useAuth()
  const allNavItems = [
    { to: '/clinic', label: 'Dashboard', icon: LayoutDashboard, roles: ['clinic', 'admin'] },
    {
      to: '/clinic/agenda',
      label: 'Agenda da Clínica',
      icon: Calendar,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    {
      to: '/clinic/whatsapp',
      label: 'Portal WhatsApp',
      icon: MessageSquare,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    {
      to: '/clinic/crm',
      label: 'CRM de Pacientes',
      icon: Kanban,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    {
      to: '/clinic/estoque',
      label: 'Estoque de Insumos',
      icon: Boxes,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    {
      to: '/staff/limpeza',
      label: 'Rotina de Limpeza',
      icon: Sparkles,
      roles: ['clinic', 'faxineira', 'secretaria', 'admin'],
    },
    {
      to: '/clinic/pacientes',
      label: 'Pacientes',
      icon: Users,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    {
      to: '/admin/conselhos',
      label: 'Aprovações & Secretaria',
      icon: Stethoscope,
      roles: ['clinic', 'secretaria', 'admin'],
    },
    { to: '/clinic/equipe', label: 'Equipe Médica', icon: UserCog, roles: ['clinic', 'admin'] },
    {
      to: '/clinic/configuracoes',
      label: 'Configurações',
      icon: Settings,
      roles: ['clinic', 'admin'],
    },
  ]

  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole || 'clinic')
  })

  const handleSignOut = () => {
    signOut()
    navigate('/entrar')
  }

  return (
    <aside className="bg-slate-900 text-slate-100 flex flex-col justify-between w-64 border-r border-slate-800">
      <div>
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-white ml-2">Resulta Clínica</span>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 text-slate-300 text-sm"
        >
          <Avatar className="h-8 w-8 bg-emerald-700 text-white">
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'CL'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium truncate">{user?.name || 'Clínica'}</p>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Sair
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}
