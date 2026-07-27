import { useState, useEffect } from 'react'
import { Bell, Search, User, UserCheck, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useActivePatient } from '@/contexts/active-patient-context'
import { getPatients } from '@/services/patients'
import { Patient } from '@/types/clinical'
import { useNavigate } from 'react-router-dom'

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const { activePatient, setActivePatient } = useActivePatient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const navigate = useNavigate()

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

  return (
    <header className="h-16 border-b bg-white px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>
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
      </div>

      <div className="flex items-center gap-3">
        {activePatient ? (
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs text-blue-800">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>
              Consulta em andamento: <strong>{activePatient.name}</strong>
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <User className="h-3.5 w-3.5" />
            <span>Nenhum paciente selecionado</span>
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <h4 className="font-semibold text-sm mb-2 text-slate-900">Notificações</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 rounded border border-blue-100">
                <p className="font-medium text-blue-900">Próxima Consulta</p>
                <p className="text-blue-700">Ana Silva Santos às 09:00</p>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="font-medium text-slate-900">Novo Exame Anexado</p>
                <p className="text-slate-600">Hemograma completo classificado por IA</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
