import { Link } from 'react-router-dom'
import { Stethoscope, UserPlus } from 'lucide-react'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingOpenModelSection } from '@/components/landing/LandingOpenModelSection'
import { LandingStats } from '@/components/landing/LandingStats'
import { LandingProblem } from '@/components/landing/LandingProblem'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingCTA } from '@/components/landing/LandingCTA'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                Resulta Médicos
              </span>
              <span className="text-[10px] text-blue-300 font-medium">Modelo Aberto de Saúde</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/entrar"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Fazer Login
            </Link>
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg shadow-sm shadow-blue-600/30 transition-all hover:shadow-blue-600/50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Criar Conta</span>
            </Link>
          </div>
        </div>
      </header>
      <LandingHero /> <LandingOpenModelSection />
      <LandingStats />
      <LandingProblem />
      <LandingFeatures />
      <LandingPricing />
      <LandingCTA />
    </div>
  )
}
