import { useState, useEffect } from 'react'
import {
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  PhoneOff,
  MessageSquare,
} from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export default function Teleconsulta() {
  const { activePatient } = useActivePatient()
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'Sistema', text: 'Sala virtual segura estabelecida conforme padrão CFM.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [seconds, setSeconds] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    setMessages((prev) => [...prev, { sender: 'Médico', text: chatInput.trim() }])
    setChatInput('')
  }

  return (
    <div className="flex-1 min-h-full w-full max-w-full flex flex-col lg:flex-row gap-4 bg-slate-900 text-white p-3 sm:p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden box-border">
      {/* Área Principal do Vídeo e Controles */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3 sm:gap-4 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-slate-100 truncate">
                Teleconsulta Resulta
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Paciente: {activePatient ? activePatient.name : 'Simulação de Atendimento'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              CFM em Conformidade
            </span>
            <Badge
              variant="outline"
              className="bg-slate-950 text-emerald-300 border-slate-800 font-mono text-xs"
            >
              {formatTime(seconds)}
            </Badge>
          </div>
        </div>

        {/* Quadro Principal do Vídeo com PiP seguro */}
        <div className="relative flex-1 min-h-[220px] sm:min-h-[300px] md:min-h-[360px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
          <div className="text-center space-y-3 z-10 max-w-xs mx-auto">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-emerald-500 shadow-lg mx-auto flex items-center justify-center font-bold text-xl sm:text-2xl text-emerald-400 tracking-wider">
              {activePatient?.name?.slice(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm sm:text-base text-slate-100 truncate">
                {activePatient?.name || 'Paciente Conectado'}
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                Transmissão Criptografada de Vídeo
              </p>
            </div>
          </div>

          {/* Miniatura da Câmera Local (PiP responsivo e contido) */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-24 h-18 sm:w-36 sm:h-24 max-w-[35%] max-h-[35%] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl flex flex-col items-center justify-center p-1.5 z-20 transition-all">
            {cameraOn ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-800 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                  VOCÊ
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-300 font-medium truncate max-w-full px-1">
                  Câmera Local
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <CameraOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                <span className="text-[9px] sm:text-[10px] text-red-400 font-medium truncate max-w-full px-1">
                  Desativada
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Chamada */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-t border-slate-800/80 pt-3 shrink-0">
          <Button
            variant={micOn ? 'secondary' : 'destructive'}
            size="icon"
            onClick={() => setMicOn(!micOn)}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md"
            title={micOn ? 'Desativar microfone' : 'Ativar microfone'}
          >
            {micOn ? <Mic className="h-5 w-5 text-slate-100" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={cameraOn ? 'secondary' : 'destructive'}
            size="icon"
            onClick={() => setCameraOn(!cameraOn)}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md"
            title={cameraOn ? 'Desativar câmera' : 'Ativar câmera'}
          >
            {cameraOn ? (
              <Camera className="h-5 w-5 text-slate-100" />
            ) : (
              <CameraOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            title="Compartilhar Tela"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant="destructive"
            onClick={() => navigate('/dashboard')}
            className="h-10 sm:h-11 px-4 sm:px-6 font-semibold text-xs sm:text-sm rounded-full shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" /> Encerrar Teleconsulta
          </Button>
        </div>
      </div>

      {/* Chat Lateral */}
      <div className="w-full lg:w-80 lg:max-w-xs shrink-0 bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between min-w-0 max-h-[350px] lg:max-h-none overflow-hidden shadow-inner">
        <div className="flex flex-col min-h-0 flex-1 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
            <h2 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Chat da Consulta</span>
            </h2>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
            </span>
          </div>

          {/* Mensagens com scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px] max-h-48 lg:max-h-[calc(100vh-320px)]">
            {messages.map((m, i) => {
              const isDoctor = m.sender === 'Médico'
              const isSystem = m.sender === 'Sistema'
              return (
                <div
                  key={i}
                  className={`text-xs p-2.5 rounded-lg border leading-relaxed break-words ${
                    isDoctor
                      ? 'bg-blue-950/40 border-blue-900/60 ml-3 text-blue-100'
                      : isSystem
                        ? 'bg-slate-900 border-slate-800 text-slate-300 italic text-[11px]'
                        : 'bg-slate-900 border-slate-800 mr-3 text-slate-200'
                  }`}
                >
                  <span
                    className={`font-semibold block text-[10px] mb-0.5 uppercase tracking-wider ${
                      isDoctor ? 'text-blue-300' : isSystem ? 'text-emerald-400' : 'text-indigo-400'
                    }`}
                  >
                    {m.sender}
                  </span>
                  <span className="break-words">{m.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Input do Chat */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/80 shrink-0 mt-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="text-xs h-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 flex-1 min-w-0"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!chatInput.trim()}
            className="h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0 disabled:opacity-50"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
