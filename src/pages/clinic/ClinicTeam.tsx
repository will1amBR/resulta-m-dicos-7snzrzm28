import { useState, useEffect } from 'react'
import { UserCog, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { getClinicDoctors } from '@/services/clinic'
import { approveUserCouncil } from '@/services/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface DoctorUser {
  id: string
  name: string
  email: string
  council_type?: string
  council_number?: string
  council_approved?: boolean
  expand?: { specialty?: { name: string } }
  created: string
}

export default function ClinicTeam() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<DoctorUser[]>([])
  const [approving, setApproving] = useState<string | null>(null)

  const loadDoctors = async () => {
    try {
      const list = await getClinicDoctors()
      setDoctors(list as unknown as DoctorUser[])
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const handleApprove = async (userId: string) => {
    setApproving(userId)
    try {
      await approveUserCouncil(userId)
      toast({ title: 'Registro profissional aprovado!' })
      loadDoctors()
    } catch {
      toast({ title: 'Erro ao aprovar registro', variant: 'destructive' })
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-emerald-600" /> Equipe Médica
        </h1>
        <p className="text-xs text-slate-500">Gerencie médicos e aprovações de conselho.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {doctors.map((doc) => (
          <Card key={doc.id} className="shadow-subtle">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {doc.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {doc.expand?.specialty?.name || 'Sem especialidade'}
                    </p>
                  </div>
                </div>
                {doc.council_approved ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                {doc.council_type && (
                  <Badge variant="secondary" className="text-[10px]">
                    {doc.council_type}
                  </Badge>
                )}
                {doc.council_number && <span>Nº: {doc.council_number}</span>}
              </div>
              {!doc.council_approved && (
                <Button
                  size="sm"
                  onClick={() => handleApprove(doc.id)}
                  disabled={approving === doc.id}
                  className="w-full bg-green-600 hover:bg-green-700 text-xs h-8"
                >
                  {approving === doc.id ? (
                    'Aprovando...'
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar Conselho
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {doctors.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-400">
            Nenhum médico cadastrado.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
