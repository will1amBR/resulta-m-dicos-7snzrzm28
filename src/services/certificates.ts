import pb from '@/lib/pocketbase/client'
import { CertificateStatus } from '@/types/clinical'

export const uploadDoctorCertificate = async (
  userId: string,
  file: File,
  targetStatus: CertificateStatus = 'pendente',
): Promise<any> => {
  const formData = new FormData()
  formData.append('certificate_file', file)
  formData.append('certificate_status', targetStatus)

  return await pb.collection('users').update(userId, formData)
}

export const updateCertificateStatus = async (
  userId: string,
  status: CertificateStatus,
): Promise<any> => {
  return await pb.collection('users').update(userId, {
    certificate_status: status,
  })
}

export const removeDoctorCertificate = async (userId: string): Promise<any> => {
  return await pb.collection('users').update(userId, {
    certificate_file: null,
    certificate_status: 'nao_enviado',
  })
}
