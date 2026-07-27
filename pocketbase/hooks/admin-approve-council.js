routerAdd(
  'PATCH',
  '/backend/v1/admin/users/{id}/approve-council',
  (e) => {
    const userId = e.request.pathValue('id')
    if (!userId) return e.badRequestError('user id is required')

    const authRecord = e.auth
    if (!authRecord) return e.unauthorizedError('auth required')

    const isSuperuser = e.hasSuperuserAuth()
    var isAdmin = false
    try {
      var roleVal = authRecord.get('role')
      if (typeof roleVal === 'string' && roleVal.toLowerCase() === 'admin') isAdmin = true
    } catch (_) {}

    if (!isSuperuser && !isAdmin) {
      return e.forbiddenError('only admins can approve council registrations')
    }

    try {
      var record = $app.findRecordById('users', userId)
      record.set('council_approved', true)
      $app.save(record)
      return e.json(200, { success: true, message: 'Council registration approved' })
    } catch (err) {
      return e.notFoundError('user not found')
    }
  },
  $apis.requireAuth(),
)
