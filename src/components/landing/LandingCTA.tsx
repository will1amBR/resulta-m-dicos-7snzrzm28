import { Link } from 'react-router-dom'
import { ArrowRight, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingCTA() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20">
      <div className="container mx-auto px-4 text-center">
        <Stethoscope className="h-12 w-12 text-white mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Pronto para unificar sua consulta?
        </h2>
        <p className="text-blue-100 max-w-2xl mx-auto mb-8">
          Junte-se aos médicos que já centralizaram sua prática clínica numa só plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
          >
            <Link to="/cadastro">
              Criar conta gratuita <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10"
          >
            <Link to="/entrar">Fazer login</Link>
          </Button>
        </div>
        <p className="text-blue-200 text-xs mt-6">Resulta © 2025 — Segurança em Saúde e LGPD</p>
      </div>
    </section>
  )
}
