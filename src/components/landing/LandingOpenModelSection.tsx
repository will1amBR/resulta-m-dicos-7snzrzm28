import {
  ShieldCheck,
  KeyRound,
  History,
  QrCode,
  Video,
  LineChart,
  BrainCircuit,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const pillars = [
  {
    icon: KeyRound,
    title: 'Concessões de Acesso de 24 Horas',
    description:
      'Médicos e clínicas só visualizam prontuários e exames se o paciente conceder autorização ativa. Acesso temporário que expira automaticamente.',
    tag: 'Soberania Total',
    color: 'emerald',
  },
  {
    icon: History,
    title: 'Trilha de Auditoria Integral (LGPD)',
    description:
      'Toda e qualquer consulta ao histórico clínico dispara notificação imediata ao paciente e fica registrada em log imutável com data, profissional e escopo.',
    tag: 'Transparência em Tempo Real',
    color: 'blue',
  },
  {
    icon: QrCode,
    title: 'Receitas & Documentos com Verificação Pública',
    description:
      'Prescrições, laudos e atestados contêm QR Code exclusivo e código alfanumérico para validação pública e instantânea na página /consulta-receita.',
    tag: 'Validação CFM / ITI',
    color: 'indigo',
  },
  {
    icon: LineChart,
    title: 'Exames com Evolução Temporal de Marcadores',
    description:
      'Laboratórios (Creatinina, TSH, Hemoglobina, Glicemia) organizados automaticamente em gráficos com alertas de normalidade e tendências ao longo do tempo.',
    tag: 'Inteligência Laboratorial',
    color: 'cyan',
  },
  {
    icon: Video,
    title: 'Teleconsulta Integrada WebRTC',
    description:
      'Vídeo e chat integrados à mesma tela do prontuário SOAP, sem ferramentas externas, sem senhas adicionais e sem sair do atendimento.',
    tag: 'Sem Troca de Janelas',
    color: 'amber',
  },
  {
    icon: BrainCircuit,
    title: 'IA Clínica de Análise Cruzada',
    description:
      'Leitura inteligente de documentos por OCR e detecção em tempo real de interações medicamentosas graves entre medicamentos prescritos e de uso contínuo.',
    tag: 'Segurança do Paciente',
    color: 'purple',
  },
]

export function LandingOpenModelSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3.5 py-1 text-xs uppercase tracking-widest font-bold mb-4">
            <ShieldCheck className="h-4 w-4 mr-1.5 inline" /> O Novo Paradigma da Saúde Digital
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            O paciente no centro.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              O histórico pertence a ele.
            </span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Esqueça prontuários aprisionados em sistemas isolados de consultórios ou clínicas. Na
            Resulta Médicos, o paciente é o dono soberano da sua trajetória clínica e autoriza quem,
            quando e por quanto tempo cada profissional pode examinar seus registros.
          </p>
        </div>

        {/* Grid de 6 Pilares do Modelo Aberto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {pillars.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-700 text-slate-300 group-hover:border-emerald-400/40 group-hover:text-emerald-300"
                    >
                      {item.tag}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-400" /> Criptografia & LGPD
                  </span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Saiba mais →
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner de Demonstração do Modelo Aberto */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-blue-950/80 border border-emerald-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Experimente na prática o fluxo de autorização 24h</span>
            </div>
            <h4 className="text-lg md:text-xl font-bold text-white">
              Veja a visão do médico e a central de consentimento do paciente
            </h4>
            <p className="text-xs text-slate-300 max-w-xl">
              Entre como paciente para aprovar ou revogar concessões, ou como médico para solicitar
              acesso ao histórico completo durante a consulta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 h-10 px-5"
            >
              <Link to="/cadastro">
                Criar Conta Gratuita <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-10"
            >
              <Link to="/consulta-receita">Verificar Documento Público (/consulta-receita)</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
