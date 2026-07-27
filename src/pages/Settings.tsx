import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [crm, setCrm] = useState(user?.crm || '')

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
              <Label className="text-xs">CRM / UF</Label>
              <Input
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">E-mail de Cadastro</Label>
              <Input value={user?.email || ''} disabled className="mt-1 text-xs bg-slate-100" />
            </div>

            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
