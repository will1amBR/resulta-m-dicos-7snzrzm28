import { useState, useEffect } from 'react'
import {
  Mic,
  MicOff,
  Sparkles,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { transcribeConsultationToSoap } from '@/services/transcription_soap'
import { SoapTranscriptionResult } from '@/types/clinical'

interface SoapTranscriptionWidgetProps {
  patientName?: string
  doctorName?: string
  onApplySoap: (result: SoapTranscriptionResult) => void
}

export function SoapTranscriptionWidget({
  patientName,
  doctorName,
  onApplySoap,
}: SoapTranscriptionWidgetProps) {
  const { toast } = useToast()
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isProcessingAi, setIsProcessingAi] = useState(false)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true)
  const [generatedSoap, setGeneratedSoap] = useState<SoapTranscriptionResult | null>(null)

  // Configuração Web Speech API nativa (sem dependências pagas)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setHasSpeechSupport(false)
      return
    }

    try {
      const recog = new SpeechRecognition()
      recog.continuous = true
      recog.interimResults = true
      recog.lang = 'pt-BR'

      recog.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' '
        }
        setTranscript(currentTranscript)
      }

      recog.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recog.onend = () => {
        setIsListening(false)
      }

      setRecognition(recog)
    } catch (err) {
      console.warn('Error initializing Web Speech API:', err)
      setHasSpeechSupport(false)
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: 'Microfone não suportado neste navegador',
        description: 'Você pode colar o texto ou diálogo diretamente na caixa de texto abaixo.',
        variant: 'destructive',
      })
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      toast({ title: 'Gravação pausada' })
    } else {
      try {
        recognition.start()
        setIsListening(true)
        toast({
          title: 'Gravando áudio da consulta...',
          description: 'Fale normalmente. O diálogo será transcrito em tempo real.',
        })
      } catch (err) {
        console.error(err)
        setIsListening(false)
      }
    }
  }

  // Chamar o gateway de IA Skip ($ai.chat) para estruturar em SOAP
  const handleProcessSoapWithAi = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'Texto da consulta vazio',
        description: 'Grave pelo microfone ou cole as anotações da consulta.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessingAi(true)
    try {
      const result = await transcribeConsultationToSoap({
        transcript: transcript.trim(),
        patientName: patientName || 'Paciente',
        doctorName: doctorName || 'Médico',
      })

      setGeneratedSoap(result)
      onApplySoap(result)

      toast({
        title: 'Prontuário SOAP Estruturado com IA!',
        description: 'Os campos Subjetivo, Objetivo, Avaliação e Plano foram preenchidos.',
      })
    } catch {
      toast({
        title: 'Erro ao gerar SOAP com IA',
        description: 'Verifique a transcrição e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingAi(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              Transcrição da Consulta → Estruturação SOAP (IA)
            </h4>
            <p className="text-[10px] text-slate-500">
              Web Speech API nativa + IA Generativa Skip Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasSpeechSupport && (
            <Button
              type="button"
              size="sm"
              onClick={toggleListening}
              className={`h-8 text-xs font-bold gap-1.5 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" /> Pausar Gravação
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" /> Gravar Diálogo
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {isListening
              ? 'Ouvindo e transcrevendo em tempo real...'
              : 'Transcrição do diálogo ou anotações livres:'}
          </span>
          {transcript && (
            <button
              type="button"
              onClick={() => {
                setTranscript('')
                setGeneratedSoap(null)
              }}
              className="text-slate-400 hover:text-rose-600 flex items-center gap-1 text-[10px]"
            >
              <RotateCcw className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Fale pelo microfone ou cole aqui a transcrição da teleconsulta (ex: 'Paciente refere cefaleia há 3 dias pulsátil, PA aferida em 130 por 85, hipotese de migranea, prescrevi dipirona')..."
          rows={3}
          className="text-xs bg-white resize-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[10px] text-slate-400">
          Converte diálogo natural nas 4 seções clínicas: Subjetivo, Objetivo, Avaliação e Plano.
        </p>

        <Button
          type="button"
          size="sm"
          onClick={handleProcessSoapWithAi}
          disabled={isProcessingAi || !transcript.trim()}
          className="h-8 text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isProcessingAi ? 'Estruturando SOAP com IA...' : 'Gerar SOAP Automático (IA)'}
        </Button>
      </div>

      {generatedSoap && (
        <div className="p-3 rounded-lg bg-white border border-purple-200 text-xs space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Resumo SOAP gerado e aplicado ao prontuário!
          </div>
          <p className="text-[11px] text-slate-600 italic">
            Revise as abas abaixo antes de finalizar o atendimento.
          </p>
        </div>
      )}
    </div>
  )
}
