import React, { useState } from 'react'
import {
  HelpCircle,
  FileDown,
  Building2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Info,
  Shield,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface LabExportTutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenUpload?: () => void
}

const LAB_TUTORIALS = [
  {
    id: 'fleury',
    name: 'Fleury',
    fullName: 'Laboratório Fleury',
    portalUrl: 'fleury.com.br',
    badge: 'Portal do Paciente',
    steps: [
      {
        step: 1,
        title: 'Acesse o portal do Fleury',
        desc: 'Abra o navegador e entre no site oficial do Fleury. Clique na área do paciente ou em "Resultados de Exames".',
      },
      {
        step: 2,
        title: 'Faça login com seu CPF ou identificador',
        desc: 'Informe seu CPF e senha cadastrada (ou utilize o código de atendimento que consta no canhoto de coleta entregue na unidade).',
      },
      {
        step: 3,
        title: 'Localize a data ou exame desejado',
        desc: 'Na aba "Histórico de Resultados" ou "Meus Exames", clique na consulta ou coleta que deseja baixar.',
      },
      {
        step: 4,
        title: 'Baixe o arquivo PDF original do laudo',
        desc: 'Clique no botão de download "Baixar Laudo Completo (PDF)" ou "Salvar PDF". Guarde o arquivo na pasta de downloads do seu dispositivo.',
      },
      {
        step: 5,
        title: 'Envie o PDF na Resulta Médicos',
        desc: 'Retorne aqui e anexe esse mesmo arquivo PDF. Nossa IA lerá os parâmetros laboratoriais e os categorizará automaticamente no seu histórico.',
      },
    ],
  },
  {
    id: 'alta',
    name: 'Alta Diagnósticos',
    fullName: 'Alta Excelência Diagnóstica',
    portalUrl: 'altadiagnosticos.com.br',
    badge: 'Portal Alta',
    steps: [
      {
        step: 1,
        title: 'Acesse o site do Alta Diagnósticos',
        desc: 'Navegue até o site oficial do Alta e clique em "Área do Cliente" ou "Resultados de Exames" no canto superior.',
      },
      {
        step: 2,
        title: 'Autentique sua conta',
        desc: 'Digite seu CPF ou e-mail cadastrado e sua senha de acesso. Também é possível autenticar via protocolo de atendimento.',
      },
      {
        step: 3,
        title: 'Encontre o pedido de exame',
        desc: 'Acesse o menu "Meus Resultados" e selecione o período do exame laboratorial ou de imagem.',
      },
      {
        step: 4,
        title: 'Faça o download do Laudo em PDF',
        desc: 'Clique no ícone de PDF ao lado do nome do exame ou em "Baixar todos os laudos" para salvar o documento em seu computador ou celular.',
      },
      {
        step: 5,
        title: 'Faça o upload do exame aqui',
        desc: 'Selecione o arquivo baixado no modal de upload da Resulta. O sistema extrairá valores como glicemia, colesterol ou hemoglobina para seus gráficos.',
      },
    ],
  },
  {
    id: 'cdb',
    name: 'CDB Diagnósticos',
    fullName: 'CDB Inteligência Diagnóstica',
    portalUrl: 'cdb.com.br',
    badge: 'Portal do Paciente CDB',
    steps: [
      {
        step: 1,
        title: 'Acesse o site do CDB',
        desc: 'Entre no site oficial do laboratório CDB e selecione a opção "Acessar Meus Resultados" ou "Área do Paciente".',
      },
      {
        step: 2,
        title: 'Insira dados do atendimento',
        desc: 'Informe seu CPF e senha de acesso, ou número da ficha/atendimento impresso no comprovante da unidade.',
      },
      {
        step: 3,
        title: 'Selecione o exame liberado',
        desc: 'Na lista de exames prontos, verifique se o status está marcado como "Liberado / Disponível" e clique no exame.',
      },
      {
        step: 4,
        title: 'Exportar laudo em formato PDF',
        desc: 'Clique em "Download PDF" ou "Visualizar Laudo Completo" e salve o documento gerado em formato PDF.',
      },
      {
        step: 5,
        title: 'Anexe o laudo em seu prontuário',
        desc: 'Envie o arquivo PDF na plataforma Resulta para alimentar seu gráfico de evolução temporal de saúde.',
      },
    ],
  },
  {
    id: 'delboni',
    name: 'Delboni',
    fullName: 'Delboni Auriemo (Dasa)',
    portalUrl: 'delboniauriemo.com.br',
    badge: 'Portal Delboni / Nav Dasa',
    steps: [
      {
        step: 1,
        title: 'Acesse o portal Delboni / Nav Dasa',
        desc: 'Entre no site do Delboni Auriemo e clique em "Resultados de Exames" para ser direcionado ao portal do paciente.',
      },
      {
        step: 2,
        title: 'Faça login com seu CPF',
        desc: 'Entre com seu CPF e senha da conta Nav Dasa, ou utilize os dados do protocolo de retirada entregue na coleta.',
      },
      {
        step: 3,
        title: 'Consulte os laudos emitidos',
        desc: 'Abra a seção "Meus Exames" e visualize a relação de análises clínicas ou laudos de imagem concluídos.',
      },
      {
        step: 4,
        title: 'Baixar Laudo Assinado em PDF',
        desc: 'Clique no botão "Baixar Laudo em PDF" ou "Salvar PDF" para que o arquivo oficial com assinatura digital seja gravado no seu aparelho.',
      },
      {
        step: 5,
        title: 'Importe o exame na Resulta',
        desc: 'Utilize o botão "Enviar documento" na Resulta Médicos e selecione o PDF. O sistema cuidará da leitura e catalogação.',
      },
    ],
  },
]

export function LabExportTutorialModal({
  isOpen,
  onClose,
  onOpenUpload,
}: LabExportTutorialModalProps) {
  const [activeLab, setActiveLab] = useState<string>('fleury')

  const currentLab = LAB_TUTORIALS.find((l) => l.id === activeLab) || LAB_TUTORIALS[0]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Como exportar seu exame nos portais de laboratório
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Passo a passo simples para baixar o arquivo PDF oficial do seu exame e anexar aqui
                na Resulta Médicos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instrução geral com aviso */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              O PDF baixado diretamente do portal do laboratório preserva os marcadores numéricos e
              dados de referência originais. Ao enviá-lo, nosso sistema de OCR com IA extrai os
              valores automaticamente para sua curva de exames.
            </p>
          </div>

          {/* Abas por Laboratório */}
          <Tabs value={activeLab} onValueChange={setActiveLab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 p-1 rounded-xl">
              {LAB_TUTORIALS.map((lab) => (
                <TabsTrigger
                  key={lab.id}
                  value={lab.id}
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-xs font-semibold"
                >
                  {lab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {LAB_TUTORIALS.map((lab) => (
              <TabsContent key={lab.id} value={lab.id} className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-700" />
                      {lab.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Instruções de navegação geral no portal do paciente ({lab.portalUrl})
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] w-fit">
                    {lab.badge}
                  </Badge>
                </div>

                {/* Linha do tempo dos passos */}
                <div className="space-y-2.5">
                  {lab.steps.map((s) => (
                    <div
                      key={s.step}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate-900">{s.title}</p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-col sm:flex-row">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fechar Tutorial
          </Button>
          {onOpenUpload && (
            <Button
              size="sm"
              onClick={() => {
                onClose()
                onOpenUpload()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              Já baixei o PDF, quero enviar agora
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
