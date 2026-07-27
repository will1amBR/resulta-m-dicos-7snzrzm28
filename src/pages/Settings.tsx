import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { CouncilType } from '@/types/clinical'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [crm, setCrm] = useState(user?.crm || '')
  const [councilType, setCouncilType] = useState<CouncilType>(
    (user?.council_type as CouncilType) || 'CRM',
  )
  const [councilNumber, setCouncilNumber] = useState(user?.council_number || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: 'Configurações salvas com sucesso!' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Perfil e Preferências Clínicas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Nome Profissional</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">CRM / UF (deprecated)</Label>
              <Input
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo de Conselho</Label>
                <Select value={councilType} onValueChange={(v) => setCouncilType(v as CouncilType)}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['CRM', 'CRN', 'CRP', 'CRO', 'COREN', 'CREFITO'] as CouncilType[]).map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Número do Conselho</Label>
                <Input
                  value={councilNumber}
                  onChange={(e) => setCouncilNumber(e.target.value)}
                  className="mt-1 text-xs"
                  placeholder="123456-SP"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border">
              {user?.council_approved ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    Registro profissional aprovado
                  </span>
                  <Badge className="bg-green-100 text-green-700 text-[10px] ml-auto">
                    Aprovado
                  </Badge>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span className="text-xs text-amber-700 font-medium">
                    Registro pendente de aprovação
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-auto">
                    Pendente
                  </Badge>
                </>
              )}
            </div>

            <div>
              <Label className="text-xs">E-mail de Cadastro</Label>
              <Input value={user?.email || ''} disabled className="mt-1 text-xs bg-slate-100" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/councils')}
                className="text-xs"
              >
                Painel Admin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
