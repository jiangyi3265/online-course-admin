import request from '@/utils/request'

export function getCourseDashboard() {
  return request({
    url: '/course/admin/dashboard',
    method: 'get',
    headers: { isToken: false }
  })
}

export function listCourses(query) {
  return request({
    url: '/course/admin/courses',
    method: 'get',
    params: query,
    headers: { isToken: false }
  })
}

export function addCourse(data) {
  return request({
    url: '/course/admin/courses',
    method: 'post',
    data,
    headers: { isToken: false }
  })
}

export function updateCourse(id, data) {
  return request({
    url: `/course/admin/courses/${id}`,
    method: 'put',
    data,
    headers: { isToken: false }
  })
}

export function deleteCourse(id) {
  return request({
    url: `/course/admin/courses/${id}`,
    method: 'delete',
    headers: { isToken: false }
  })
}

export function listDocs() {
  return request({
    url: '/course/admin/docs',
    method: 'get',
    headers: { isToken: false }
  })
}

export function saveDoc(data) {
  const hasId = !!data.id
  return request({
    url: hasId ? `/course/admin/docs/${data.id}` : '/course/admin/docs',
    method: hasId ? 'put' : 'post',
    data,
    headers: { isToken: false }
  })
}

export function deleteDoc(id) {
  return request({
    url: `/course/admin/docs/${id}`,
    method: 'delete',
    headers: { isToken: false }
  })
}

export function listQuestions() {
  return request({
    url: '/course/admin/questions',
    method: 'get',
    headers: { isToken: false }
  })
}

export function saveQuestion(data) {
  const hasId = !!data.id
  return request({
    url: hasId ? `/course/admin/questions/${data.id}` : '/course/admin/questions',
    method: hasId ? 'put' : 'post',
    data,
    headers: { isToken: false }
  })
}

export function deleteQuestion(id) {
  return request({
    url: `/course/admin/questions/${id}`,
    method: 'delete',
    headers: { isToken: false }
  })
}

export function listUsers() {
  return request({
    url: '/course/admin/users',
    method: 'get',
    headers: { isToken: false }
  })
}

export function listAuthRequests() {
  return request({
    url: '/course/admin/auth-requests',
    method: 'get',
    headers: { isToken: false }
  })
}

export function handleAuthRequest(id, status) {
  return request({
    url: `/course/admin/auth-requests/${id}`,
    method: 'put',
    data: { status },
    headers: { isToken: false }
  })
}

export function listOrders() {
  return request({
    url: '/course/admin/orders',
    method: 'get',
    headers: { isToken: false }
  })
}

export function addOrder(data) {
  return request({
    url: '/course/admin/orders',
    method: 'post',
    data,
    headers: { isToken: false }
  })
}

export function getStudyData() {
  return request({
    url: '/course/admin/study',
    method: 'get',
    headers: { isToken: false }
  })
}
