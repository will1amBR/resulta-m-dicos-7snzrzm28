import { useState, useEffect, useRef } from 'react'
import {
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Loader2,
  RefreshCw,
  Signal,
  Wifi,
} from 'lucide-react'
import { useActivePatient } from '@/contexts/active-patient-context'
import { useAuth } from '@/hooks/use-auth'
import { getTeleconsultaMessages, sendTeleconsultaMessage } from '@/services/teleconsulta'
import { getAppointments } from '@/services/appointments'
import { getPatients } from '@/services/patients'
import { Appointment, TeleconsultaMessage } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import { useWebRTC } from '@/hooks/use-webrtc'

export default function Teleconsulta() {
  const { activePatient, setActivePatient, activeAppointmentId, setActiveAppointmentId } =
    useActivePatient()
  const { user } = useAuth()
  const [currentAppt, setCurrentAppt] = useState<Appointment | null>(null)
  const [loadingAppt, setLoadingAppt] = useState(true)
  const [messages, setMessages] = useState<
    Array<{ id?: string; sender: string; text: string; sender_role?: string }>
  >([{ sender: 'Sistema', text: 'Sala virtual segura estabelecida conforme padrão CFM.' }])
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
    appointmentId: currentAppt?.id || null,
    myRole: 'doctor',
    enabled: Boolean(currentAppt?.id),
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

  // 2. Identificar consulta ativa do médico
  useEffect(() => {
    let isMounted = true

    const loadDoctorAppointment = async () => {
      try {
        const doctorId = user?.id
        const allAppts = await getAppointments(doctorId || undefined)
        if (!isMounted) return

        let foundAppt: Appointment | null = null

        // 1º: Se já existe activeAppointmentId no contexto
        if (activeAppointmentId) {
          foundAppt = allAppts.find((a) => a.id === activeAppointmentId) || null
        }

        // 2º: Se tem activePatient selecionado, buscar consulta vinculada a ele
        if (!foundAppt && activePatient?.id) {
          foundAppt =
            allAppts.find(
              (a) =>
                a.patient === activePatient.id &&
                (a.status === 'em_andamento' ||
                  a.status === 'confirmada' ||
                  a.status === 'agendada'),
            ) ||
            allAppts.find((a) => a.patient === activePatient.id) ||
            null
        }

        // 3º: Se ainda não encontrou, pegar a primeira consulta ativa do médico
        if (!foundAppt && allAppts.length > 0) {
          foundAppt =
            allAppts.find((a) => a.status === 'em_andamento') ||
            allAppts.find((a) => a.status === 'confirmada') ||
            allAppts.find((a) => a.status === 'agendada') ||
            allAppts[0]
        }

        if (foundAppt) {
          setCurrentAppt(foundAppt)
          if (!activeAppointmentId) {
            setActiveAppointmentId(foundAppt.id)
          }

          // Se o paciente do contexto estiver vazio, atualiza com os dados expandidos ou busca
          if (!activePatient && foundAppt.expand?.patient) {
            setActivePatient(foundAppt.expand.patient)
          } else if (!activePatient && foundAppt.patient) {
            const pts = await getPatients()
            const p = pts.find((pt) => pt.id === foundAppt!.patient)
            if (p && isMounted) setActivePatient(p)
          }

          // Carregar histórico de mensagens
          const dbMsgs = await getTeleconsultaMessages(foundAppt.id)
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
            try {
              const initMsg = await sendTeleconsultaMessage({
                appointment: foundAppt.id,
                sender: 'Sistema',
                sender_name: 'Sistema Resulta',
                sender_role: 'system',
                text: 'Sala virtual segura estabelecida conforme padrão CFM.',
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
        console.error('Erro ao carregar consulta no médico:', err)
      } finally {
        if (isMounted) {
          setLoadingAppt(false)
        }
      }
    }

    loadDoctorAppointment()

    return () => {
      isMounted = false
    }
  }, [user?.id, activePatient?.id, activeAppointmentId])

  // 3. PocketBase Realtime (SSE) subscription
  useRealtime<TeleconsultaMessage>(
    'teleconsulta_messages',
    (e) => {
      if (!currentAppt) return
      const record = e.record
      if (record.appointment !== currentAppt.id) return

      if (e.action === 'create') {
        setMessages((prev) => {
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
    Boolean(currentAppt?.id),
  )

  // 4. Polling fallback a cada 2 segundos caso SSE tenha interrupção
  useEffect(() => {
    if (!currentAppt?.id) return

    const interval = setInterval(async () => {
      try {
        const latestMsgs = await getTeleconsultaMessages(currentAppt.id)
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
        // ignora erros de polling
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentAppt?.id])

  // 5. Envio de mensagem pelo médico
  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || sending) return

    const doctorName = user?.name || 'Médico'

    if (currentAppt?.id) {
      setSending(true)
      try {
        const newMsg = await sendTeleconsultaMessage({
          appointment: currentAppt.id,
          sender: 'Médico',
          sender_name: doctorName,
          sender_role: 'doctor',
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
        setMessages((prev) => [...prev, { sender: 'Médico', text }])
        setChatInput('')
      } finally {
        setSending(false)
      }
    } else {
      setMessages((prev) => [...prev, { sender: 'Médico', text }])
      setChatInput('')
    }
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const patientDisplayName = activePatient
    ? activePatient.name
    : currentAppt?.expand?.patient?.name || (loadingAppt ? 'Carregando...' : 'Paciente Conectado')

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
              <p className="text-xs text-slate-400 truncate">Paciente: {patientDisplayName}</p>
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
        <div className="relative flex-1 min-h-[220px] sm:min-h-[300px] md:min-h-[360px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Vídeo Remoto (Paciente) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover absolute inset-0 ${
              hasRemoteVideo ? 'block' : 'hidden'
            }`}
          />

          {/* Placeholder se o vídeo do paciente ainda estiver conectando */}
          {!hasRemoteVideo && (
            <div className="text-center space-y-3 z-10 max-w-xs mx-auto p-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-emerald-500 shadow-lg mx-auto flex items-center justify-center font-bold text-xl sm:text-2xl text-emerald-400 tracking-wider">
                {patientDisplayName?.slice(0, 2).toUpperCase() || 'PA'}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm sm:text-base text-slate-100 truncate">
                  {patientDisplayName}
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
                      ? 'Áudio/Vídeo WebRTC Conectado'
                      : peerState === 'connecting'
                        ? 'Conectando Peer-to-Peer...'
                        : 'Aguardando paciente entrar...'}
                  </span>
                </div>
              </div>

              {peerState !== 'connected' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={makeOffer}
                  className="text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 mt-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Iniciar Conexão WebRTC
                </Button>
              )}
            </div>
          )}

          {/* Miniatura da Câmera Local (Médico) PiP */}
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
              Você (Médico)
            </div>
          </div>

          {/* Badge de status WebRTC no canto superior */}
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
                ? 'WebRTC P2P Seguro'
                : peerState === 'connecting'
                  ? 'Negociando P2P'
                  : 'Sinalização Pronta'}
            </span>
          </div>
        </div>

        {/* Controles de Chamada */}
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
            variant="secondary"
            size="icon"
            title="Compartilhar Tela"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-transform active:scale-95 shadow-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              endCall()
              navigate('/dashboard')
            }}
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
              const isDoctor = m.sender === 'Médico' || m.sender_role === 'doctor'
              const isSystem = m.sender === 'Sistema' || m.sender_role === 'system'
              return (
                <div
                  key={m.id || i}
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
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input do Chat */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/80 shrink-0 mt-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={sending}
            className="text-xs h-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 flex-1 min-w-0"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
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
