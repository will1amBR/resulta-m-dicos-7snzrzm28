import pb from '@/lib/pocketbase/client'

export const getUnapprovedUsers = () =>
  pb.collection('users').getFullList({
    filter: 'council_approved = false',
    sort: '-created',
  })

export const getApprovedUsers = () =>
  pb.collection('users').getFullList({
    filter: 'council_approved = true',
    sort: '-created',
  })

export const approveUserCouncil = (userId: string) =>
  pb.send(`/backend/v1/admin/users/${userId}/approve-council`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
