<template>
  <div class="app-container course-admin">
    <el-row :gutter="16" class="summary-row">
      <el-col :span="4" v-for="item in summaryCards" :key="item.label">
        <div class="summary-card">
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="course-tabs">
      <el-tab-pane label="课程管理" name="courses">
        <el-form :model="courseQuery" inline>
          <el-form-item label="阶段">
            <el-select v-model="courseQuery.stage" clearable placeholder="全部阶段" style="width: 140px">
              <el-option label="中考" value="zhongkao" />
              <el-option label="高考" value="gaokao" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="courseQuery.kind" clearable placeholder="全部类型" style="width: 140px">
              <el-option label="试听课" value="trial" />
              <el-option label="正式课" value="full" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadCourses">查询</el-button>
            <el-button icon="Refresh" @click="resetCourseQuery">重置</el-button>
            <el-button type="success" icon="Plus" @click="openCourseDialog()">新增课程</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="courseList" border>
          <el-table-column prop="sort" label="排序" width="70" />
          <el-table-column prop="courseName" label="课程名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="stage" label="阶段" width="90">
            <template #default="{ row }">{{ row.stage === 'gaokao' ? '高考' : '中考' }}</template>
          </el-table-column>
          <el-table-column prop="kind" label="类型" width="90">
            <template #default="{ row }">
              <el-tag :type="row.kind === 'full' ? 'success' : 'info'">{{ row.kind === 'full' ? '正式课' : '试听课' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开通方式" width="120">
            <template #default="{ row }">
              <el-tag :type="row.kind === 'full' ? 'success' : 'info'">{{ row.kind === 'full' ? '卡密开通' : '试听免费' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studyCount" label="学习人数" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'primary' : 'warning'">{{ row.status === 'published' ? '已发布' : '草稿' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="170">
            <template #default="{ row }">
              <el-button link type="primary" icon="Edit" @click="openCourseDialog(row)">编辑</el-button>
              <el-button link type="danger" icon="Delete" @click="removeCourse(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="资料管理" name="docs">
        <el-row class="toolbar-row">
          <el-button type="success" icon="Plus" @click="openDocDialog()">新增资料</el-button>
        </el-row>
        <el-table :data="docList" border>
          <el-table-column prop="title" label="资料名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="courseId" label="课程ID" width="150" />
          <el-table-column prop="fileType" label="类型" width="90" />
          <el-table-column prop="size" label="大小" width="90" />
          <el-table-column prop="visible" label="前端可见" width="100">
            <template #default="{ row }">
              <el-tag :type="row.visible ? 'success' : 'info'">{{ row.visible ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" icon="Edit" @click="openDocDialog(row)">编辑</el-button>
              <el-button link type="danger" icon="Delete" @click="removeDoc(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="题库管理" name="questions">
        <el-row class="toolbar-row">
          <el-button type="success" icon="Plus" @click="openQuestionDialog()">新增题目</el-button>
        </el-row>
        <el-table :data="questionList" border>
          <el-table-column prop="stem" label="题干" min-width="260" show-overflow-tooltip />
          <el-table-column prop="knowledge" label="知识点" width="140" />
          <el-table-column label="选项" min-width="220">
            <template #default="{ row }">{{ (row.options || []).join(' / ') }}</template>
          </el-table-column>
          <el-table-column prop="answer" label="答案序号" width="100" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" icon="Edit" @click="openQuestionDialog(row)">编辑</el-button>
              <el-button link type="danger" icon="Delete" @click="removeQuestion(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="授权开通" name="orders">
        <el-row :gutter="16">
          <el-col :span="10">
            <el-card shadow="never" class="admin-block">
              <template #header>用户</template>
              <el-table :data="userList" height="260">
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="phone" label="手机号" />
                <el-table-column prop="role" label="角色" width="90" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="14">
            <el-card shadow="never" class="admin-block">
              <template #header>手动开课</template>
              <el-form :model="orderForm" inline>
                <el-form-item label="用户ID">
                  <el-input v-model="orderForm.userId" placeholder="如 56596" style="width: 160px" />
                </el-form-item>
                <el-form-item label="课程ID">
                  <el-input v-model="orderForm.courseId" placeholder="如 gk-math-full" style="width: 180px" />
                </el-form-item>
                <el-form-item label="卡密">
                  <el-input v-model="orderForm.cardCode" placeholder="可选" style="width: 180px" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Plus" @click="submitOrder">开通课程</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="admin-block">
          <template #header>授权申请</template>
          <el-table :data="authList" border>
            <el-table-column prop="userName" label="申请人" width="120" />
            <el-table-column prop="userId" label="用户ID" width="120" />
            <el-table-column prop="courseId" label="课程ID" width="160" />
            <el-table-column prop="note" label="备注" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button link type="success" icon="Check" :disabled="row.status !== 'pending'" @click="handleAuth(row, 'approved')">通过</el-button>
                <el-button link type="danger" icon="Close" :disabled="row.status !== 'pending'" @click="handleAuth(row, 'rejected')">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" class="admin-block">
          <template #header>开通记录</template>
          <el-table :data="orderList" border>
            <el-table-column prop="id" label="记录号" min-width="160" />
            <el-table-column prop="userName" label="用户" width="120" />
            <el-table-column prop="courseTitle" label="课程" min-width="180" />
            <el-table-column prop="cardCode" label="卡密" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="success">{{ row.status === 'activated' ? '已开通' : row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="100" />
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="学习数据" name="study">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>练习记录</template>
              <el-table :data="studyData.attempts" height="260">
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="type" label="类型" width="100" />
                <el-table-column prop="score" label="分数" width="90" />
                <el-table-column prop="createdAt" label="时间" width="170" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>错题本</template>
              <el-table :data="studyData.wrongQuestions" height="260">
                <el-table-column prop="stem" label="题干" show-overflow-tooltip />
                <el-table-column prop="knowledge" label="知识点" width="120" />
                <el-table-column prop="mastered" label="掌握" width="80">
                  <template #default="{ row }">{{ row.mastered ? '是' : '否' }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>课时评价</template>
              <el-table :data="studyData.lessonRatings" height="260">
                <el-table-column prop="lessonTitle" label="课时" />
                <el-table-column prop="rating" label="星级" width="90" />
                <el-table-column prop="updatedAt" label="时间" width="170" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>AI 问答</template>
              <el-table :data="studyData.aiChats" height="260">
                <el-table-column prop="context" label="上下文" width="140" />
                <el-table-column prop="message" label="问题" show-overflow-tooltip />
                <el-table-column prop="createdAt" label="时间" width="170" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="courseOpen" :title="courseForm.id ? '编辑课程' : '新增课程'" width="720px" append-to-body>
      <el-form :model="courseForm" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="课程ID"><el-input v-model="courseForm.id" :disabled="!!editingCourseId" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="课程名称"><el-input v-model="courseForm.courseName" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="阶段">
              <el-select v-model="courseForm.stage" style="width: 100%">
                <el-option label="中考" value="zhongkao" />
                <el-option label="高考" value="gaokao" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="courseForm.kind" style="width: 100%">
                <el-option label="试听课" value="trial" />
                <el-option label="正式课" value="full" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="封面"><el-input v-model="courseForm.cover" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="courseForm.sort" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总讲数"><el-input-number v-model="courseForm.totalLessons" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-switch v-model="courseForm.status" active-value="published" inactive-value="draft" active-text="发布" inactive-text="草稿" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="简介"><el-input v-model="courseForm.introduction" type="textarea" :rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="courseOpen = false">取消</el-button>
        <el-button type="primary" @click="submitCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="docOpen" :title="docForm.id ? '编辑资料' : '新增资料'" width="620px" append-to-body>
      <el-form :model="docForm" label-width="90px">
        <el-form-item label="资料标题"><el-input v-model="docForm.title" /></el-form-item>
        <el-form-item label="课程ID"><el-input v-model="docForm.courseId" /></el-form-item>
        <el-form-item label="文件地址"><el-input v-model="docForm.fileUrl" /></el-form-item>
        <el-form-item label="文件类型"><el-input v-model="docForm.fileType" /></el-form-item>
        <el-form-item label="文件大小"><el-input v-model="docForm.size" /></el-form-item>
        <el-form-item label="前端可见"><el-switch v-model="docForm.visible" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="docOpen = false">取消</el-button>
        <el-button type="primary" @click="submitDoc">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="questionOpen" :title="questionForm.id ? '编辑题目' : '新增题目'" width="720px" append-to-body>
      <el-form :model="questionForm" label-width="90px">
        <el-form-item label="题干"><el-input v-model="questionForm.stem" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="选项"><el-input v-model="questionForm.optionsText" type="textarea" :rows="4" placeholder="每行一个选项" /></el-form-item>
        <el-form-item label="答案序号"><el-input-number v-model="questionForm.answer" :min="0" :max="9" /></el-form-item>
        <el-form-item label="知识点"><el-input v-model="questionForm.knowledge" /></el-form-item>
        <el-form-item label="解析"><el-input v-model="questionForm.analysis" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionOpen = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CourseManage">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addCourse,
  addOrder,
  deleteCourse,
  deleteDoc,
  deleteQuestion,
  getCourseDashboard,
  getStudyData,
  handleAuthRequest,
  listAuthRequests,
  listCourses,
  listDocs,
  listOrders,
  listQuestions,
  listUsers,
  saveDoc,
  saveQuestion,
  updateCourse
} from '@/api/course'

const activeTab = ref('courses')
const loading = ref(false)
const dashboard = reactive({})
const courseQuery = reactive({ stage: '', kind: '' })
const courseList = ref([])
const docList = ref([])
const questionList = ref([])
const userList = ref([])
const authList = ref([])
const orderList = ref([])
const studyData = reactive({
  attempts: [],
  wrongQuestions: [],
  lessonProgress: [],
  lessonRatings: [],
  aiChats: []
})

const courseOpen = ref(false)
const docOpen = ref(false)
const questionOpen = ref(false)
const editingCourseId = ref('')
const courseForm = reactive(defaultCourseForm())
const docForm = reactive(defaultDocForm())
const questionForm = reactive(defaultQuestionForm())
const orderForm = reactive({ userId: '56596', courseId: 'gk-math-full', cardCode: '' })

const summaryCards = computed(() => [
  { label: '课程数', value: dashboard.courseTotal || 0 },
  { label: '用户数', value: dashboard.userTotal || 0 },
  { label: '开通数', value: dashboard.orderTotal || 0 },
  { label: '待授权', value: dashboard.authPending || 0 },
  { label: '练习记录', value: dashboard.attemptTotal || 0 },
  { label: '待复盘错题', value: dashboard.wrongTotal || 0 }
])

onMounted(() => {
  loadAll()
})

async function loadAll() {
  await Promise.all([
    loadDashboard(),
    loadCourses(),
    loadDocsData(),
    loadQuestionsData(),
    loadUsersData(),
    loadAuthData(),
    loadOrdersData(),
    loadStudyData()
  ])
}

async function loadDashboard() {
  const res = await getCourseDashboard()
  Object.assign(dashboard, res.data || {})
}

async function loadCourses() {
  loading.value = true
  try {
    const res = await listCourses(courseQuery)
    courseList.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function loadDocsData() {
  const res = await listDocs()
  docList.value = res.data || []
}

async function loadQuestionsData() {
  const res = await listQuestions()
  questionList.value = res.data || []
}

async function loadUsersData() {
  const res = await listUsers()
  userList.value = res.data || []
}

async function loadAuthData() {
  const res = await listAuthRequests()
  authList.value = res.data || []
}

async function loadOrdersData() {
  const res = await listOrders()
  orderList.value = res.data || []
}

async function loadStudyData() {
  const res = await getStudyData()
  Object.assign(studyData, res.data || {})
}

function resetCourseQuery() {
  courseQuery.stage = ''
  courseQuery.kind = ''
  loadCourses()
}

function openCourseDialog(row) {
  editingCourseId.value = row ? row.id : ''
  Object.assign(courseForm, defaultCourseForm(), row || {})
  if (!courseForm.title && courseForm.courseName) {
    courseForm.title = courseForm.courseName.replace(/[《》]/g, '').replace('2026', '')
  }
  courseOpen.value = true
}

async function submitCourse() {
  const payload = { ...courseForm }
  if (!payload.id && editingCourseId.value) {
    payload.id = editingCourseId.value
  }
  if (editingCourseId.value) {
    await updateCourse(editingCourseId.value, payload)
  } else {
    await addCourse(payload)
  }
  ElMessage.success('课程已保存')
  courseOpen.value = false
  await Promise.all([loadCourses(), loadDashboard()])
}

async function removeCourse(row) {
  await ElMessageBox.confirm(`确认删除课程「${row.courseName}」吗？`, '提示', { type: 'warning' })
  await deleteCourse(row.id)
  ElMessage.success('课程已删除')
  await Promise.all([loadCourses(), loadDashboard()])
}

function openDocDialog(row) {
  Object.assign(docForm, defaultDocForm(), row || {})
  docOpen.value = true
}

async function submitDoc() {
  await saveDoc({ ...docForm })
  ElMessage.success('资料已保存')
  docOpen.value = false
  await loadDocsData()
}

async function removeDoc(row) {
  await ElMessageBox.confirm(`确认删除资料「${row.title}」吗？`, '提示', { type: 'warning' })
  await deleteDoc(row.id)
  ElMessage.success('资料已删除')
  await loadDocsData()
}

function openQuestionDialog(row) {
  Object.assign(questionForm, defaultQuestionForm(), row || {})
  questionForm.optionsText = row && row.options ? row.options.join('\n') : ''
  questionOpen.value = true
}

async function submitQuestion() {
  const payload = {
    ...questionForm,
    options: questionForm.optionsText.split('\n').map(item => item.trim()).filter(Boolean)
  }
  delete payload.optionsText
  await saveQuestion(payload)
  ElMessage.success('题目已保存')
  questionOpen.value = false
  await loadQuestionsData()
}

async function removeQuestion(row) {
  await ElMessageBox.confirm('确认删除该题目吗？', '提示', { type: 'warning' })
  await deleteQuestion(row.id)
  ElMessage.success('题目已删除')
  await loadQuestionsData()
}

async function handleAuth(row, status) {
  await handleAuthRequest(row.id, status)
  ElMessage.success(status === 'approved' ? '已通过授权' : '已拒绝授权')
  await Promise.all([loadAuthData(), loadDashboard()])
}

async function submitOrder() {
  if (!orderForm.userId || !orderForm.courseId) {
    ElMessage.warning('请填写用户ID和课程ID')
    return
  }
  await addOrder({ ...orderForm })
  ElMessage.success('课程已开通')
  await Promise.all([loadOrdersData(), loadDashboard()])
}

function defaultCourseForm() {
  return {
    id: '',
    stage: 'gaokao',
    kind: 'full',
    subject: '',
    full: '',
    title: '',
    courseName: '',
    introduction: '',
    cover: '',
    detailCover: '',
    studyCount: 0,
    totalLessons: 0,
    totalDuration: '',
    practiceDuration: '',
    status: 'published',
    sort: 0
  }
}

function defaultDocForm() {
  return {
    id: '',
    courseId: 'gk-math-full',
    title: '',
    fileUrl: '#',
    fileType: 'PDF',
    size: '',
    visible: true
  }
}

function defaultQuestionForm() {
  return {
    id: '',
    stem: '',
    optionsText: '',
    answer: 0,
    analysis: '',
    knowledge: ''
  }
}
</script>

<style scoped>
.course-admin {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.summary-row {
  margin-bottom: 16px;
}

.summary-card {
  height: 86px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7eaf0;
}

.summary-label {
  color: #697386;
  font-size: 13px;
}

.summary-value {
  margin-top: 10px;
  color: #1f2937;
  font-size: 26px;
  font-weight: 700;
}

.course-tabs {
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7eaf0;
}

.toolbar-row {
  margin-bottom: 12px;
}

.admin-block {
  margin-bottom: 16px;
  border-radius: 8px;
}
</style>
