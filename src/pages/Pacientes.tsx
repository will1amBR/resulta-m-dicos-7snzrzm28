import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Plus, FileText, ArrowRight } from 'lucide-react'
import { getPatients } from '@/services/patients'
import { Patient } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NewPatientModal } from '@/components/NewPatientModal'
import { useActivePatient } from '@/contexts/active-patient-context'

export default function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const { setActivePatient } = useActivePatient()
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const list = await getPatients(search)
      setPatients(list)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border shadow-subtle">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Base de Pacientes
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre e gerencie prontuários e históricos de pacientes.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-1" /> Novo Paciente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs bg-white"
        />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-subtle">
        {patients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Nenhum paciente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Convênio</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.cpf}</td>
                    <td className="p-3 text-slate-600">{p.phone || '-'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {p.insurance || 'Particular'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActivePatient(p)
                          navigate('/dashboard')
                        }}
                        className="h-7 text-xs text-blue-600"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> Atender
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                        className="h-7 text-xs"
                      >
                        Ver Ficha <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewPatientModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadData} />
    </div>
  )
}
