import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Video,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  ShieldCheck,
  Pill,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agenda', label: 'Agenda', icon: Calendar },
    { to: '/pacientes', label: 'Pacientes', icon: Users },
    { to: '/doctor/receitas', label: 'Receitas', icon: Pill },
    { to: '/prontuario', label: 'Prontuário', icon: FileText },
    { to: '/teleconsulta', label: 'Teleconsulta', icon: Video },
    { to: '/documentos', label: 'Documentos', icon: FolderOpen },
    { to: '/admin/conselhos', label: 'Aprovações', icon: ShieldCheck },
  ]

  const handleSignOut = () => {
    signOut()
    navigate('/entrar')
  }

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-100 flex flex-col justify-between transition-all duration-200 border-r border-slate-800 relative z-40',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Resulta</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 transition-colors text-left">
              <Avatar className="h-9 w-9 bg-blue-700 text-white font-semibold">
                <AvatarFallback>
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Dr. Usuário'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">CRM {user?.crm || 'CRM-SP'}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-slate-900 border-slate-800 text-slate-200"
          >
            <DropdownMenuItem
              onClick={() => navigate('/configuracoes')}
              className="cursor-pointer hover:bg-slate-800"
            >
              <Settings className="mr-2 h-4 w-4 text-slate-400" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-400 hover:bg-slate-800 focus:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
