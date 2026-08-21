import pb from '@/lib/pocketbase/client'
import { InAppNotification } from '@/types/clinical'

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
