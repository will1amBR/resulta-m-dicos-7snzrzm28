import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('william@korenambiental.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('E-mail ou senha incorretos. Tente novamente.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg mb-2">
            <Stethoscope className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            Resulta Médicos
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs">
            Uma consulta. O mesmo ecossistema. Agenda, pacientes, teleconsulta, prontuário e
            documentos num só lugar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-700">E-mail Médico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="medico@clinica.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700">Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              {loading ? 'Acessando plataforma...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-xs text-slate-500 border-t pt-4">
          <p>
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-blue-600 font-semibold hover:underline">
              Criar conta médica
            </Link>
          </p>
          <p className="text-[10px] text-slate-400">Resulta © 2025 - Segurança em Saúde e LGPD</p>
        </CardFooter>
      </Card>
    </div>
  )
}
