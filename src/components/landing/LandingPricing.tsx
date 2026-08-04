import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Individual',
    price: 'R$ 149',
    period: '/mês',
    description: 'Para médicos autônomos',
    features: [
      'Agenda e gestão de pacientes',
      'Prontuário SOAP com CID-10',
      'Documentos com classificação por IA',
      'Análise de interações medicamentosas',
      '1 usuário',
    ],
    highlighted: false,
  },
  {
    name: 'Clínica',
    price: 'R$ 399',
    period: '/mês',
    description: 'Para clínicas de pequeno e médio porte',
    features: [
      'Tudo do plano Individual',
      'Até 5 médicos',
      'Teleconsulta integrada',
      'Exportação de prontuário em PDF',
      'Gestão de conselhos profissionais',
      'Suporte prioritário',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para redes e hospitais',
    features: [
      'Usuários ilimitados',
      'Integrações personalizadas',
      'Treinamento dedicado',
      'SLA garantido',
      'Gestor de conta exclusivo',
    ],
    highlighted: false,
  },
]

export function LandingPricing() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Planos para cada etapa
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Escolha o plano ideal para você ou sua clínica. Cancele quando quiser.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl border p-6 bg-white transition-all duration-300',
                plan.highlighted
                  ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20 scale-[1.02]'
                  : 'border-slate-200 hover:shadow-md',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-400">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  'w-full font-semibold',
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900',
                )}
              >
                <Link to="/cadastro">
                  Começar <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
