import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, Building2, Heart, UserPlus } from 'lucide-react'
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
import { Specialty, CouncilType, UserRole } from '@/types/clinical'
import { cn } from '@/lib/utils'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [role, setRole] = useState<UserRole>('doctor')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [councilType, setCouncilType] = useState<CouncilType>('CRM')
  const [councilNumber, setCouncilNumber] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [lgpdAccepted, setLgpdAccepted] = useState(false)
  const [cnpj, setCnpj] = useState('')
  const [clinicAddress, setClinicAddress] = useState('')
  const [clinicContact, setClinicContact] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'doctor' && !lgpdAccepted) {
      setError('Aceite os termos da LGPD.')
      return
    }
    setError('')
    setLoading(true)
    const data: any = { role, email, password, name }
    if (role === 'doctor') {
      data.councilType = councilType
      data.councilNumber = councilNumber
      data.specialty = specialtyId || undefined
    } else if (role === 'clinic') {
      data.cnpj = cnpj
      data.clinicAddress = clinicAddress
      data.clinicContact = clinicContact
    } else if (role === 'patient') {
      data.cpf = cpf
      data.phone = phone
      data.birthDate = birthDate || undefined
    }
    const { error: err } = await signUp(data)
    setLoading(false)
    if (err) {
      setError('Erro ao cadastrar. Verifique os dados.')
    } else {
      navigate(role === 'clinic' ? '/clinic' : role === 'patient' ? '/patient' : '/dashboard')
    }
  }

  const roleOptions = [
    { value: 'doctor' as UserRole, label: 'Médico', icon: Stethoscope, color: 'blue' },
    { value: 'clinic' as UserRole, label: 'Clínica', icon: Building2, color: 'emerald' },
    { value: 'patient' as UserRole, label: 'Paciente', icon: Heart, color: 'indigo' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl">
        <CardHeader className="text-center space-y-1 pb-2">
          <CardTitle className="text-xl font-bold text-slate-900">Criar Conta</CardTitle>
          <CardDescription className="text-xs">
            Escolha seu tipo de conta para começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {roleOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-medium',
                    role === opt.value
                      ? `border-${opt.color}-600 bg-${opt.color}-50 text-${opt.color}-700`
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">
                {role === 'clinic' ? 'Nome da Clínica' : 'Nome Completo'}
              </Label>
              <Input
                placeholder={
                  role === 'clinic'
                    ? 'Clínica Saúde Total'
                    : role === 'doctor'
                      ? 'Dr. João Silva'
                      : 'Maria Santos'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            {role === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Conselho</Label>
                    <Select
                      value={councilType}
                      onValueChange={(v) => setCouncilType(v as CouncilType)}
                    >
                      <SelectTrigger className="mt-1 text-xs h-8">
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
                    <Label className="text-xs">Número</Label>
                    <Input
                      placeholder="123456-SP"
                      value={councilNumber}
                      onChange={(e) => setCouncilNumber(e.target.value)}
                      className="mt-1 text-xs h-8"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Especialidade</Label>
                  <Select value={specialtyId} onValueChange={setSpecialtyId}>
                    <SelectTrigger className="mt-1 text-xs h-8">
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
              </>
            )}
            {role === 'clinic' && (
              <>
                <div>
                  <Label className="text-xs">CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="mt-1 text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Endereço</Label>
                  <Input
                    placeholder="Av. Paulista, 1000"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="mt-1 text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contato</Label>
                  <Input
                    placeholder="(11) 3000-0000"
                    value={clinicContact}
                    onChange={(e) => setClinicContact(e.target.value)}
                    className="mt-1 text-xs h-8"
                  />
                </div>
              </>
            )}
            {role === 'patient' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="mt-1 text-xs h-8"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      placeholder="(11) 90000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1 text-xs h-8"
                  />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 text-xs h-8"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Senha (mín. 8 caracteres)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 text-xs h-8"
                required
                minLength={8}
              />
            </div>
            {role === 'doctor' && (
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
                  Concordo com a LGPD para tratamento de dados clínicos.
                </label>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 mt-2"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center justify-center text-xs text-slate-500 border-t pt-3">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-blue-600 font-semibold ml-1 hover:underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
