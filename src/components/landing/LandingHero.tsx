import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  ArrowRight,
  Calendar,
  Users,
  Video,
  FileText,
  FolderOpen,
  Building2,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function LandingHero() {
  const { demoSignIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  const handleDemoClick = async (role: 'doctor' | 'clinic' | 'patient') => {
    setDemoLoading(role)
    try {
      const { error } = await demoSignIn(role)
      if (error) {
        toast({
          title: 'Erro ao acessar modo demonstração',
          description: error.message || 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const roleLabels = {
        doctor: 'Médico (Dr. William - Cardiologia)',
        clinic: 'Clínica & Secretaria',
        patient: 'Paciente (Lucas Oliveira)',
      }

      toast({
        title: 'Demonstração Ativada',
        description: `Conectado como ${roleLabels[role]}.`,
      })

      if (role === 'clinic') {
        navigate('/clinic')
      } else if (role === 'patient') {
        navigate('/patient')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      toast({
        title: 'Erro no acesso demo',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
      <div className="absolute inset-0 bg-grid-slate-700/[0.2] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
            <Stethoscope className="h-4 w-4 text-blue-300" />
            <span className="text-xs font-medium text-blue-200">Plataforma Médica Unificada</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
            Uma consulta.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              O mesmo ecossistema.
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Agenda, pacientes, teleconsulta, prontuário e documentos num só lugar, durante o
            atendimento. Sem alternar abas, sem copiar e colar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25"
            >
              <Link to="/cadastro">
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <Link to="/entrar">Já tenho conta</Link>
            </Button>
          </div>

          {/* SESSÃO DEMO RÁPIDA NA LANDING HERO */}
          <div className="mt-10 pt-8 border-t border-slate-700/60 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Experimente agora com dados de teste pré-populados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <button
                type="button"
                onClick={() => handleDemoClick('doctor')}
                disabled={!!demoLoading}
                className="group p-3 rounded-xl bg-slate-800/80 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500/50 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" /> Demo Médico
                    </span>
                    {demoLoading === 'doctor' && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Agenda, prontuário com IA, emissão de receitas e documentos.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Entrar como Médico →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('clinic')}
                disabled={!!demoLoading}
                className="group p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Demo Clínica
                    </span>
                    {demoLoading === 'clinic' && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Central de aprovações, gestão da equipe médica e secretária.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Entrar como Clínica →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('patient')}
                disabled={!!demoLoading}
                className="group p-3 rounded-xl bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/50 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Demo Paciente
                    </span>
                    {demoLoading === 'patient' && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Portal do paciente, receitas, laudos e solicitação de renovação.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-purple-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Entrar como Paciente →
                </span>
              </button>
            </div>
          </div>

          {/* Features pills */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-slate-400">
            {[
              { icon: Calendar, label: 'Agenda' },
              { icon: Users, label: 'Pacientes' },
              { icon: Video, label: 'Teleconsulta' },
              { icon: FileText, label: 'Prontuário' },
              { icon: FolderOpen, label: 'Documentos' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <Icon className="h-4 w-4 text-slate-500" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
