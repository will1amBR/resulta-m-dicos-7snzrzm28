import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, Clock, User } from 'lucide-react'
import { getUnapprovedUsers, approveUserCouncil } from '@/services/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface PendingUser {
  id: string
  name: string
  email: string
  council_type?: string
  council_number?: string
  crm?: string
  specialty?: string
  created: string
}

export default function AdminCouncils() {
  const { toast } = useToast()
  const [pending, setPending] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  const loadPending = async () => {
    setLoading(true)
    try {
      const users = await getUnapprovedUsers()
      setPending(users as unknown as PendingUser[])
    } catch {
      setPending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (userId: string) => {
    setApproving(userId)
    try {
      await approveUserCouncil(userId)
      toast({ title: 'Registro profissional aprovado com sucesso!' })
      setPending((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast({ title: 'Erro ao aprovar registro', variant: 'destructive' })
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-blue-600" />
        <h1 className="text-lg font-bold text-slate-900">Aprovação de Conselhos Profissionais</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Registros Pendentes ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
              <p className="text-sm text-slate-600">Nenhum registro pendente de aprovação.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {u.council_type && (
                          <Badge variant="secondary" className="text-[10px]">
                            {u.council_type}
                          </Badge>
                        )}
                        {u.council_number && (
                          <span className="text-[11px] text-slate-600">Nº: {u.council_number}</span>
                        )}
                        {u.crm && !u.council_number && (
                          <span className="text-[11px] text-slate-600">CRM: {u.crm}</span>
                        )}
                        {u.specialty && (
                          <span className="text-[11px] text-slate-400">| {u.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(u.id)}
                    disabled={approving === u.id}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    {approving === u.id ? (
                      'Aprovando...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
