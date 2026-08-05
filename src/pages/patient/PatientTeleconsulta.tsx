import { useState, useEffect } from 'react'
import { Video, Mic, MicOff, Camera, CameraOff, PhoneOff, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getMyAppointments } from '@/services/patient-portal'
import { Appointment } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export default function PatientTeleconsulta() {
  const { user } = useAuth()
  const patientId = user?.patient_link
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'Sistema', text: 'Sala virtual segura estabelecida.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [seconds, setSeconds] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = () => {
    if (!chatInput.trim()) return
    setMessages((prev) => [...prev, { sender: 'Paciente', text: chatInput }])
    setChatInput('')
  }

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)
      .toString()
      .padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 bg-slate-900 text-white p-4 rounded-lg">
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-400" />
            <div>
              <h1 className="font-bold text-sm">Teleconsulta</h1>
              <p className="text-xs text-slate-400">Paciente: {user?.name || 'Conectado'}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-950 text-emerald-300 border-emerald-800">
            {formatTime(seconds)}
          </Badge>
        </div>

        <div className="relative flex-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-emerald-500 mx-auto flex items-center justify-center font-bold text-xl">
              {user?.name?.slice(0, 2).toUpperCase() || 'PA'}
            </div>
            <p className="font-medium text-sm text-slate-200">{user?.name || 'Paciente'}</p>
            <p className="text-xs text-slate-500">Transmissão Criptografada</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-slate-800 pt-3">
          <Button
            variant={micOn ? 'secondary' : 'destructive'}
            size="icon"
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={cameraOn ? 'secondary' : 'destructive'}
            size="icon"
            onClick={() => setCameraOn(!cameraOn)}
          >
            {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            onClick={() => navigate('/patient')}
            className="px-4 font-semibold text-xs"
          >
            <PhoneOff className="h-4 w-4 mr-2" /> Encerrar
          </Button>
        </div>
      </div>

      <div className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="space-y-2">
          <h2 className="font-bold text-xs text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <MessageSquare className="h-4 w-4 text-blue-400" /> Chat
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className="text-xs p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-blue-400 block text-[10px]">{m.sender}</span>
                <span className="text-slate-300">{m.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 pt-3">
          <Input
            placeholder="Mensagem..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs h-8 bg-slate-900 border-slate-800 text-white"
          />
          <Button
            size="sm"
            onClick={handleSend}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
