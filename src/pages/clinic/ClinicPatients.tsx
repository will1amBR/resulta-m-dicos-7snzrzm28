import { useState, useEffect } from 'react'
import { Users, Search } from 'lucide-react'
import { getClinicPatients } from '@/services/clinic'
import { Patient } from '@/types/clinical'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function ClinicPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Patient | null>(null)

  const loadData = async () => {
    try {
      const list = await getClinicPatients(search)
      setPatients(list)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [search])

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" /> Pacientes da Clínica
        </h1>
        <p className="text-xs text-slate-500">Base completa de pacientes cadastrados.</p>
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
          <p className="p-8 text-center text-xs text-slate-400">Nenhum paciente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Convênio</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.cpf}</td>
                    <td className="p-3 text-slate-600">{p.phone || '-'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {p.insurance || 'Particular'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setSelected(p)}
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-xs">
            <p>
              <strong>CPF:</strong> {selected?.cpf}
            </p>
            <p>
              <strong>Telefone:</strong> {selected?.phone || 'N/A'}
            </p>
            <p>
              <strong>E-mail:</strong> {selected?.email || 'N/A'}
            </p>
            <p>
              <strong>Convênio:</strong> {selected?.insurance || 'Particular'}
            </p>
            {selected?.birth_date && (
              <p>
                <strong>Nascimento:</strong>{' '}
                {new Date(selected.birth_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
