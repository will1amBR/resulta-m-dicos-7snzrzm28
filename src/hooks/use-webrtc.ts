import { useEffect, useRef, useState, useCallback } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { sendTeleconsultaSignal, TeleconsultaSignal } from '@/services/teleconsulta_signals'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

interface UseWebRTCProps {
  appointmentId: string | null
  myRole: 'doctor' | 'patient'
  enabled?: boolean
}

export function useWebRTC({ appointmentId, myRole, enabled = true }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peerState, setPeerState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'failed'
  >('disconnected')
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [isMicActive, setIsMicActive] = useState(true)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const processedSignalsRef = useRef<Set<string>>(new Set())
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([])

  // Helper para criar ou retornar peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current
    }

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionRef.current = pc

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setPeerState('connected')
        } else if (pc.iceConnectionState === 'failed') {
          setPeerState('failed')
        } else if (pc.iceConnectionState === 'disconnected') {
          setPeerState('disconnected')
        } else if (pc.iceConnectionState === 'checking') {
          setPeerState('connecting')
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setPeerState('connected')
        } else if (pc.connectionState === 'failed') {
          setPeerState('failed')
        }
      }

      // Ao encontrar um candidato ICE local, envia para a outra ponta via PocketBase
      pc.onicecandidate = (event) => {
        if (event.candidate && appointmentId) {
          sendTeleconsultaSignal({
            appointment: appointmentId,
            sender_role: myRole,
            type: 'ice-candidate',
            payload: JSON.stringify(event.candidate.toJSON()),
          }).catch((err) => console.log('Erro ao enviar ICE candidate:', err))
        }
      }

      // Ao receber faixas de áudio/vídeo da outra ponta
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const rStream = event.streams[0]
          remoteStreamRef.current = rStream
          setRemoteStream(rStream)
          setHasRemoteVideo(rStream.getVideoTracks().length > 0)
        } else {
          // Fallback se vier track avulso
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream()
          }
          remoteStreamRef.current.addTrack(event.track)
          setRemoteStream(remoteStreamRef.current)
          setHasRemoteVideo(true)
        }
      }

      // Adicionar faixas locais existentes
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current!)
          } catch {
            /* intentionally ignored */
          }
        })
      }

      return pc
    } catch (e: any) {
      console.error('Falha ao inicializar RTCPeerConnection:', e)
      return null
    }
  }, [appointmentId, myRole])

  // Iniciar mídia local (Câmera + Microfone)
  useEffect(() => {
    if (!enabled) return
    let isMounted = true

    const startLocalMedia = async () => {
      try {
        setMediaError(null)
        // Tentativa de obter áudio e vídeo reais
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        localStreamRef.current = stream
        setLocalStream(stream)

        // Se o peer connection já existe, adiciona tracks
        if (peerConnectionRef.current) {
          stream.getTracks().forEach((track) => {
            try {
              peerConnectionRef.current?.addTrack(track, stream)
            } catch {
              /* intentionally ignored */
            }
          })
        }

        // Se formos o médico (iniciador padrão), pode anunciar "ready"
        if (appointmentId) {
          sendTeleconsultaSignal({
            appointment: appointmentId,
            sender_role: myRole,
            type: 'ready',
            payload: JSON.stringify({ ready: true }),
          }).catch(() => {})
        }
      } catch (err: any) {
        console.warn('Dispositivo de mídia real inacessível ou sem permissão:', err)
        setMediaError(err.message || 'Permissão de câmera/microfone negada')

        // Gerar stream simulado via canvas (áudio/vídeo sintético para testes em browsers sem webcam)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 640
          canvas.height = 480
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#0f172a'
            ctx.fillRect(0, 0, 640, 480)
            ctx.fillStyle = '#10b981'
            ctx.font = '24px sans-serif'
            ctx.fillText(`Vídeo Local (${myRole === 'doctor' ? 'Médico' : 'Paciente'})`, 40, 240)
          }
          const canvasStream = (canvas as any).captureStream
            ? (canvas as any).captureStream(15)
            : null
          if (canvasStream && isMounted) {
            localStreamRef.current = canvasStream
            setLocalStream(canvasStream)
          }
        } catch {
          /* intentionally ignored */
        }
      }
    }

    startLocalMedia()

    return () => {
      isMounted = false
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [enabled, appointmentId, myRole])

  // Iniciar oferta WebRTC (Médico geralmente inicia a oferta quando ambos estão na sala)
  const makeOffer = useCallback(async () => {
    if (!appointmentId) return
    const pc = createPeerConnection()
    if (!pc) return

    try {
      setPeerState('connecting')
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await pc.setLocalDescription(offer)

      await sendTeleconsultaSignal({
        appointment: appointmentId,
        sender_role: myRole,
        type: 'offer',
        payload: JSON.stringify(offer),
      })
    } catch (err) {
      console.error('Erro ao criar oferta WebRTC:', err)
    }
  }, [appointmentId, myRole, createPeerConnection])

  // Tratar sinal recebido do PocketBase Realtime
  const handleIncomingSignal = useCallback(
    async (signal: TeleconsultaSignal) => {
      if (!appointmentId || signal.appointment !== appointmentId) return
      // Ignora sinais enviados por nós mesmos
      if (signal.sender_role === myRole) return

      const signalKey = signal.id || `${signal.type}-${signal.created}`
      if (processedSignalsRef.current.has(signalKey)) return
      processedSignalsRef.current.add(signalKey)

      const pc = createPeerConnection()
      if (!pc) return

      try {
        if (signal.type === 'ready') {
          // Se o paciente entrou e nós somos o médico, podemos emitir a oferta WebRTC
          if (myRole === 'doctor') {
            await makeOffer()
          }
        } else if (signal.type === 'offer') {
          const offerDesc: RTCSessionDescriptionInit = JSON.parse(signal.payload)
          await pc.setRemoteDescription(new RTCSessionDescription(offerDesc))

          // Esvazia fila de candidatos ICE acumulados
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift()
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand))
            }
          }

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          await sendTeleconsultaSignal({
            appointment: appointmentId,
            sender_role: myRole,
            type: 'answer',
            payload: JSON.stringify(answer),
          })
        } else if (signal.type === 'answer') {
          const answerDesc: RTCSessionDescriptionInit = JSON.parse(signal.payload)
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answerDesc))
            // Esvazia fila de candidatos ICE acumulados
            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift()
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand))
              }
            }
          }
        } else if (signal.type === 'ice-candidate') {
          const candidateData: RTCIceCandidateInit = JSON.parse(signal.payload)
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidateData))
          } else {
            iceCandidatesQueueRef.current.push(candidateData)
          }
        } else if (signal.type === 'hangup') {
          setPeerState('disconnected')
          setRemoteStream(null)
          setHasRemoteVideo(false)
        }
      } catch (e) {
        console.warn('Erro ao processar sinal WebRTC:', e)
      }
    },
    [appointmentId, myRole, createPeerConnection, makeOffer],
  )

  // Escuta sinais em tempo real via SSE (coleção teleconsulta_signals)
  useRealtime<TeleconsultaSignal>(
    'teleconsulta_signals',
    (e) => {
      if (e.action === 'create' && e.record) {
        handleIncomingSignal(e.record)
      }
    },
    Boolean(appointmentId && enabled),
  )

  // Alternar microfone local
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      const nextState = !isMicActive
      audioTracks.forEach((t) => {
        t.enabled = nextState
      })
      setIsMicActive(nextState)
    }
  }, [isMicActive])

  // Alternar câmera local
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      const nextState = !isCameraActive
      videoTracks.forEach((t) => {
        t.enabled = nextState
      })
      setIsCameraActive(nextState)
    }
  }, [isCameraActive])

  // Encerrar chamada
  const endCall = useCallback(() => {
    if (appointmentId) {
      sendTeleconsultaSignal({
        appointment: appointmentId,
        sender_role: myRole,
        type: 'hangup',
        payload: JSON.stringify({ ended: true }),
      }).catch(() => {})
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    setPeerState('disconnected')
    setRemoteStream(null)
    setHasRemoteVideo(false)
  }, [appointmentId, myRole])

  return {
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
  }
}
