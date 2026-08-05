import { NavLink, useNavigate } from 'react-router-dom'
import { Home, FileText, FolderOpen, Pill, Video, LogOut, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function PatientSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/patient', label: 'Minhas Consultas', icon: Home },
    { to: '/patient/prontuario', label: 'Meu Prontuário', icon: FileText },
    { to: '/patient/documentos', label: 'Meus Documentos', icon: FolderOpen },
    { to: '/patient/prescricoes', label: 'Minhas Prescrições', icon: Pill },
    { to: '/patient/teleconsulta', label: 'Teleconsulta', icon: Video },
  ]

  const handleSignOut = () => {
    signOut()
    navigate('/entrar')
  }

  return (
    <aside className="bg-slate-900 text-slate-100 flex flex-col justify-between w-64 border-r border-slate-800">
      <div>
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Heart className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-white ml-2">Minha Saúde</span>
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
                      ? 'bg-blue-600 text-white'
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
          <Avatar className="h-8 w-8 bg-blue-700 text-white">
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'PT'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium truncate">{user?.name || 'Paciente'}</p>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Sair
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}
