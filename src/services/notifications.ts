import pb from '@/lib/pocketbase/client'
import { InAppNotification } from '@/types/clinical'

/**
 * Service Worker & Notification API integration for Browser Push Notifications
 */

export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  silent?: boolean
}

const NOTIFICATION_PERMISSION_KEY = 'resulta_push_notifications_enabled'

/**
 * Check if the browser supports notifications
 */
export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Check if notifications are currently granted
 */
export const getPushPermissionState = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied'
  return Notification.permission
}

/**
 * Request notification permission from the user
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) return false
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true')
      return true
    }
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false')
    return false
  } catch (error) {
    console.error('Erro ao solicitar permissão de push notification:', error)
    return false
  }
}

/**
 * Check if push notifications are enabled by the user in settings/app
 */
export const isPushEnabled = (): boolean => {
  if (!isPushSupported()) return false
  return Notification.permission === 'granted'
}

/**
 * Send a native browser push notification
 */
export const sendBrowserNotification = (options: PushNotificationOptions): boolean => {
  if (!isPushSupported()) return false

  if (Notification.permission === 'granted') {
    try {
      const defaultIcon = '/og-image.png'
      const notif = new Notification(options.title, {
        body: options.body,
        icon: options.icon || defaultIcon,
        badge: options.badge || defaultIcon,
        tag: options.tag || 'resulta-notification',
        data: options.data,
        silent: options.silent || false,
      })

      notif.onclick = (event) => {
        event.preventDefault()
        window.focus()
        if (options.data?.url) {
          window.location.href = options.data.url
        }
      }

      return true
    } catch (e) {
      console.error('Falha ao disparar Notification:', e)
      return false
    }
  }

  return false
}

// -------------------------------------------------------------
// In-App Notifications & PocketBase Sync
// -------------------------------------------------------------

export const getMyNotifications = async (limit = 20): Promise<InAppNotification[]> => {
  if (!pb.authStore.isValid || !pb.authStore.record) return []
  try {
    const list = await pb.collection('notifications').getList<InAppNotification>(1, limit, {
      filter: `user = "${pb.authStore.record.id}"`,
      sort: '-created',
    })
    return list.items
  } catch {
    return []
  }
}

export const createNotification = async (data: {
  userId: string
  title: string
  message: string
  type?: 'warning' | 'info' | 'success' | 'certificate_alert' | 'prescription'
  link?: string
  pushToBrowser?: boolean
}): Promise<InAppNotification | null> => {
  try {
    const res = await pb.collection('notifications').create<InAppNotification>({
      user: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      read: false,
      link: data.link || '',
    })

    // Disparar Push Notification nativo no navegador se solicitado ou habilitado
    if (data.pushToBrowser !== false && isPushEnabled()) {
      sendBrowserNotification({
        title: data.title,
        body: data.message,
        tag: `notif-${res?.id || Date.now()}`,
        data: {
          url: data.link || '/dashboard',
        },
      })
    }

    return res
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return null
  }
}

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    await pb.collection('notifications').update(id, { read: true })
    return true
  } catch {
    return false
  }
}

export const markAllNotificationsAsRead = async (): Promise<void> => {
  if (!pb.authStore.isValid || !pb.authStore.record) return
  try {
    const unread = await pb.collection('notifications').getList<InAppNotification>(1, 50, {
      filter: `user = "${pb.authStore.record.id}" && read = false`,
    })
    await Promise.all(
      unread.items.map((item) => pb.collection('notifications').update(item.id, { read: true })),
    )
  } catch (err) {
    console.error('Erro ao marcar todas notificações:', err)
  }
}

/**
 * Triggers a browser push notification for specific medical workflow events:
 * 1. Nova consulta agendada
 * 2. Pedido de renovação de receita
 * 3. Alerta de interação medicamentosa de alto risco
 */
export const notifyAppointmentScheduled = (
  patientName: string,
  dateTime: string,
  doctorName?: string,
) => {
  const formattedDate = new Date(dateTime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  sendBrowserNotification({
    title: '📅 Nova Consulta Agendada!',
    body: `Consulta marcada para ${patientName} em ${formattedDate}${doctorName ? ` com ${doctorName}` : ''}.`,
    tag: 'appt-scheduled',
    data: { url: '/agenda' },
  })
}

export const notifyPrescriptionRenewalRequested = (patientName: string, medication: string) => {
  sendBrowserNotification({
    title: '💊 Pedido de Renovação de Receita',
    body: `${patientName} solicitou a renovação da receita para ${medication}. Clique para revisar.`,
    tag: 'rx-renewal',
    data: { url: '/doctor/receitas' },
  })
}

export const notifyMedicationInteractionAlert = (
  medication1: string,
  medication2: string,
  severity: 'high' | 'medium',
) => {
  sendBrowserNotification({
    title:
      severity === 'high'
        ? '⚠️ ALERTA CRÍTICO: Interação Medicamentosa'
        : '⚠️ Atenção: Interação Detectada',
    body: `Conflito detectado entre ${medication1} e ${medication2}. Verifique as recomendações no prontuário.`,
    tag: 'med-interaction',
    data: { url: '/prontuario' },
  })
}
