import { useState } from 'react'
import { Settings as SettingsIcon, Building2, CreditCard, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { updateClinicProfile } from '@/services/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ClinicSettings() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [cnpj, setCnpj] = useState(user?.cpf_cnpj || '')
  const [address, setAddress] = useState(user?.clinic_address || '')
  const [contact, setContact] = useState(user?.clinic_contact || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateClinicProfile(user.id, {
        name,
        cpf_cnpj: cnpj,
        clinic_address: address,
        clinic_contact: contact,
      })
      await refreshUser()
      toast({ title: 'Perfil da clínica atualizado!' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-subtle">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-emerald-600" /> Configurações da Clínica
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" /> Perfil da Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Nome da Clínica</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs">CNPJ</Label>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Endereço</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Contato (telefone/e-mail)</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" /> Plano e Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-semibold text-green-800">Plano Profissional</p>
              <p className="text-[10px] text-green-600">
                Médicos ilimitados · Teleconsulta · IA Clínica
              </p>
            </div>
            <Badge className="bg-green-600 text-white">
              <Check className="h-3 w-3 mr-1" /> Ativo
            </Badge>
          </div>
          <p className="text-[10px] text-slate-400">
            Próxima cobrança: {new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
