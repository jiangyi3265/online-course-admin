import request from '@/utils/request'

export function getCourseDashboard() {
  return request({
    url: '/course/admin/dashboard',
    method: 'get',
  })
}

export function listCourses(query) {
  return request({
    url: '/course/admin/courses',
    method: 'get',
    params: query,
  })
}

export function addCourse(data) {
  return request({
    url: '/course/admin/courses',
    method: 'post',
    data,
  })
}

export function updateCourse(id, data) {
  return request({
    url: `/course/admin/courses/${id}`,
    method: 'put',
    data,
  })
}

export function deleteCourse(id) {
  return request({
    url: `/course/admin/courses/${id}`,
    method: 'delete',
  })
}

export function listDocs() {
  return request({
    url: '/course/admin/docs',
    method: 'get',
  })
}

export function saveDoc(data) {
  const hasId = !!data.id
  return request({
    url: hasId ? `/course/admin/docs/${data.id}` : '/course/admin/docs',
    method: hasId ? 'put' : 'post',
    data,
  })
}

export function deleteDoc(id) {
  return request({
    url: `/course/admin/docs/${id}`,
    method: 'delete',
  })
}

export function listQuestions() {
  return request({
    url: '/course/admin/questions',
    method: 'get',
  })
}

export function saveQuestion(data) {
  const hasId = !!data.id
  return request({
    url: hasId ? `/course/admin/questions/${data.id}` : '/course/admin/questions',
    method: hasId ? 'put' : 'post',
    data,
  })
}

export function deleteQuestion(id) {
  return request({
    url: `/course/admin/questions/${id}`,
    method: 'delete',
  })
}

export function listUsers() {
  return request({
    url: '/course/admin/users',
    method: 'get',
  })
}

export function updateUserRole(id, data) {
  return request({
    url: `/course/admin/users/${id}/role`,
    method: 'put',
    data,
  })
}

export function listActivationCodes() {
  return request({
    url: '/course/admin/activation-codes',
    method: 'get',
  })
}

export function saveActivationCode(data) {
  const hasId = !!data.id
  return request({
    url: hasId ? `/course/admin/activation-codes/${data.id}` : '/course/admin/activation-codes',
    method: hasId ? 'put' : 'post',
    data,
  })
}

export function deleteActivationCode(id) {
  return request({
    url: `/course/admin/activation-codes/${id}`,
    method: 'delete',
  })
}

export function closeActivationCodeAuthorization(id) {
  return request({
    url: `/course/admin/activation-codes/${id}/close-authorization`,
    method: 'put',
  })
}

export function clearActivationStudyRecords(id) {
  return request({
    url: `/course/admin/activation-codes/${id}/clear-study-records`,
    method: 'post',
  })
}

export function activateCourseByCode(data) {
  return request({
    url: '/course/admin/activate',
    method: 'post',
    data,
  })
}

export function listAgencyStats() {
  return request({
    url: '/course/admin/agencies/summary',
    method: 'get',
  })
}

export function listAuthRequests() {
  return request({
    url: '/course/admin/auth-requests',
    method: 'get',
  })
}

export function handleAuthRequest(id, status) {
  return request({
    url: `/course/admin/auth-requests/${id}`,
    method: 'put',
    data: { status },
  })
}

export function listOrders() {
  return request({
    url: '/course/admin/orders',
    method: 'get',
  })
}

export function addOrder(data) {
  return request({
    url: '/course/admin/orders',
    method: 'post',
    data,
  })
}

export function closeOrder(id) {
  return request({
    url: `/course/admin/orders/${id}/close`,
    method: 'put',
  })
}

export function getAgencySummary(id) {
  return request({
    url: `/course/admin/agencies/${id}/summary`,
    method: 'get',
  })
}

export function getStudyData() {
  return request({
    url: '/course/admin/study',
    method: 'get',
  })
}

export function getFrontendSettings() {
  return request({
    url: '/course/admin/settings',
    method: 'get',
  })
}

export function saveFrontendSettings(data) {
  return request({
    url: '/course/admin/settings',
    method: 'post',
    data,
  })
}

export function listSubAccountPermissions() {
  return request({
    url: '/course/admin/sub-accounts/permissions',
    method: 'get',
  })
}

export function listSubAccounts() {
  return request({
    url: '/course/admin/sub-accounts',
    method: 'get',
  })
}

export function addSubAccount(data) {
  return request({
    url: '/course/admin/sub-accounts',
    method: 'post',
    data,
  })
}

export function updateSubAccount(id, data) {
  return request({
    url: `/course/admin/sub-accounts/${id}`,
    method: 'put',
    data,
  })
}

export function deleteSubAccount(id) {
  return request({
    url: `/course/admin/sub-accounts/${id}`,
    method: 'delete',
  })
}
