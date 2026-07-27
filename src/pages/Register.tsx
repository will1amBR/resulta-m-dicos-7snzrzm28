import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { getSpecialties } from '@/services/specialties'
import { Specialty, CouncilType } from '@/types/clinical'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [name, setName] = useState('')
  const [crm, setCrm] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [councilType, setCouncilType] = useState<CouncilType>('CRM')
  const [councilNumber, setCouncilNumber] = useState('')
  const [lgpdAccepted, setLgpdAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lgpdAccepted) {
      setError('É necessário aceitar os termos da LGPD para prosseguir.')
      return
    }
    setError('')
    setLoading(true)
    const { error: err } = await signUp({
      name,
      crm,
      email,
      password,
      specialty: specialtyId || undefined,
      councilType,
      councilNumber,
    })
    setLoading(false)
    if (err) {
      setError('Erro ao cadastrar conta. Verifique os dados informados.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="mx-auto h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow mb-1">
            <Stethoscope className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">Cadastro do Médico</CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Crie sua conta para unificar sua clínica em um só lugar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Nome Completo (com título)</Label>
              <Input
                placeholder="Dr. João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo de Conselho</Label>
                <Select value={councilType} onValueChange={(v) => setCouncilType(v as CouncilType)}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Selecione" />
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
                  placeholder="123456-SP"
                  value={councilNumber}
                  onChange={(e) => setCouncilNumber(e.target.value)}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Especialidade</Label>
              <Select value={specialtyId} onValueChange={setSpecialtyId}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">E-mail Profissional</Label>
              <Input
                type="email"
                placeholder="medico@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Senha de Acesso (mínimo 8 caracteres)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 text-xs mt-1"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="lgpd"
                checked={lgpdAccepted}
                onCheckedChange={(c) => setLgpdAccepted(!!c)}
              />
              <label
                htmlFor="lgpd"
                className="text-[11px] text-slate-600 cursor-pointer leading-tight"
              >
                Concordo com os Termos de Uso e Política de Privacidade conforme a LGPD para
                tratamento de dados clínicos.
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 mt-2"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              {loading ? 'Criando conta...' : 'Cadastrar Médicos'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center justify-center text-xs text-slate-500 border-t pt-3">
          Já possui conta?{' '}
          <Link to="/entrar" className="text-blue-600 font-semibold ml-1 hover:underline">
            Fazer Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
