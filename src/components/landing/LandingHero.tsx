import { Link } from 'react-router-dom'
import { Stethoscope, ArrowRight, Calendar, Users, Video, FileText, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
      <div className="absolute inset-0 bg-grid-slate-700/[0.2] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      <div className="relative container mx-auto px-4 py-20 md:py-28">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-slate-400">
            {[
              { icon: Calendar, label: 'Agenda' },
              { icon: Users, label: 'Pacientes' },
              { icon: Video, label: 'Teleconsulta' },
              { icon: FileText, label: 'Prontuário' },
              { icon: FolderOpen, label: 'Documentos' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium">
                <Icon className="h-4 w-4 text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
