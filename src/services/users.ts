import pb from '@/lib/pocketbase/client'

export const getUnapprovedUsers = () =>
  pb.collection('users').getFullList({
    filter: 'council_approved = false',
    sort: '-created',
  })

export const approveUser = (id: string) =>
  pb.collection('users').update(id, { council_approved: true })

export const getAllUsers = () => pb.collection('users').getFullList({ sort: '-created' })
