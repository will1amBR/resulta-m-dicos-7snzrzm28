import { useState, useEffect, useRef } from 'react'
import {
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  MessageSquare,
  Loader2,
  Wifi,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyAppointments } from '@/services/patient-portal'
import { getTeleconsultaMessages, sendTeleconsultaMessage } from '@/services/teleconsulta'
import { Appointment, TeleconsultaMessage } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import { useWebRTC } from '@/hooks/use-webrtc'

export default function PatientTeleconsulta() {
  const { user } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loadingAppt, setLoadingAppt] = useState(true)
  const [messages, setMessages] = useState<
    Array<{ id?: string; sender: string; text: string; sender_role?: string }>
  >([{ sender: 'Sistema', text: 'Sala virtual segura estabelecida.' }])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const navigate = useNavigate()

  // WebRTC real integration
  const {
    localStream,
    remoteStream,
    peerState,
    isMicActive,
    isCameraActive,
    mediaError,
    hasRemoteVideo,
    toggleMic,
    toggleCamera,
    makeOffer,
    endCall,
  } = useWebRTC({
    appointmentId: appointment?.id || null,
    myRole: 'patient',
    enabled: Boolean(appointment?.id),
  })

  // Atribuir os streams de vídeo às tags HTML5 <video>
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // 1. Cronômetro da chamada
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll do chat ao receber ou enviar mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 2. Buscar a consulta ativa do paciente ao entrar
  useEffect(() => {
    let isMounted = true

    const loadActiveAppointment = async () => {
      const patientId = user?.patient_link || user?.id
      if (!patientId) {
        setLoadingAppt(false)
        return
      }

      try {
        const appts = await getMyAppointments(patientId)
        if (!isMounted) return

        // Procurar consulta em andamento, ou confirmada/agendada de hoje, ou a mais recente
        const active =
          appts.find((a) => a.status === 'em_andamento') ||
          appts.find((a) => a.status === 'confirmada') ||
          appts.find((a) => a.status === 'agendada') ||
          appts[0] ||
          null

        setAppointment(active)

        if (active) {
          const dbMsgs = await getTeleconsultaMessages(active.id)
          if (!isMounted) return

          if (dbMsgs.length > 0) {
            setMessages(
              dbMsgs.map((m) => ({
                id: m.id,
                sender: m.sender,
                text: m.text,
                sender_role: m.sender_role,
              })),
            )
          } else {
            // Se ainda não existirem mensagens no banco, envia a mensagem do sistema
            try {
              const initMsg = await sendTeleconsultaMessage({
                appointment: active.id,
                sender: 'Sistema',
                sender_name: 'Sistema Resulta',
                sender_role: 'system',
                text: 'Sala virtual segura estabelecida.',
              })
              if (isMounted) {
                setMessages([
                  {
                    id: initMsg.id,
                    sender: initMsg.sender,
                    text: initMsg.text,
                    sender_role: initMsg.sender_role,
                  },
                ])
              }
            } catch {
              // fallback local
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar consulta:', err)
      } finally {
        if (isMounted) {
          setLoadingAppt(false)
        }
      }
    }

    loadActiveAppointment()

    return () => {
      isMounted = false
    }
  }, [user?.patient_link, user?.id])

  // 3. PocketBase Realtime (SSE) subscription
  useRealtime<TeleconsultaMessage>(
    'teleconsulta_messages',
    (e) => {
      if (!appointment) return
      const record = e.record
      if (record.appointment !== appointment.id) return

      if (e.action === 'create') {
        setMessages((prev) => {
          // Evita duplicatas se já existe pelo id
          if (prev.some((m) => m.id === record.id)) return prev
          return [
            ...prev,
            {
              id: record.id,
              sender: record.sender,
              text: record.text,
              sender_role: record.sender_role,
            },
          ]
        })
      }
    },
    Boolean(appointment?.id),
  )

  // 4. Polling fallback a cada 2 segundos caso SSE tenha latência ou desconexão
  useEffect(() => {
    if (!appointment?.id) return

    const interval = setInterval(async () => {
      try {
        const latestMsgs = await getTeleconsultaMessages(appointment.id)
        if (latestMsgs.length > 0) {
          setMessages((prev) => {
            const map = new Map<
              string,
              { id?: string; sender: string; text: string; sender_role?: string }
            >()
            prev.forEach((m) => {
              if (m.id) map.set(m.id, m)
            })
            let changed = false
            latestMsgs.forEach((lm) => {
              if (!map.has(lm.id)) {
                changed = true
              }
            })
            if (changed || prev.length !== latestMsgs.length) {
              return latestMsgs.map((m) => ({
                id: m.id,
                sender: m.sender,
                text: m.text,
                sender_role: m.sender_role,
              }))
            }
            return prev
          })
        }
      } catch {
        // ignora erros pontuais de polling
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [appointment?.id])

  // 5. Envio de mensagem
  const handleSend = async () => {
    const text = chatInput.trim()
    if (!text || sending) return

    const patientName = user?.name || 'Paciente'

    if (appointment?.id) {
      setSending(true)
      try {
        const newMsg = await sendTeleconsultaMessage({
          appointment: appointment.id,
          sender: 'Paciente',
          sender_name: patientName,
          sender_role: 'patient',
          text,
        })
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [
            ...prev,
            {
              id: newMsg.id,
              sender: newMsg.sender,
              text: newMsg.text,
              sender_role: newMsg.sender_role,
            },
          ]
        })
        setChatInput('')
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err)
        // Fallback para estado local
        setMessages((prev) => [...prev, { sender: 'Paciente', text }])
        setChatInput('')
      } finally {
        setSending(false)
      }
    } else {
      // Se não há consulta ativa vinculada, mantém fallback de UI
      setMessages((prev) => [...prev, { sender: 'Paciente', text }])
      setChatInput('')
    }
  }

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)
      .toString()
      .padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 min-h-full w-full max-w-full flex flex-col lg:flex-row gap-4 bg-slate-900 text-white p-3 sm:p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden box-border">
      {/* Área Principal do Vídeo e Controles */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3 sm:gap-4 overflow-hidden">
        {/* Cabeçalho com informações da chamada */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-slate-100 truncate">
                Teleconsulta
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {loadingAppt
                  ? 'Carregando consulta...'
                  : appointment?.expand?.doctor?.name
                    ? `Médico: ${appointment.expand.doctor.name}`
                    : `Paciente: ${user?.name || 'Conectado'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo
            </span>
            <Badge
              variant="outline"
              className="bg-slate-950 text-emerald-300 border-slate-800 font-mono text-xs"
            >
              {formatTime(seconds)}
            </Badge>
          </div>
        </div>

        {/* Quadro Principal do Vídeo */}
        <div className="relative flex-1 min-h-[220px] sm:min-h-[300px] md:min-h-[360px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Vídeo Remoto (Médico) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover absolute inset-0 ${
              hasRemoteVideo ? 'block' : 'hidden'
            }`}
          />

          {/* Placeholder de espera se o médico não iniciou ou está conectando */}
          {!hasRemoteVideo && (
            <div className="text-center space-y-3 z-10 max-w-xs mx-auto p-4">
              <div className="relative mx-auto w-fit">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-emerald-500 shadow-lg flex items-center justify-center font-bold text-xl sm:text-2xl text-emerald-400 tracking-wider">
                  {appointment?.expand?.doctor?.name?.slice(0, 2).toUpperCase() || 'DR'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm sm:text-base text-slate-100 truncate">
                  {appointment?.expand?.doctor?.name || 'Dr(a). Responsável'}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      peerState === 'connected'
                        ? 'bg-emerald-500'
                        : peerState === 'connecting'
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {peerState === 'connected'
                      ? 'Conexão de Vídeo Estabelecida'
                      : peerState === 'connecting'
                        ? 'Conectando ao médico...'
                        : 'Aguardando início pelo médico...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Miniatura da Câmera Local (Paciente) PiP */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-28 h-20 sm:w-40 sm:h-28 max-w-[40%] max-h-[40%] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 transition-all flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isCameraActive && localStream ? 'block' : 'hidden'
              }`}
            />
            {(!isCameraActive || !localStream) && (
              <div className="flex flex-col items-center gap-1 text-center p-1">
                <CameraOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                <span className="text-[9px] sm:text-[10px] text-red-400 font-medium">
                  Câmera Desativada
                </span>
              </div>
            )}
            <div className="absolute top-1 left-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[9px] text-slate-200 font-medium border border-slate-700">
              Você (Paciente)
            </div>
          </div>

          {/* Status do microfone / conexão no canto superior */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300">
            <Wifi
              className={`h-3 w-3 ${
                peerState === 'connected'
                  ? 'text-emerald-400'
                  : peerState === 'connecting'
                    ? 'text-amber-400 animate-pulse'
                    : 'text-slate-500'
              }`}
            />
            <span className="capitalize">
              {peerState === 'connected'
                ? 'WebRTC Conectado'
                : isMicActive
                  ? 'Áudio Ativo'
                  : 'Áudio Mudo'}
            </span>
          </div>
        </div>

        {/* Barra de Controles Inferior */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-t border-slate-800/80 pt-3 shrink-0">
          <Button
            variant={isMicActive ? 'secondary' : 'destructive'}
            size="icon"
            onClick={toggleMic}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md"
            title={isMicActive ? 'Desativar microfone' : 'Ativar microfone'}
          >
            {isMicActive ? (
              <Mic className="h-5 w-5 text-slate-100" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant={isCameraActive ? 'secondary' : 'destructive'}
            size="icon"
            onClick={toggleCamera}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md"
            title={isCameraActive ? 'Desativar câmera' : 'Ativar câmera'}
          >
            {isCameraActive ? (
              <Camera className="h-5 w-5 text-slate-100" />
            ) : (
              <CameraOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              endCall()
              navigate('/patient')
            }}
            className="h-10 sm:h-11 px-4 sm:px-6 font-semibold text-xs sm:text-sm rounded-full shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" /> Encerrar
          </Button>
        </div>
      </div>

      {/* Barra Lateral do Chat */}
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

          {/* Lista de Mensagens com scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px] max-h-48 lg:max-h-[calc(100vh-320px)]">
            {messages.map((m, i) => {
              const isPatient = m.sender === 'Paciente' || m.sender_role === 'patient'
              const isSystem = m.sender === 'Sistema' || m.sender_role === 'system'
              return (
                <div
                  key={m.id || i}
                  className={`text-xs p-2.5 rounded-lg border leading-relaxed break-words ${
                    isPatient
                      ? 'bg-blue-950/40 border-blue-900/60 ml-3 text-blue-100'
                      : isSystem
                        ? 'bg-slate-900 border-slate-800 text-slate-300 italic text-[11px]'
                        : 'bg-slate-900 border-slate-800 mr-3 text-slate-200'
                  }`}
                >
                  <span
                    className={`font-semibold block text-[10px] mb-0.5 uppercase tracking-wider ${
                      isPatient
                        ? 'text-blue-300'
                        : isSystem
                          ? 'text-emerald-400'
                          : 'text-indigo-400'
                    }`}
                  >
                    {m.sender}
                  </span>
                  <span className="break-words">{m.text}</span>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input de Envio de Mensagem */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/80 shrink-0 mt-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={sending}
            className="text-xs h-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 flex-1 min-w-0"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!chatInput.trim() || sending}
            className="h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
