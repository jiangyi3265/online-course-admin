<template>
  <div class="app-container course-admin">
    <div class="summary-grid">
      <div class="summary-card" v-for="item in summaryCards" :key="item.label">
        <div class="summary-card-head">
          <div class="summary-label">{{ item.label }}</div>
          <el-tag v-if="item.badge" size="small" :type="item.badgeType || 'info'">{{ item.badge }}</el-tag>
        </div>
        <div class="summary-value">{{ item.value }}</div>
        <div v-if="item.sub" class="summary-sub">{{ item.sub }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="course-tabs">
      <el-tab-pane label="前端配置" name="frontend">
        <el-card shadow="never" class="admin-block">
          <template #header>
            <div class="block-head">
              <span>首页轮播图</span>
              <el-button type="primary" icon="Plus" @click="addHomeBanner">添加图片</el-button>
            </div>
          </template>
          <el-table :data="frontendSettings.homeBanners" border>
            <el-table-column label="预览" width="170">
              <template #default="{ row }">
                <el-image v-if="row.imageUrl" class="banner-preview" :src="row.imageUrl" fit="cover" />
                <span v-else class="muted-text">未设置</span>
              </template>
            </el-table-column>
            <el-table-column label="标题" min-width="160">
              <template #default="{ row }">
                <el-input v-model="row.title" placeholder="轮播图标题" />
              </template>
            </el-table-column>
            <el-table-column label="图片地址" min-width="380">
              <template #default="{ row }">
                <div class="banner-image-cell">
                  <image-upload
                    v-model="row.imageUrl"
                    class="banner-upload"
                    :limit="1"
                    :file-size="20"
                    :file-type="['png', 'jpg', 'jpeg', 'webp']"
                    :is-show-tip="false"
                    :drag="false"
                  />
                  <el-input v-model="row.imageUrl" placeholder="/static/home-banner.png 或 https://..." />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="跳转地址" min-width="240">
              <template #default="{ row }">
                <el-input v-model="row.linkUrl" placeholder="可选，例如 /pages/course-detail/course-detail?id=..." />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="0" style="width: 82px" />
              </template>
            </el-table-column>
            <el-table-column label="启用" width="90">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ $index }">
                <el-button link type="danger" icon="Delete" @click="removeHomeBanner($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>隐私政策</template>
              <el-form label-width="76px">
                <el-form-item label="标题">
                  <el-input v-model="frontendSettings.agreements.privacy.title" />
                </el-form-item>
                <el-form-item label="内容">
                  <AgreementEditor v-model="frontendSettings.agreements.privacy.content" />
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>用户协议</template>
              <el-form label-width="76px">
                <el-form-item label="标题">
                  <el-input v-model="frontendSettings.agreements.user.title" />
                </el-form-item>
                <el-form-item label="内容">
                  <AgreementEditor v-model="frontendSettings.agreements.user.content" />
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>

        <div class="settings-actions">
          <el-button type="primary" icon="Check" :loading="settingsSaving" @click="submitFrontendSettings">保存前端配置</el-button>
        </div>
      </el-tab-pane>

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
            <el-button type="success" icon="UploadFilled" @click="openCourseDialog()">上传课程</el-button>
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
          <el-table-column label="所属科目" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ courseLabel(row.courseId) }}</template>
          </el-table-column>
          <el-table-column label="分类" width="90">
            <template #default="{ row }">
              <el-tag :type="row.category === 'paper' ? 'warning' : 'primary'">{{ docCategoryLabel(row.category) }}</el-tag>
            </template>
          </el-table-column>
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
        <div class="question-stat-grid">
          <div class="question-stat-chip" v-for="item in questionStatChips" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <el-table :data="questionList" border>
          <el-table-column label="题干" min-width="300">
            <template #default="{ row }">
              <div class="question-preview-cell">
                <span class="question-preview-text">{{ row.stem || (row.stemImageUrl ? '图片题干' : '-') }}</span>
                <el-image
                  v-if="row.stemImageUrl"
                  class="question-thumb"
                  :src="row.stemImageUrl"
                  fit="cover"
                  :preview-src-list="[row.stemImageUrl]"
                  preview-teleported
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="题型" width="90">
            <template #default="{ row }">
              <el-tag :type="questionTypeTag(row)">{{ questionTypeLabel(row.questionType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属科目" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ questionSubjectLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="已绑定课程章节" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ questionBoundLabel(row) }}</template>
          </el-table-column>
          <el-table-column prop="difficulty" label="难度" width="90">
            <template #default="{ row }">{{ difficultyLabel(row.difficulty) }}</template>
          </el-table-column>
          <el-table-column prop="province" label="省份" width="110" />
          <el-table-column prop="knowledge" label="知识点" width="140" />
          <el-table-column label="题目内容" min-width="360">
            <template #default="{ row }">
              <div class="question-content-preview">
                <span>{{ questionContentSummary(row) }}</span>
                <div v-if="optionImageList(row).length" class="question-thumb-row">
                  <el-image
                    v-for="(url, index) in optionImageList(row)"
                    :key="`${url}-${index}`"
                    class="question-thumb"
                    :src="url"
                    fit="cover"
                    :preview-src-list="optionImageList(row)"
                    :initial-index="index"
                    preview-teleported
                  />
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="答案" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ questionAnswerLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="视频解析" width="100">
            <template #default="{ row }">
              <el-tag :type="row.videoAnalysisUrl ? 'success' : 'info'">{{ row.videoAnalysisUrl ? '已上传' : '暂无' }}</el-tag>
            </template>
          </el-table-column>
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
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>手动开课</template>
              <el-form :model="orderForm" label-width="96px" class="dense-form">
                <el-form-item label="用户ID">
                  <el-input v-model="orderForm.userId" placeholder="如 56596" @change="fillOrderUserInfo(orderForm)" />
                  <div class="field-hint">注册手机：{{ userPhone(orderForm.userId) || '未找到用户' }}</div>
                </el-form-item>
                <el-form-item label="课程">
                  <el-select v-model="orderForm.courseId" filterable placeholder="选择要开通的课程">
                    <el-option v-for="course in courseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="卡类型">
                  <el-select v-model="orderForm.cardType">
                    <el-option label="一年期" value="year" />
                    <el-option label="72小时" value="hours72" />
                    <el-option label="7天卡" value="days7" />
                  </el-select>
                </el-form-item>
                <el-form-item label="激活码">
                  <el-input v-model="orderForm.cardCode" placeholder="可选" />
                </el-form-item>
                <el-form-item label="学生名"><el-input v-model="orderForm.studentName" placeholder="必填" /></el-form-item>
                <el-form-item label="性别">
                  <el-select v-model="orderForm.gender" placeholder="必填">
                    <el-option v-for="item in genderOptions" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="最近分数"><el-input v-model="orderForm.recentExamScore" placeholder="必填" /></el-form-item>
                <el-form-item label="年级"><el-input v-model="orderForm.grade" placeholder="必填" /></el-form-item>
                <el-form-item label="学校"><el-input v-model="orderForm.schoolName" placeholder="必填" /></el-form-item>
                <el-form-item label="地区"><el-input v-model="orderForm.region" placeholder="省份+市，如贵州省贵阳市" /></el-form-item>
                <el-form-item class="form-actions">
                  <el-button type="primary" icon="Plus" :loading="orderSubmitting" @click="submitOrder">开通课程</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="admin-block">
              <template #header>后台激活码开通</template>
              <el-form :model="codeActivateForm" label-width="96px" class="dense-form">
                <el-form-item label="用户ID">
                  <el-input v-model="codeActivateForm.userId" @change="fillOrderUserInfo(codeActivateForm)" />
                  <div class="field-hint">注册手机：{{ userPhone(codeActivateForm.userId) || '未找到用户' }}</div>
                </el-form-item>
                <el-form-item label="激活码"><el-input v-model="codeActivateForm.code" placeholder="输入激活码" /></el-form-item>
                <el-form-item label="课程">
                  <el-select v-model="codeActivateForm.courseId" filterable clearable placeholder="可选，默认按激活码课程">
                    <el-option v-for="course in courseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="学生名"><el-input v-model="codeActivateForm.studentName" placeholder="必填" /></el-form-item>
                <el-form-item label="性别">
                  <el-select v-model="codeActivateForm.gender" placeholder="必填">
                    <el-option v-for="item in genderOptions" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="最近分数"><el-input v-model="codeActivateForm.recentExamScore" placeholder="必填" /></el-form-item>
                <el-form-item label="年级"><el-input v-model="codeActivateForm.grade" placeholder="必填" /></el-form-item>
                <el-form-item label="学校"><el-input v-model="codeActivateForm.schoolName" placeholder="必填" /></el-form-item>
                <el-form-item label="地区"><el-input v-model="codeActivateForm.region" placeholder="省份+市，如贵州省贵阳市" /></el-form-item>
                <el-form-item class="form-actions">
                  <el-button type="success" icon="Key" @click="submitCodeActivation">激活课程</el-button>
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
            <el-table-column label="课程" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ courseLabel(row.courseId) }}</template>
            </el-table-column>
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
          <template #header>后台记录查看</template>
          <el-tabs v-model="orderRecordTab">
            <el-tab-pane label="开通记录" name="orders">
              <el-table :data="orderList" border>
                <el-table-column prop="id" label="记录号" min-width="160" />
                <el-table-column prop="userName" label="用户" width="120" />
                <el-table-column prop="courseTitle" label="课程" min-width="180" />
                <el-table-column prop="cardCode" label="激活码" width="140" />
                <el-table-column prop="studentName" label="学生名" width="110" />
                <el-table-column prop="gender" label="性别" width="80" />
                <el-table-column prop="recentExamScore" label="最近分数" width="100" />
                <el-table-column prop="grade" label="年级" width="90" />
                <el-table-column prop="schoolName" label="学校" min-width="140" show-overflow-tooltip />
                <el-table-column prop="region" label="地区" min-width="140" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'activated' ? 'success' : 'info'">{{ row.status === 'activated' ? '已开通' : row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="来源" width="120" />
                <el-table-column prop="expiresAt" label="到期时间" width="170" />
                <el-table-column prop="createdAt" label="时间" width="180" />
                <el-table-column label="操作" fixed="right" width="110">
                  <template #default="{ row }">
                    <el-button link type="danger" :disabled="row.status !== 'activated'" @click="handleCloseOrder(row)">关闭权限</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="操作记录" name="operations">
              <el-table :data="adminOperationRecords" border>
                <el-table-column prop="type" label="类型" width="120" />
                <el-table-column prop="user" label="用户" width="150" />
                <el-table-column prop="course" label="课程" min-width="180" show-overflow-tooltip />
                <el-table-column prop="detail" label="操作内容" min-width="220" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="110" />
                <el-table-column prop="time" label="时间" width="180" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <el-form :model="userQuery" inline class="user-filter">
          <el-form-item label="关键词">
            <el-input v-model="userQuery.keyword" clearable placeholder="姓名 / 手机号 / ID" style="width: 220px" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="userQuery.role" clearable placeholder="全部角色" style="width: 150px">
              <el-option v-for="item in userRoleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="userQuery.status" clearable placeholder="全部状态" style="width: 140px">
              <el-option v-for="item in userStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="课程状态">
            <el-select v-model="userQuery.courseStatus" clearable placeholder="全部课程" style="width: 140px">
              <el-option v-for="item in userCourseStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button icon="Refresh" @click="resetUserQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="filteredUserList" border>
          <el-table-column type="expand" width="48">
            <template #default="{ row }">
              <div class="user-course-expand">
                <div v-if="!row.activatedCourses || !row.activatedCourses.length" class="muted-text">暂无开通课程</div>
                <div v-for="course in row.activatedCourses || []" :key="`${row.id}-${course.courseId || course.id}`" class="course-expand-item">
                  <strong>{{ course.courseTitle || course.title || course.courseName || course.courseId }}</strong>
                  <span>到期：{{ course.expiresAt || course.expiry || '-' }}</span>
                  <span>进度：{{ course.progress || '-' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="id" label="用户ID" width="130" show-overflow-tooltip />
          <el-table-column prop="name" label="姓名" min-width="130" show-overflow-tooltip />
          <el-table-column prop="phone" label="手机号" min-width="150" show-overflow-tooltip />
          <el-table-column label="账号类型" width="120">
            <template #default="{ row }">
              <el-tag :type="accountTypeTag(row)">{{ accountTypeText(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="150">
            <template #default="{ row }">
              {{ userRoleLabel(row.role) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="(row.status || 'active') === 'active' ? 'success' : 'danger'">{{ (row.status || 'active') === 'active' ? '正常' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="openCourseNames" label="开通课程" min-width="180" show-overflow-tooltip />
          <el-table-column prop="openedAt" label="开通时间" width="170" show-overflow-tooltip />
          <el-table-column prop="openedCardCode" label="开通激活码" width="150" show-overflow-tooltip />
          <el-table-column prop="expiresAt" label="课程到期" width="150" show-overflow-tooltip />
          <el-table-column prop="gender" label="性别" width="90" />
          <el-table-column prop="grade" label="年级" width="110" show-overflow-tooltip />
          <el-table-column prop="schoolName" label="学校名字" min-width="150" show-overflow-tooltip />
          <el-table-column prop="region" label="所在地区" min-width="140" show-overflow-tooltip />
          <el-table-column prop="recentExamScore" label="科目分数" width="110" />
          <el-table-column prop="organizationName" label="机构/归属" min-width="150" show-overflow-tooltip />
          <el-table-column prop="activationQuota" label="激活名额" width="120">
            <template #default="{ row }">
              <span v-if="row.role === 'agency_admin'">{{ row.activationQuota || 0 }}</span>
              <span v-else class="muted-text">仅分机构</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="180" show-overflow-tooltip />
          <el-table-column label="操作" fixed="right" width="170">
            <template #default="{ row }">
              <el-button link type="success" @click="showUserStats(row)">统计</el-button>
              <el-button link type="primary" @click="openUserEdit(row)">修改信息</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-card v-if="selectedUserStats" shadow="never" class="admin-block user-stats-panel">
          <template #header>{{ selectedUserStatsTitle }}</template>
          <div class="compact-stat-grid">
            <div class="agency-card" v-for="item in selectedUserStatCards" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <el-table v-if="selectedUserStats.type === 'agency'" :data="selectedUserStats.students || []" border>
            <el-table-column prop="studentName" label="绑定学生" />
            <el-table-column prop="subject" label="科目" />
            <el-table-column prop="region" label="地区" />
            <el-table-column prop="activatedAt" label="激活日期" width="180" />
          </el-table>
          <el-table v-else :data="selectedUserStats.courses || []" border>
            <el-table-column prop="courseTitle" label="已激活课程" min-width="180" />
            <el-table-column prop="progress" label="学习进度" width="110" />
            <el-table-column prop="attempts" label="练习次数" width="100" />
            <el-table-column prop="averageScore" label="平均分" width="100" />
            <el-table-column prop="expiresAt" label="到期时间" width="170" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="激活码管理" name="codes">
        <el-row :gutter="12" class="agency-cards">
          <el-col :span="4" v-for="item in activationSummaryCards" :key="item.label">
            <div class="agency-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </el-col>
        </el-row>

        <el-card shadow="never" class="admin-block">
          <template #header>激活码设置</template>
          <el-form :model="activationForm" inline>
            <el-form-item label="激活码"><el-input v-model="activationForm.code" :disabled="!!activationForm.id" placeholder="不填自动生成9位小写字母数字" style="width: 220px" /></el-form-item>
            <el-form-item label="课程">
              <el-select v-model="activationForm.courseId" filterable clearable placeholder="可选，激活时也可选择" style="width: 220px">
                <el-option v-for="course in courseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="activationForm.cardType" style="width: 150px">
                <el-option label="一年期" value="year" />
                <el-option label="72小时" value="hours72" />
                <el-option label="7天卡" value="days7" />
              </el-select>
            </el-form-item>
            <el-form-item label="归属账号ID">
              <el-select v-model="activationForm.ownerUserId" filterable clearable placeholder="可选账号ID/校区" style="width: 180px">
                <el-option v-for="item in agencyOwnerOptions" :key="item.id" :label="item.label" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="activationForm.status" style="width: 120px">
                <el-option label="可使用" value="available" />
                <el-option label="已锁定" value="disabled" />
                <el-option label="已使用" value="used" />
              </el-select>
            </el-form-item>
            <el-form-item><el-button type="primary" icon="Plus" @click="submitActivationCode">{{ activationForm.id ? '保存激活码' : '新增激活码' }}</el-button></el-form-item>
          </el-form>
        </el-card>

        <el-form :model="activationQuery" inline class="user-filter">
          <el-form-item label="关键词">
            <el-input v-model="activationQuery.keyword" clearable placeholder="激活码 / 课程 / 归属 / 学生" style="width: 260px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="activationQuery.status" clearable placeholder="全部状态" style="width: 140px">
              <el-option label="已关闭授权" value="closed" />
              <el-option label="已过期" value="expired" />
              <el-option label="可使用" value="available" />
              <el-option label="未分配" value="unassigned" />
              <el-option label="已分配" value="assigned" />
              <el-option label="已锁定" value="locked" />
              <el-option label="已使用" value="used" />
            </el-select>
          </el-form-item>
          <el-form-item label="归属账号/校区">
            <el-input v-model="activationQuery.owner" clearable placeholder="账号ID或校区" style="width: 160px" />
          </el-form-item>
        </el-form>

        <el-table :data="filteredActivationList" border>
          <el-table-column label="激活码" width="210">
            <template #default="{ row }">
              <div class="activation-code-cell">
                <span class="activation-code-text">{{ row.code }}</span>
                <el-button link type="primary" @click="copyActivationCode(row.code)">复制</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="课程" min-width="180">
            <template #default="{ row }">{{ row.courseTitle || (row.courseId ? courseLabel(row.courseId) : '激活时选择') }}</template>
          </el-table-column>
          <el-table-column prop="cardTypeText" label="类型" width="130" />
          <el-table-column prop="ownerUserId" label="归属ID" width="120" />
          <el-table-column prop="ownerName" label="归宿校区" width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="activationStatusTagType(row)">{{ activationStatusText(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="使用学生" width="120" />
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="activatedAt" label="激活日期" width="180" />
          <el-table-column prop="expiresAt" label="到期时间" width="180" />
          <el-table-column label="操作" fixed="right" width="280">
            <template #default="{ row }">
              <el-button v-if="canAssignActivation(row)" link type="primary" @click="openActivationAssign(row)">分配</el-button>
              <el-button link :type="isActivationLocked(row) ? 'success' : 'warning'" @click="toggleActivationLock(row)">{{ isActivationLocked(row) ? '解锁' : '锁定' }}</el-button>
              <el-button v-if="canUnassignActivation(row)" link type="info" @click="unassignActivationCode(row)">取消分配</el-button>
              <el-button v-if="row.status === 'used'" link type="danger" :disabled="row.authorizationClosed" @click="closeActivationAuthorization(row)">{{ row.authorizationClosed ? '已关闭授权' : '关闭授权' }}</el-button>
              <el-button v-else link type="danger" @click="removeActivationCode(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="校区管理" name="agencies">
        <el-table :data="agencyList" border>
          <el-table-column label="校区/机构" min-width="180">
            <template #default="{ row }">{{ row.agency?.organizationName || row.agency?.name || row.agency?.id }}</template>
          </el-table-column>
          <el-table-column label="账号ID" width="120">
            <template #default="{ row }">{{ row.agency?.id }}</template>
          </el-table-column>
          <el-table-column prop="quota" label="名额加减" width="160">
            <template #default="{ row }">
              <el-input-number :model-value="row.quota || 0" :min="0" size="small" controls-position="right" @change="value => updateAgencyQuota(row, value)" />
            </template>
          </el-table-column>
          <el-table-column prop="totalCodes" label="激活码" width="100" />
          <el-table-column prop="activatedCount" label="已激活" width="100" />
          <el-table-column prop="unusedCount" label="分配未使用" width="120" />
          <el-table-column prop="lockedCount" label="锁定" width="90" />
          <el-table-column prop="userCount" label="用户数" width="90" />
          <el-table-column label="操作" width="110">
            <template #default="{ row }">
              <el-button link type="primary" @click="showAgencyStats(row.agency)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-card v-if="selectedUserStats && selectedUserStats.type === 'agency'" shadow="never" class="admin-block user-stats-panel">
          <template #header>{{ selectedUserStatsTitle }}</template>
          <div class="compact-stat-grid">
            <div class="agency-card" v-for="item in selectedUserStatCards" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <el-table :data="selectedUserStats.students || []" border>
            <el-table-column prop="studentName" label="绑定学生" />
            <el-table-column prop="subject" label="科目" />
            <el-table-column prop="region" label="地区" />
            <el-table-column prop="activatedAt" label="激活日期" width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="后台记录查看" name="study">
        <el-card shadow="never" class="admin-block">
          <template #header>后台所有操作记录</template>
          <el-table :data="adminOperationRecords" border height="280">
            <el-table-column prop="type" label="操作类目" width="140" />
            <el-table-column prop="user" label="操作人（ID/名字）" width="180" />
            <el-table-column prop="course" label="课程/科目" min-width="180" show-overflow-tooltip />
            <el-table-column prop="detail" label="操作内容" min-width="220" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column prop="time" label="时间" width="180" />
          </el-table>
        </el-card>
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

      <el-tab-pane label="课程打分统计" name="ratings">
        <el-card shadow="never" class="admin-block rating-board">
          <template #header>
            <div class="rating-header">
              <span>课程打分评价统计</span>
              <span class="rating-hint">计算方式：所有条数对应星数相加 ÷ 所有条数</span>
            </div>
          </template>
          <el-table
            class="rating-course-table"
            :data="officialCourseRatingRows"
            border
            empty-text="暂无正式课程评分"
            :row-class-name="ratingCourseRowClassName"
            @row-click="showCourseRatingDetail"
          >
            <el-table-column prop="name" label="正式课程" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="showCourseRatingDetail(row)">详情查看</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="average" label="均星" width="90" />
            <el-table-column prop="total" label="数量" width="90" />
            <el-table-column v-for="star in ratingOptions" :key="star" :label="`${star}星`" width="80">
              <template #default="{ row }">{{ starCount(row, star) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card v-if="selectedRatingDetail" shadow="never" class="admin-block rating-detail-panel">
          <template #header>评分详情：{{ selectedRatingCourse?.name || '-' }}</template>
          <div class="rating-detail-grid">
            <div>
              <span>正式课程</span>
              <strong>{{ selectedRatingCourse?.name || '-' }}</strong>
            </div>
            <div>
              <span>课程小节</span>
              <strong>{{ selectedRatingDetail.lessonTitle || selectedRatingDetail.name }}</strong>
            </div>
            <div>
              <span>平均星级</span>
              <strong>{{ selectedRatingDetail.average || '0.0' }}星</strong>
            </div>
            <div v-for="group in selectedRatingDetail.scoreGroups || []" :key="group.range">
              <span>{{ group.label || group.range }}</span>
              <strong>{{ group.count || 0 }}次评分</strong>
            </div>
          </div>
        </el-card>

        <el-card v-if="selectedRatingCourse" shadow="never" class="admin-block">
          <template #header>课程小节评分统计：{{ selectedRatingCourse.name }}</template>
          <el-table :data="selectedRatingLessonRows" height="360" border empty-text="暂无该课程小节评分" @row-click="showRatingDetail">
            <el-table-column prop="lessonTitle" label="课程小节" min-width="220" show-overflow-tooltip />
            <el-table-column prop="average" label="均星" width="100" />
            <el-table-column prop="total" label="数量" width="100" />
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="showRatingDetail(row)">详情查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="外语词汇系统" name="vocabulary">
        <el-card shadow="never" class="admin-block">
          <template #header>外语词汇系统</template>
          <div class="empty-editor">预留模块，后续可接入词汇库、词汇练习与记忆统计。</div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="courseOpen" :title="courseForm.id ? '编辑课程' : '新增课程'" width="1120px" class="course-edit-dialog" append-to-body>
      <el-form :model="courseForm" label-width="96px" class="course-edit-form">
        <div class="course-edit-section base-section">
          <div class="section-title">课程基础信息</div>
          <el-row :gutter="18">
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
            <el-col :span="12">
              <el-form-item label="封面">
                <image-upload v-model="courseForm.cover" :limit="1" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="详情图">
                <image-upload v-model="courseForm.detailCover" :limit="1" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
              </el-form-item>
            </el-col>
            <el-col :span="6"><el-form-item label="排序"><el-input-number v-model="courseForm.sort" :min="0" style="width: 100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="课程节数"><el-input-number :model-value="computedLessonTotal" :min="0" disabled style="width: 100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="状态"><el-switch v-model="courseForm.status" active-value="published" inactive-value="draft" active-text="发布" inactive-text="草稿" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="简介"><el-input v-model="courseForm.introduction" type="textarea" :rows="3" /></el-form-item></el-col>
          </el-row>
        </div>

        <div class="course-edit-section content-section">
          <div class="content-toolbar">
            <div>
              <div class="section-title">课程内容编辑</div>
              <div class="section-subtitle">按课程模块录入章节、视频和题库，章节排序可直接填写数字。</div>
            </div>
            <div class="content-mode-actions">
              <el-button
                v-for="item in contentModes"
                :key="item.value"
                :type="contentMode === item.value ? 'primary' : 'default'"
                @click="switchContentMode(item.value)"
              >
                {{ item.buttonLabel || `添加【${item.label}】内容` }}
              </el-button>
            </div>
          </div>

          <div v-if="isLessonEditorMode" class="chapter-editor">
            <div class="chapter-sidebar">
              <div class="sidebar-head">
                <span>已建章节</span>
                <el-button type="primary" plain icon="Plus" @click="addCourseChapter">新建章节</el-button>
              </div>
              <div v-if="!activeChapters.length" class="empty-editor">暂无章节，点击“新建章节”开始录入。</div>
              <div
                v-for="(chapter, index) in activeChapters"
                :key="index"
                class="chapter-card"
                :class="{active: activeChapterIndex === index}"
                @click="activeChapterIndex = index"
              >
                <el-input-number v-model="chapter.sort" :min="1" controls-position="right" class="chapter-sort" />
                <el-input v-model="chapter.title" placeholder="输入章节名字" />
                <el-tooltip content="删除章节" placement="top">
                  <el-button text type="danger" icon="Delete" @click.stop="removeCourseChapter(index)" />
                </el-tooltip>
              </div>
            </div>

            <div class="chapter-main">
              <div v-if="activeChapter" class="lesson-editor">
                <div class="lesson-editor-head">
                  <div>
                    <strong>{{ activeChapter.title || '未命名章节' }}</strong>
                    <span>共 {{ activeLessons.length }} 个内容</span>
                  </div>
                  <el-button type="primary" icon="Plus" @click="addCourseLesson">增加章节内容</el-button>
                </div>

                <div v-if="!activeLessons.length" class="empty-editor">当前章节还没有内容。</div>
                <div v-for="(lesson, index) in activeLessons" :key="index" class="lesson-row">
                  <el-input v-model="lesson.title" placeholder="输入章节内容名称" class="lesson-title-input" />
                  <el-input-number v-model="lesson.sort" :min="1" controls-position="right" placeholder="排序" class="lesson-sort-input" />
                  <file-upload v-model="lesson.videoUrl" :limit="1" :file-size="1024" :file-type="['mp4', 'mov', 'm4v', 'webm']" />
                  <div class="lesson-question-cell">
                    <el-input v-model="lesson.questionBankName" placeholder="输入题库名称" class="question-bank-input" />
                    <div class="lesson-question-actions">
                      <el-button type="primary" plain @click="openQuestionPicker('lesson', lesson)">选择题库题目</el-button>
                      <el-tag v-if="questionCount(lesson)" type="info">已选 {{ questionCount(lesson) }} 题</el-tag>
                    </div>
                  </div>
                  <el-tooltip content="删除此节内容" placement="top">
                    <el-button text type="danger" icon="Delete" class="delete-icon-button" @click="removeCourseLesson(index)" />
                  </el-tooltip>
                </div>
              </div>
              <div v-else class="empty-editor large">请先新建或选择一个章节。</div>
            </div>
          </div>

          <div v-else class="knowledge-editor">
            <div class="knowledge-head">
              <div>
                <strong>{{ quizEditorTitle }}</strong>
                <span>{{ quizEditorHint }}</span>
              </div>
              <el-button type="primary" icon="Plus" @click="addCourseQuiz">添加题库</el-button>
            </div>
            <div v-if="!activeQuizList.length" class="empty-editor">暂无题库，可点击“添加题库”。</div>
            <div v-for="(quiz, index) in activeQuizList" :key="index" class="quiz-edit-row">
              <el-input v-model="quiz.name" placeholder="输入题库名称" />
              <el-input v-model="quiz.status" placeholder="显示状态，如：未学习" />
              <el-input v-model="quiz.action" placeholder="按钮文案，如：去测评" />
              <div class="quiz-question-cell">
                <el-button type="primary" plain @click="openQuestionPicker('quiz', quiz)">选择题库题目</el-button>
                <el-tag v-if="questionCount(quiz)" type="info">已选 {{ questionCount(quiz) }} 题</el-tag>
              </div>
              <el-tooltip content="删除题库" placement="top">
                <el-button text type="danger" icon="Delete" class="delete-icon-button" @click="removeCourseQuiz(index)" />
              </el-tooltip>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="courseOpen = false">取消</el-button>
        <el-button type="primary" @click="submitCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="docOpen" :title="docForm.id ? '编辑资料' : '新增资料'" width="620px" append-to-body>
      <el-form :model="docForm" label-width="90px">
        <el-form-item label="资料标题"><el-input v-model="docForm.title" /></el-form-item>
        <el-form-item label="所属科目">
          <el-select v-model="docForm.courseId" filterable placeholder="选择资料所属科目" style="width: 100%">
            <el-option v-for="course in courseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料分类">
          <el-select v-model="docForm.category" style="width: 100%">
            <el-option label="资料" value="lecture" />
            <el-option label="试卷" value="paper" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传文件">
          <file-upload v-model="docForm.fileUrl" :limit="1" :file-size="500" :file-type="['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'mov', 'm4v', 'webm', 'zip']" />
        </el-form-item>
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

    <el-dialog v-model="questionOpen" :title="questionForm.id ? '编辑题目' : '新增题目'" width="900px" class="question-edit-dialog" append-to-body>
      <el-form :model="questionForm" label-width="90px">
        <el-form-item label="题型类型">
          <el-radio-group v-model="questionForm.questionType" class="question-type-group">
            <el-radio-button v-for="item in questionTypeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
          <div class="field-hint">可填：选择题、填空题、主观题；复习测试和章节扫雷会按题型随机抽题。</div>
        </el-form-item>
        <el-form-item label="题干">
          <div class="question-media-editor">
            <div class="question-media-pane">
              <div class="pane-label">文字题干</div>
              <el-input v-model="questionForm.stem" type="textarea" :rows="4" placeholder="输入题干文字" />
            </div>
            <div class="question-media-pane upload-pane">
              <div class="pane-label">题干图片</div>
              <image-upload v-model="questionForm.stemImageUrl" :limit="1" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
            </div>
          </div>
        </el-form-item>
        <template v-if="questionForm.questionType === 'choice'">
          <el-form-item label="选项">
            <div class="question-media-editor">
              <div class="question-media-pane">
                <div class="pane-label">文字选项</div>
                <el-input v-model="questionForm.optionsText" type="textarea" :rows="4" placeholder="每行一个选项；如只有图片，可留空并按顺序上传图片" />
              </div>
              <div class="question-media-pane upload-pane">
                <div class="pane-label">选项图片</div>
                <image-upload v-model="questionForm.optionImageUrlsText" :limit="10" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
                <div class="field-hint">按上传顺序对应 A、B、C、D；无图片的选项可不上传。</div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="答案序号"><el-input-number v-model="questionForm.answer" :min="0" :max="9" /></el-form-item>
        </template>
        <el-form-item v-else label="参考答案">
          <div class="reference-answer-editor">
            <div class="reference-answer-pane">
              <div class="pane-label">手动输入</div>
              <el-input
                v-model="questionForm.answerText"
                type="textarea"
                :rows="questionForm.questionType === 'fill' ? 3 : 4"
                :placeholder="questionForm.questionType === 'fill' ? '多个可接受答案可换行，例如 2x / 2*x' : '填写主观题参考答案或评分要点'"
              />
            </div>
            <div class="reference-answer-pane upload-pane">
              <div class="pane-label">拍照上传（直接显示图片）</div>
              <image-upload v-model="questionForm.answerImageUrl" :limit="1" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="所属科目"><el-input v-model="questionForm.subjectName" placeholder="如：高考数学" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="知识点"><el-input v-model="questionForm.knowledge" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="难度"><el-input-number v-model="questionForm.difficulty" :min="1" :max="5" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="所属省份"><el-input v-model="questionForm.province" placeholder="如：贵州 / 浙江 / 全国" /></el-form-item></el-col>
        </el-row>
        <div class="question-course-bind">
          <div class="bind-title">植入已建课程题库</div>
          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="课程选择">
                <el-select v-model="questionForm.courseId" filterable clearable placeholder="选择课程" style="width: 100%" @change="resetQuestionCoursePath">
                  <el-option v-for="course in courseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="章节选择">
                <el-select v-model="questionForm.chapterKey" filterable clearable placeholder="选择章节" style="width: 100%" @change="resetQuestionLessonPath">
                  <el-option v-for="chapter in questionChapterOptions" :key="chapter.value" :label="chapter.label" :value="chapter.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="内容题库">
                <el-select v-model="questionForm.lessonKey" filterable clearable placeholder="选择章节内容题库" style="width: 100%">
                  <el-option v-for="lesson in questionLessonOptions" :key="lesson.value" :label="lesson.label" :value="lesson.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-button type="primary" plain @click="confirmQuestionCourseBind">确认加入</el-button>
        </div>
        <el-form-item label="解析"><el-input v-model="questionForm.analysis" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="图片解析">
          <image-upload v-model="questionForm.analysisImageUrl" :limit="1" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
        </el-form-item>
        <el-form-item label="视频解析">
          <file-upload v-model="questionForm.videoAnalysisUrl" :limit="1" :file-size="500" :file-type="['mp4', 'mov', 'm4v', 'webm']" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionOpen = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="questionPickerOpen" title="选择题库题目" width="1040px" class="question-picker-dialog" append-to-body>
      <div class="question-picker-filters">
        <el-input v-model="questionPickerKeyword" clearable placeholder="搜索题干 / 知识点" />
        <el-select v-model="questionPickerSubject" clearable filterable placeholder="所属科目">
          <el-option v-for="item in questionSubjectOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="questionPickerType" clearable placeholder="题目类型">
          <el-option v-for="item in questionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="questionPickerKnowledge" clearable filterable placeholder="知识点">
          <el-option v-for="item in questionKnowledgeOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="questionPickerProvince" clearable filterable placeholder="试卷省份">
          <el-option v-for="item in questionProvinceOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </div>
      <el-checkbox-group v-model="selectedQuestionIds" class="question-picker-list">
        <div v-for="question in filteredQuestionOptions" :key="question.id" class="question-option-row">
          <el-checkbox :label="question.id">
            <span class="question-option-stem">{{ question.stem || (question.stemImageUrl ? '图片题干' : '未填写题干') }}</span>
          </el-checkbox>
          <div v-if="question.stemImageUrl || optionImageList(question).length" class="question-option-images">
            <el-image
              v-if="question.stemImageUrl"
              class="question-picker-thumb"
              :src="question.stemImageUrl"
              fit="cover"
              :preview-src-list="[question.stemImageUrl]"
              preview-teleported
            />
            <el-image
              v-for="(url, index) in optionImageList(question)"
              :key="`${url}-${index}`"
              class="question-picker-thumb"
              :src="url"
              fit="cover"
              :preview-src-list="optionImageList(question)"
              :initial-index="index"
              preview-teleported
            />
          </div>
          <div class="question-option-meta">
            <el-tag size="small" :type="questionTypeTag(question)">{{ questionTypeLabel(question.questionType) }}</el-tag>
            <el-tag v-if="questionSubjectLabel(question) !== '-'" size="small" type="success">{{ questionSubjectLabel(question) }}</el-tag>
            <el-tag v-if="question.knowledge" size="small">{{ question.knowledge }}</el-tag>
            <el-tag v-if="question.province" size="small" type="info">{{ question.province }}</el-tag>
          </div>
        </div>
      </el-checkbox-group>
      <div v-if="!filteredQuestionOptions.length" class="empty-editor">没有匹配的题目。</div>
      <template #footer>
        <el-button @click="questionPickerOpen = false">取消</el-button>
        <el-button type="primary" @click="applyQuestionSelection">加入所选题目</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userEditOpen" title="修改用户信息" width="620px" append-to-body>
      <el-form :model="userEditForm" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="userEditForm.id" disabled />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="userEditForm.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号"><el-input v-model="userEditForm.phone" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="userEditForm.role" style="width: 100%">
                <el-option v-for="item in userRoleOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="userEditForm.status" style="width: 100%">
                <el-option v-for="item in userStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="课程到期"><el-date-picker v-model="userEditForm.expiresAt" value-format="YYYY-MM-DD" type="date" placeholder="选择到期日期" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="性别"><el-select v-model="userEditForm.gender" clearable style="width: 100%"><el-option v-for="item in genderOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="年级"><el-input v-model="userEditForm.grade" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="科目分数"><el-input v-model="userEditForm.recentExamScore" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="学校"><el-input v-model="userEditForm.schoolName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="地区"><el-input v-model="userEditForm.region" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="机构/校区"><el-input v-model="userEditForm.organizationName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="激活名额"><el-input-number v-model="userEditForm.activationQuota" :min="0" controls-position="right" style="width: 100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="userEditOpen = false">取消</el-button>
        <el-button type="primary" @click="submitUserEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="activationAssignOpen" title="分配激活码" width="520px" append-to-body>
      <el-form :model="activationAssignForm" label-width="96px">
        <el-form-item label="激活码">
          <el-input v-model="activationAssignForm.code" disabled />
        </el-form-item>
        <el-form-item label="归宿校区">
          <el-select v-model="activationAssignForm.ownerUserId" filterable placeholder="选择校区账号" style="width: 100%">
            <el-option v-for="item in agencyOwnerOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activationAssignOpen = false">取消</el-button>
        <el-button type="primary" @click="submitActivationAssign">确认分配</el-button>
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
  activateCourseByCode,
  closeActivationCodeAuthorization,
  closeOrder,
  deleteActivationCode,
  deleteCourse,
  deleteDoc,
  deleteQuestion,
  getAgencySummary,
  getCourseDashboard,
  getFrontendSettings,
  getStudyData,
  handleAuthRequest,
  listAgencyStats,
  listActivationCodes,
  listAuthRequests,
  listCourses,
  listDocs,
  listOrders,
  listQuestions,
  listUsers,
  saveActivationCode,
  saveDoc,
  saveFrontendSettings,
  saveQuestion,
  updateUserRole,
  updateCourse
} from '@/api/course'
import AgreementEditor from './components/AgreementEditor.vue'

const activeTab = ref('frontend')
const loading = ref(false)
const dashboard = reactive({})
const courseQuery = reactive({ stage: '', kind: '' })
const userQuery = reactive({ keyword: '', role: '', status: '', courseStatus: '' })
const courseList = ref([])
const courseOptionList = ref([])
const docList = ref([])
const questionList = ref([])
const userList = ref([])
const authList = ref([])
const orderList = ref([])
const activationList = ref([])
const agencyList = ref([])
const agencyStats = ref(null)
const studyData = reactive({
  attempts: [],
  wrongQuestions: [],
  lessonProgress: [],
  lessonRatings: [],
  aiChats: [],
  operationLogs: []
})
const settingsSaving = ref(false)
const frontendSettings = reactive(defaultFrontendSettings())

const courseOpen = ref(false)
const docOpen = ref(false)
const questionOpen = ref(false)
const userEditOpen = ref(false)
const activationAssignOpen = ref(false)
const editingCourseId = ref('')
const courseForm = reactive(defaultCourseForm())
const docForm = reactive(defaultDocForm())
const questionForm = reactive(defaultQuestionForm())
const userEditForm = reactive(defaultUserEditForm())
const orderSubmitting = ref(false)
const orderRecordTab = ref('orders')
const selectedUserStats = ref(null)
const selectedRatingCourseKey = ref('')
const selectedRatingDetailId = ref('')
const orderForm = reactive({ userId: '56596', courseId: 'gk-math-full', cardCode: '', cardType: 'year', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const codeActivateForm = reactive({ userId: '56596', code: '', courseId: '', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const activationQuery = reactive({ keyword: '', status: '', owner: '' })
const activationForm = reactive({ id: '', code: '', courseId: '', cardType: 'year', ownerUserId: '', status: 'available', remark: '' })
const activationAssignForm = reactive({ id: '', code: '', ownerUserId: '' })
const contentMode = ref('review')
const activeChapterIndex = ref(0)
const questionPickerOpen = ref(false)
const questionPickerTarget = ref(null)
const questionPickerKeyword = ref('')
const questionPickerSubject = ref('')
const questionPickerType = ref('')
const questionPickerKnowledge = ref('')
const questionPickerProvince = ref('')
const selectedQuestionIds = ref([])
const contentModes = [
  { label: '章节扫雷', value: 'chapterQuiz', buttonLabel: '添加章节扫雷内容' },
  { label: '复习加强课', value: 'review' },
  { label: '技巧绝招课', value: 'tactics' },
  { label: '知识巩固', value: 'knowledge' }
]
const questionTypeOptions = [
  { label: '选择题', value: 'choice' },
  { label: '填空题', value: 'fill' },
  { label: '主观题', value: 'subjective' }
]
const ratingOptions = [1, 2, 3, 4, 5]
const genderOptions = ['男', '女']
const userRoleOptions = [
  { label: '学生', value: 'student' },
  { label: '分机构', value: 'agency_admin' },
  { label: '管理员', value: 'admin' }
]
const userStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' }
]
const userCourseStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '已到期', value: 'expired' },
  { label: '未开通', value: 'none' }
]
const questionSubjectStats = ['高考数学', '高考语文', '高考英语', '高考物理', '高考化学', '高考政治', '高考历史', '高考生物', '高考地理', '中考语文', '中考数学', '中考英语', '中考物理', '中考化学']

const summaryCards = computed(() => [
  { label: '课程数', value: dashboard.courseTotal || 0, sub: `试听课程${courseStats.value.trial || 0}，正式课程${courseStats.value.full || 0}` },
  { label: '用户数', value: dashboard.userTotal || 0, sub: `正式学员${userStats.value.formalStudents || 0}，试用学员${userStats.value.trialStudents || 0}` },
  { label: '已锁定激活码', value: activationStats.value.locked || 0, sub: `未分配${activationStats.value.unassigned || 0}，已分配${activationStats.value.assigned || 0}` },
  { label: '课程开通人数', value: userStats.value.openPeopleCount || dashboard.orderTotal || 0, sub: `课程激活科目${activationStats.value.usedCourseCount || 0}` },
  { label: '分机构数量', value: userStats.value.agencyCount || agencyList.value.length || 0, sub: `有名额机构${userStats.value.agencyWithQuota || 0}` },
  { label: '已生成激活码', value: activationStats.value.generated || activationList.value.length || 0, sub: `已开通${activationStats.value.used || 0}，未开通${activationStats.value.available || 0}` },
  { label: '待授权', value: dashboard.authPending || 0, sub: `授权申请待处理` }
])
const ratingStats = computed(() => dashboard.ratingStats || {})
const activationStats = computed(() => dashboard.activationStats || {})
const courseStats = computed(() => dashboard.courseStats || {})
const userStats = computed(() => dashboard.userStats || {})
const ratingLessonRows = computed(() => ratingStats.value.details || ratingStats.value.lessons || [])
const selectedRatingCourse = computed(() => {
  if (!selectedRatingCourseKey.value) return null
  return officialCourseRatingRows.value.find(row => ratingCourseKey(row) === selectedRatingCourseKey.value) || null
})
const selectedRatingLessonRows = computed(() => ratingLessonRowsForCourse(selectedRatingCourse.value))
const selectedRatingDetail = computed(() => {
  const rows = selectedRatingLessonRows.value
  if (!selectedRatingCourse.value || !rows.length) return null
  if (!selectedRatingDetailId.value) return rows[0]
  return rows.find(item => ratingLessonKey(item) === selectedRatingDetailId.value) || rows[0]
})
const officialCourseRatingRows = computed(() => {
  const stats = ratingStats.value.courses || []
  const byId = new Map()
  const byName = new Map()
  stats.forEach(item => {
    if (item.id) byId.set(String(item.id), item)
    if (item.name) byName.set(String(item.name), item)
  })
  const rows = courseList.value
    .filter(course => (course.kind || 'full') === 'full')
    .map(course => {
      const name = cleanCourseName(course.courseName || course.title || course.id)
      const stat = byId.get(String(course.id)) || byName.get(name) || {}
      return {
        id: course.id,
        name,
        average: stat.average || '0.0',
        total: stat.total || 0,
        counts: stat.counts || {}
      }
    })
  stats.forEach(item => {
    if (!rows.some(row => String(row.id) === String(item.id) || row.name === item.name)) {
      rows.push(item)
    }
  })
  return rows
})
const activeUsedActivationCount = computed(() => activationList.value.filter(isActivationActiveUsed).length)
const expiredActivationCount = computed(() => activationList.value.filter(isActivationExpired).length)
const closedActivationCount = computed(() => activationList.value.filter(isActivationClosed).length)
const activationSummaryCards = computed(() => [
  { label: '已生成激活码', value: activationStats.value.generated || activationList.value.length || 0 },
  { label: '已分配激活码', value: activationStats.value.assigned || 0 },
  { label: '未分配激活码', value: activationStats.value.unassigned || 0 },
  { label: '已使用激活码', value: activationStats.value.used || 0 },
  { label: '正常在用激活码', value: activationStats.value.activeUsed ?? activeUsedActivationCount.value },
  { label: '已过期激活码', value: activationStats.value.expired ?? expiredActivationCount.value },
  { label: '已关闭授权激活码', value: activationStats.value.closedAuthorization ?? closedActivationCount.value },
  { label: '已分配未使用激活码', value: activationStats.value.assignedUnused || 0 },
  { label: '锁定不可用', value: activationStats.value.locked || 0 }
])
const filteredActivationList = computed(() => {
  const keyword = activationQuery.keyword.trim().toLowerCase()
  const owner = activationQuery.owner.trim().toLowerCase()
  return activationList.value.filter(item => {
    const text = `${item.code || ''} ${item.courseTitle || ''} ${item.ownerName || ''} ${item.ownerUserId || ''} ${item.studentName || ''}`.toLowerCase()
    const rowStatus = activationFilterStatus(item)
    const statusMatched = !activationQuery.status || rowStatus === activationQuery.status || (activationQuery.status === 'available' && isActivationAvailable(item))
    const ownerMatched = !owner || `${item.ownerUserId || ''} ${item.ownerName || ''}`.toLowerCase().includes(owner)
    return statusMatched && ownerMatched && (!keyword || text.includes(keyword))
  })
})
const filteredUserList = computed(() => {
  const keyword = userQuery.keyword.trim().toLowerCase()
  return userList.value.filter(user => {
    const text = `${user.id || ''} ${user.name || ''} ${user.phone || ''} ${user.organizationName || ''}`.toLowerCase()
    const roleMatched = !userQuery.role || user.role === userQuery.role
    const statusMatched = !userQuery.status || (user.status || 'active') === userQuery.status
    const courseStatusMatched = !userQuery.courseStatus || userCourseStatus(user) === userQuery.courseStatus
    const keywordMatched = !keyword || text.includes(keyword)
    return roleMatched && statusMatched && courseStatusMatched && keywordMatched
  })
})
const agencyOwnerOptions = computed(() => userList.value
  .filter(user => user.role === 'agency_admin')
  .map(user => ({
    id: user.id,
    label: `${user.organizationName || user.name || user.id}（${user.id}）`
  })))
const courseOptions = computed(() => (courseOptionList.value.length ? courseOptionList.value : courseList.value).map(course => ({
  ...course,
  optionLabel: `${cleanCourseName(course.courseName || course.title || course.id)}（${course.id}）`
})))
const questionStatChips = computed(() => {
  const list = [{ label: '总题目数', value: questionList.value.length }]
  questionTypeOptions.forEach(item => {
    list.push({ label: `${item.label}数`, value: questionList.value.filter(question => normalizeQuestionType(question.questionType) === item.value).length })
  })
  questionSubjectStats.forEach(label => {
    const normalized = label.replace(/\s/g, '')
    const value = questionList.value.filter(question => questionSubjectLabel(question).replace(/\s/g, '').includes(normalized)).length
    list.push({ label: `${label}题数`, value })
  })
  return list
})
const adminOperationRecords = computed(() => {
  return (studyData.operationLogs || []).map(log => ({
    type: log.type || '后台操作',
    user: log.user || '',
    course: log.course || '',
    detail: log.detail || '',
    status: log.status || '',
    time: log.time || ''
  })).sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
})
const selectedUserStatsTitle = computed(() => {
  if (!selectedUserStats.value) return ''
  return selectedUserStats.value.type === 'agency'
    ? `分机构统计：${selectedUserStats.value.name || selectedUserStats.value.agency?.name || ''}`
    : `学情统计：${selectedUserStats.value.name || ''}`
})
const selectedUserStatCards = computed(() => {
  const stats = selectedUserStats.value || {}
  if (stats.type === 'agency') {
    return [
      { label: '激活码总数', value: stats.totalCodes || 0 },
      { label: '未使用激活码', value: stats.unusedCount || 0 },
      { label: '已使用激活码', value: stats.activatedCount || 0 },
      { label: '开课人数', value: stats.openPeopleCount || stats.userCount || 0 },
      { label: '课程激活数量', value: stats.activatedCourseCount || 0 },
      { label: '推荐人数', value: stats.referralCount || 0 },
      { label: '绑定学生数', value: stats.boundStudentCount || stats.students?.length || 0 }
    ]
  }
  return [
    { label: '已激活课程', value: stats.courseCount || 0 },
    { label: '练习次数', value: stats.attemptCount || 0 },
    { label: '平均分', value: stats.averageScore || 0 },
    { label: '课时评分', value: stats.ratingCount || 0 },
    { label: '错题数量', value: stats.wrongCount || 0 },
    { label: '学习进度', value: stats.progressText || '暂无' }
  ]
})
const isLessonEditorMode = computed(() => ['review', 'tactics', 'knowledge'].includes(contentMode.value))
const activeVersionIndex = computed(() => contentMode.value === 'tactics' ? 1 : (contentMode.value === 'knowledge' ? 2 : 0))
const activeVersion = computed(() => isLessonEditorMode.value ? ensureCourseVersion(activeVersionIndex.value) : null)
const activeChapters = computed(() => activeVersion.value ? activeVersion.value.chapters : [])
const activeChapter = computed(() => activeChapters.value[activeChapterIndex.value] || null)
const activeLessons = computed(() => {
  if (!activeChapter.value) return []
  if (!Array.isArray(activeChapter.value.items)) activeChapter.value.items = []
  return activeChapter.value.items
})
const activeQuizList = computed(() => {
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
  return courseForm.quizzes
})
const quizEditorTitle = computed(() => '章节扫雷题库')
const quizEditorHint = computed(() => '用于课程内章节扫雷、阶段测评练习入口。')
const computedLessonTotal = computed(() => editableLessonCount(ensureCourseVersion(0).chapters || []))
const questionSubjectOptions = computed(() => uniqueQuestionSubjects())
const questionKnowledgeOptions = computed(() => uniqueQuestionField('knowledge'))
const questionProvinceOptions = computed(() => uniqueQuestionField('province'))
const filteredQuestionOptions = computed(() => {
  const keyword = questionPickerKeyword.value.trim().toLowerCase()
  const subject = String(questionPickerSubject.value || '').replace(/\s/g, '')
  return questionList.value.filter(question => {
    const text = `${question.stem || ''} ${question.knowledge || ''} ${question.province || ''} ${questionSubjectLabel(question)}`.toLowerCase()
    const questionSubject = String(questionSubjectLabel(question) || '').replace(/\s/g, '')
    const matchedKeyword = !keyword || text.includes(keyword)
    const matchedSubject = !subject || questionSubject === subject
    const matchedType = !questionPickerType.value || normalizeQuestionType(question.questionType) === questionPickerType.value
    const matchedKnowledge = !questionPickerKnowledge.value || question.knowledge === questionPickerKnowledge.value
    const matchedProvince = !questionPickerProvince.value || question.province === questionPickerProvince.value
    return matchedKeyword && matchedSubject && matchedType && matchedKnowledge && matchedProvince
  })
})
const questionChapterOptions = computed(() => {
  const course = courseById(questionForm.courseId)
  if (!course) return []
  return courseVersionChapters(course).map(item => ({
    value: chapterKey(item.versionIndex, item.chapterIndex),
    label: `${versionLabelForEditor(item.versionIndex)} / ${item.chapter.title || `第${item.chapterIndex + 1}章`}`
  }))
})
const questionLessonOptions = computed(() => {
  const path = selectedChapterPath(questionForm.chapterKey)
  if (!path) return []
  const course = courseById(questionForm.courseId)
  const chapter = courseVersionChapters(course).find(item => item.versionIndex === path.versionIndex && item.chapterIndex === path.chapterIndex)
  const items = Array.isArray(chapter?.chapter?.items) ? chapter.chapter.items : []
  return items.map((lesson, lessonIndex) => ({
    value: lessonKey(path.versionIndex, path.chapterIndex, lessonIndex),
    label: lesson.title || `章节内容${lessonIndex + 1}`
  }))
})

onMounted(() => {
  loadAll()
})

async function loadAll() {
  await Promise.all([
    loadDashboard(),
    loadCourseOptions(),
    loadCourses(),
    loadDocsData(),
    loadQuestionsData(),
    loadUsersData(),
    loadActivationData(),
    loadAgencyData(),
    loadAuthData(),
    loadOrdersData(),
    loadStudyData(),
    loadFrontendSettings()
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

async function loadCourseOptions() {
  const res = await listCourses({})
  courseOptionList.value = res.data || []
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

async function loadActivationData() {
  const res = await listActivationCodes()
  activationList.value = res.data || []
}

async function loadAgencyData() {
  const res = await listAgencyStats()
  agencyList.value = res.data || []
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

async function loadFrontendSettings() {
  const res = await getFrontendSettings()
  Object.assign(frontendSettings, mergeFrontendSettings(res.data || {}))
}

function defaultFrontendSettings() {
  return {
    homeBanners: [
      {
        id: 'banner-default',
        title: '首页主图',
        imageUrl: '/static/home-banner.png',
        linkUrl: '',
        sort: 1,
        enabled: true,
        remark: ''
      }
    ],
    agreements: {
      privacy: { type: 'privacy', title: '隐私政策', content: '请在后台配置隐私政策内容。' },
      user: { type: 'user', title: '用户协议', content: '请在后台配置用户协议内容。' }
    }
  }
}

function mergeFrontendSettings(data = {}) {
  const defaults = defaultFrontendSettings()
  return {
    homeBanners: Array.isArray(data.homeBanners) && data.homeBanners.length ? data.homeBanners.map(normalizeBannerForm) : defaults.homeBanners,
    agreements: {
      privacy: { ...defaults.agreements.privacy, ...(data.agreements?.privacy || {}) },
      user: { ...defaults.agreements.user, ...(data.agreements?.user || {}) }
    }
  }
}

function normalizeBannerForm(item = {}) {
  return {
    id: item.id || `banner-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: item.title || '首页轮播图',
    imageUrl: item.imageUrl || '',
    linkUrl: item.linkUrl || '',
    sort: Number(item.sort || 0),
    enabled: item.enabled !== false,
    remark: item.remark || ''
  }
}

function addHomeBanner() {
  frontendSettings.homeBanners.push(normalizeBannerForm({
    sort: frontendSettings.homeBanners.length + 1,
    enabled: true
  }))
}

function removeHomeBanner(index) {
  frontendSettings.homeBanners.splice(index, 1)
}

async function submitFrontendSettings() {
  const validBanners = frontendSettings.homeBanners.filter(item => String(item.imageUrl || '').trim())
  if (!validBanners.length) {
    ElMessage.warning('请至少配置一张首页轮播图')
    return
  }
  settingsSaving.value = true
  try {
    const payload = {
      homeBanners: validBanners.map(normalizeBannerForm),
      agreements: {
        privacy: { ...frontendSettings.agreements.privacy, type: 'privacy' },
        user: { ...frontendSettings.agreements.user, type: 'user' }
      }
    }
    const res = await saveFrontendSettings(payload)
    Object.assign(frontendSettings, mergeFrontendSettings(res.data || payload))
    ElMessage.success('前端配置已保存')
  } finally {
    settingsSaving.value = false
  }
}

function resetCourseQuery() {
  courseQuery.stage = ''
  courseQuery.kind = ''
  loadCourses()
}

function resetUserQuery() {
  userQuery.keyword = ''
  userQuery.role = ''
  userQuery.status = ''
  userQuery.courseStatus = ''
}

function userCourseStatus(user = {}) {
  if (user.courseStatus) return user.courseStatus
  const courses = Array.isArray(user.activatedCourses) ? user.activatedCourses : []
  if (courses.some(course => !isPastDate(course.expiresAt || course.expiry))) return 'active'
  if (courses.length || user.openCourseCount > 0 || user.openCourseNames || user.expiresAt) {
    return isPastDate(user.expiresAt) ? 'expired' : 'active'
  }
  return 'none'
}

async function copyActivationCode(code = '') {
  const text = String(code || '').trim()
  if (!text) {
    ElMessage.warning('暂无激活码可复制')
    return
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const input = document.createElement('textarea')
      input.value = text
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success('激活码已复制')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

function versionLabelForEditor(index) {
  return index === 0 ? '复习加强课' : (index === 1 ? '技巧绝招课' : '知识巩固')
}

function ensureCourseVersion(index) {
  if (!Array.isArray(courseForm.versions)) courseForm.versions = []
  while (courseForm.versions.length <= index) {
    courseForm.versions.push({ name: versionLabelForEditor(courseForm.versions.length), chapters: [] })
  }
  const version = courseForm.versions[index] || {}
  if (!version.name) version.name = versionLabelForEditor(index)
  if (!Array.isArray(version.chapters)) version.chapters = []
  courseForm.versions[index] = version
  return version
}

function normalizeCourseFormContent() {
  ensureCourseVersion(0)
  ensureCourseVersion(1)
  ensureCourseVersion(2)
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
  if (!Array.isArray(courseForm.knowledgeQuizzes)) courseForm.knowledgeQuizzes = []
  normalizeQuizList(courseForm.quizzes)
  normalizeQuizList(courseForm.knowledgeQuizzes)
  courseForm.versions.forEach((version, versionIndex) => {
    version.name = versionIndex === 0 ? '2026版' : (versionIndex === 1 ? '绝招课' : '知识巩固')
    if (!Array.isArray(version.chapters)) version.chapters = []
    version.chapters.forEach((chapter, chapterIndex) => {
      if (!chapter.title) chapter.title = `第${chapterIndex + 1}章`
      if (!chapter.sort) chapter.sort = chapterIndex + 1
      chapter.open = !!chapter.open
      if (!Array.isArray(chapter.items)) chapter.items = []
      chapter.items.forEach((lesson, lessonIndex) => {
        const labels = lessonChildLabels(versionIndex === 1 ? 'tactics' : (versionIndex === 2 ? 'knowledge' : 'review'))
        if (!lesson.title) lesson.title = `章节内容${lessonIndex + 1}`
        if (!lesson.sort) lesson.sort = lessonIndex + 1
        lesson.open = !!lesson.open
        if (!Array.isArray(lesson.questionIds)) lesson.questionIds = []
        if (!Array.isArray(lesson.children)) lesson.children = []
        if (!lesson.children[0]) lesson.children[0] = { name: labels.video, type: 1, total: 1, read: 0 }
        if (!lesson.children[1]) lesson.children[1] = { name: labels.practice, type: 2, total: 0, read: 0 }
        if (!lesson.children[0].name) lesson.children[0].name = labels.video
        if (!lesson.children[1].name) lesson.children[1].name = labels.practice
        if (lesson.videoUrl) lesson.children[0].videoUrl = lesson.videoUrl
        lesson.children[1].questionBankName = lesson.questionBankName || lesson.children[1].questionBankName || ''
        lesson.children[1].questionIds = lesson.questionIds
        lesson.children[1].total = lesson.questionIds.length || lesson.children[1].total || 0
      })
      chapter.items.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
    })
    version.chapters.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
  })
  courseForm.chapters = courseForm.versions[0].chapters
}

function switchContentMode(mode) {
  contentMode.value = mode
  activeChapterIndex.value = 0
  if (isLessonEditorMode.value) ensureCourseVersion(activeVersionIndex.value)
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
  if (!Array.isArray(courseForm.knowledgeQuizzes)) courseForm.knowledgeQuizzes = []
}

function normalizeQuizList(list = []) {
  list.forEach(quiz => {
    if (!Array.isArray(quiz.questionIds)) quiz.questionIds = []
    if (!quiz.status) quiz.status = '未学习'
    if (!quiz.action) quiz.action = '去测评'
  })
}

function addCourseChapter() {
  const version = ensureCourseVersion(activeVersionIndex.value)
  const next = version.chapters.length + 1
  version.chapters.push({ title: `新建章节${next}`, sort: next, open: true, items: [] })
  activeChapterIndex.value = version.chapters.length - 1
}

async function removeCourseChapter(index) {
  const version = ensureCourseVersion(activeVersionIndex.value)
  const chapter = version.chapters[index] || {}
  await ElMessageBox.confirm(`确认删除章节「${chapter.title || `第${index + 1}章`}」吗？`, '删除章节', { type: 'warning' })
  version.chapters.splice(index, 1)
  activeChapterIndex.value = Math.max(0, Math.min(activeChapterIndex.value, version.chapters.length - 1))
}

function addCourseLesson() {
  if (!activeChapter.value) addCourseChapter()
  const chapter = activeChapter.value
  if (!Array.isArray(chapter.items)) chapter.items = []
  const next = chapter.items.length + 1
  const labels = lessonChildLabels(contentMode.value)
  chapter.items.push({
    title: '',
    sort: next,
    open: false,
    videoUrl: '',
    questionBankName: '',
    questionIds: [],
    durationMinutes: 0,
    children: [
      { name: labels.video, type: 1, total: 1, read: 0 },
      { name: labels.practice, type: 2, total: 0, read: 0 }
    ]
  })
}

function lessonChildLabels(mode) {
  if (mode === 'tactics') return { video: '技巧绝招课', practice: '真题讲练' }
  if (mode === 'knowledge') return { video: '视频课程', practice: '巩固练习' }
  return { video: '知识点巩固', practice: '复习测试' }
}

async function removeCourseLesson(index) {
  if (!activeChapter.value || !Array.isArray(activeChapter.value.items)) return
  const lesson = activeChapter.value.items[index] || {}
  await ElMessageBox.confirm(`确认删除章节内容「${lesson.title || `第${index + 1}节`}」吗？`, '删除章节内容', { type: 'warning' })
  activeChapter.value.items.splice(index, 1)
}

function addCourseQuiz() {
  activeQuizList.value.push({ name: '', status: '未学习', action: '去测评', questionIds: [] })
}

async function removeCourseQuiz(index) {
  const list = activeQuizList.value
  const quiz = list[index] || {}
  await ElMessageBox.confirm(`确认删除题库「${quiz.name || `题库${index + 1}`}」吗？`, '删除题库', { type: 'warning' })
  list.splice(index, 1)
}

function questionCount(target = {}) {
  return Array.isArray(target.questionIds) ? target.questionIds.length : 0
}

function openQuestionPicker(type, target) {
  questionPickerTarget.value = { type, target }
  selectedQuestionIds.value = Array.isArray(target.questionIds) ? [...target.questionIds] : []
  questionPickerKeyword.value = ''
  questionPickerSubject.value = ''
  questionPickerType.value = ''
  questionPickerKnowledge.value = ''
  questionPickerProvince.value = ''
  questionPickerOpen.value = true
}

function applyQuestionSelection() {
  const picker = questionPickerTarget.value
  if (!picker || !picker.target) return
  picker.target.questionIds = [...selectedQuestionIds.value]
  if (picker.type === 'lesson' && !picker.target.questionBankName) {
    picker.target.questionBankName = `${activeChapter.value?.title || '章节'}题库`
  }
  if (picker.type === 'quiz' && !picker.target.name) {
    const first = questionList.value.find(question => selectedQuestionIds.value.includes(question.id))
    picker.target.name = first?.knowledge || '题库'
  }
  questionPickerOpen.value = false
}

function uniqueQuestionField(field) {
  return [...new Set(questionList.value.map(item => String(item[field] || '').trim()).filter(Boolean))]
}

function uniqueQuestionSubjects() {
  const subjects = new Set(questionSubjectStats)
  questionList.value.forEach(question => {
    const subject = String(questionSubjectLabel(question) || '').trim()
    if (subject && subject !== '-') subjects.add(subject)
  })
  return [...subjects]
}

function resetQuestionCoursePath() {
  questionForm.chapterKey = ''
  questionForm.lessonKey = ''
  questionForm.bindConfirmed = false
  const course = courseById(questionForm.courseId)
  if (course) {
    questionForm.subjectName = cleanCourseName(course.courseName || course.title || course.id)
    questionForm.courseTitle = course.courseName || course.title || course.id
  }
}

function resetQuestionLessonPath() {
  questionForm.lessonKey = ''
  questionForm.bindConfirmed = false
}

async function confirmQuestionCourseBind() {
  if (!questionForm.courseId || !questionForm.chapterKey || !questionForm.lessonKey) {
    ElMessage.warning('请先选择课程、章节和章节内容题库')
    return
  }
  applyQuestionBindLabels()
  questionForm.bindConfirmed = true
  if (questionForm.id) {
    await bindQuestionToCourseLesson(questionForm.id)
    ElMessage.success('题目已加入课程题库')
    await Promise.all([loadCourses(), loadCourseOptions()])
  } else {
    ElMessage.success('保存题目后会自动加入课程题库')
  }
}

function applyQuestionBindLabels() {
  const chapter = questionChapterOptions.value.find(item => item.value === questionForm.chapterKey)
  const lesson = questionLessonOptions.value.find(item => item.value === questionForm.lessonKey)
  const course = courseById(questionForm.courseId)
  questionForm.courseTitle = course ? (course.courseName || course.title || course.id) : ''
  if (course && !questionForm.subjectName) questionForm.subjectName = cleanCourseName(course.courseName || course.title || course.id)
  questionForm.chapterTitle = chapter ? chapter.label.replace(/^.* \/ /, '') : ''
  questionForm.lessonTitle = lesson ? lesson.label : ''
}

async function bindQuestionToCourseLesson(questionId) {
  if (!questionForm.bindConfirmed || !questionId || !questionForm.courseId || !questionForm.lessonKey) return
  const course = courseById(questionForm.courseId)
  const path = selectedLessonPath(questionForm.lessonKey)
  if (!course || !path) return
  const versions = Array.isArray(course.versions) ? course.versions : []
  const chapter = versions[path.versionIndex]?.chapters?.[path.chapterIndex]
  const lesson = chapter?.items?.[path.lessonIndex]
  if (!lesson) return
  if (!Array.isArray(lesson.questionIds)) lesson.questionIds = []
  if (!lesson.questionIds.includes(questionId)) lesson.questionIds.push(questionId)
  if (!lesson.questionBankName) lesson.questionBankName = questionForm.knowledge || '章节题库'
  if (!Array.isArray(lesson.children)) lesson.children = []
  if (!lesson.children[0]) lesson.children[0] = { name: '视频课程', type: 1, total: 1, read: 0 }
  if (!lesson.children[1]) lesson.children[1] = { name: '真题讲练', type: 2, total: 0, read: 0 }
  lesson.children[1].questionIds = lesson.questionIds
  lesson.children[1].questionBankName = lesson.questionBankName
  lesson.children[1].total = lesson.questionIds.length
  await updateCourse(course.id, JSON.parse(JSON.stringify(course)))
}

function courseById(courseId) {
  return [...courseOptionList.value, ...courseList.value].find(course => course.id === courseId)
}

function courseVersionChapters(course = {}) {
  const versions = Array.isArray(course.versions) ? course.versions : []
  return versions.flatMap((version, versionIndex) => {
    const chapters = Array.isArray(version.chapters) ? version.chapters : []
    return chapters.map((chapter, chapterIndex) => ({ versionIndex, chapterIndex, chapter }))
  })
}

function chapterKey(versionIndex, chapterIndex) {
  return `${versionIndex}:${chapterIndex}`
}

function lessonKey(versionIndex, chapterIndex, lessonIndex) {
  return `${versionIndex}:${chapterIndex}:${lessonIndex}`
}

function selectedChapterPath(value) {
  const parts = String(value || '').split(':').map(item => Number(item))
  if (parts.length < 2 || parts.some(item => !Number.isFinite(item))) return null
  return { versionIndex: parts[0], chapterIndex: parts[1] }
}

function selectedLessonPath(value) {
  const parts = String(value || '').split(':').map(item => Number(item))
  if (parts.length < 3 || parts.some(item => !Number.isFinite(item))) return null
  return { versionIndex: parts[0], chapterIndex: parts[1], lessonIndex: parts[2] }
}

function editableLessonCount(chapters = []) {
  return chapters.reduce((total, chapter) => {
    const items = Array.isArray(chapter.items) ? chapter.items : []
    return total + items.filter(item => item && item.title).length
  }, 0)
}

function coursePayloadForSave() {
  normalizeCourseFormContent()
  const payload = JSON.parse(JSON.stringify(courseForm))
  payload.totalLessons = editableLessonCount((payload.versions && payload.versions[0] && payload.versions[0].chapters) || payload.chapters || [])
  return payload
}

function userById(userId) {
  return userList.value.find(user => String(user.id || '') === String(userId || ''))
}

function userPhone(userId) {
  return userById(userId)?.phone || ''
}

function fillOrderUserInfo(form) {
  const user = userById(form.userId)
  if (!user) return
  if (!form.studentName) form.studentName = user.studentName || user.name || ''
  if (!form.gender) form.gender = user.gender || ''
  if (!form.recentExamScore) form.recentExamScore = user.recentExamScore || ''
  if (!form.grade) form.grade = user.grade || ''
  if (!form.schoolName) form.schoolName = user.schoolName || ''
  if (!form.region) form.region = user.region || ''
}

function hasMissingFields(form, fields) {
  return fields.some(field => String(form[field] || '').trim().length === 0)
}

async function saveUser(row) {
  await updateUserRole(row.id, {
    name: row.name,
    phone: row.phone,
    role: row.role || 'student',
    status: row.status || 'active',
    organizationName: row.organizationName || '',
    activationQuota: row.activationQuota || 0,
    gender: row.gender || '',
    grade: row.grade || '',
    schoolName: row.schoolName || '',
    region: row.region || '',
    recentExamScore: row.recentExamScore || '',
    expiresAt: row.expiresAt || '',
    remark: row.remark || ''
  })
  ElMessage.success('用户信息已保存')
  await Promise.all([loadUsersData(), loadDashboard(), loadAgencyData()])
}

function openUserEdit(row) {
  Object.assign(userEditForm, defaultUserEditForm(), {
    ...row,
    status: row.status || 'active',
    role: row.role || 'student',
    activationQuota: Number(row.activationQuota || 0),
    expiresAt: dateOnly(row.expiresAt)
  })
  userEditOpen.value = true
}

async function submitUserEdit() {
  if (!userEditForm.id) return
  await saveUser(userEditForm)
  userEditOpen.value = false
}

function openCourseDialog(row) {
  editingCourseId.value = row ? row.id : ''
  Object.assign(courseForm, defaultCourseForm(), row || {})
  if (!courseForm.title && courseForm.courseName) {
    courseForm.title = courseForm.courseName.replace(/[《》]/g, '').replace('2026', '')
  }
  normalizeCourseFormContent()
  contentMode.value = 'review'
  activeChapterIndex.value = 0
  courseOpen.value = true
}

async function submitCourse() {
  const payload = coursePayloadForSave()
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
  await Promise.all([loadCourses(), loadCourseOptions(), loadDashboard()])
}

async function removeCourse(row) {
  await ElMessageBox.confirm(`确认删除课程「${row.courseName}」吗？`, '提示', { type: 'warning' })
  await deleteCourse(row.id)
  ElMessage.success('课程已删除')
  await Promise.all([loadCourses(), loadCourseOptions(), loadDashboard()])
}

function openDocDialog(row) {
  Object.assign(docForm, defaultDocForm(), row || {})
  docOpen.value = true
}

async function submitDoc() {
  if (!docForm.courseId) {
    ElMessage.warning('请选择资料所属科目')
    return
  }
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
  questionForm.questionType = normalizeQuestionType(questionForm.questionType || (row && row.options && row.options.length ? 'choice' : 'choice'))
  questionForm.optionsText = row && row.options ? row.options.join('\n') : ''
  questionForm.stemImageUrl = row ? (row.stemImageUrl || row.questionImageUrl || row.stemImage || '') : ''
  questionForm.optionImageUrlsText = row ? mediaListText(row.optionImageUrls || row.optionImages || row.optionImageUrl) : ''
  questionForm.answerText = row ? (row.answerText || (questionForm.questionType === 'choice' ? '' : String(row.answer || ''))) : ''
  questionForm.bindConfirmed = false
  questionOpen.value = true
}

async function submitQuestion() {
  const questionType = normalizeQuestionType(questionForm.questionType)
  const stemImageUrl = String(questionForm.stemImageUrl || '').trim()
  const optionImageUrls = questionType === 'choice' ? mediaList(questionForm.optionImageUrlsText) : []
  const options = questionType === 'choice'
    ? (questionForm.optionsText || '').split('\n').map(item => item.trim())
    : []
  while (options.length && !options[options.length - 1] && !optionImageUrls[options.length - 1]) {
    options.pop()
  }
  const optionCount = Math.max(options.length, optionImageUrls.length)
  while (options.length < optionCount) options.push('')
  if (!String(questionForm.stem || '').trim() && !stemImageUrl) {
    ElMessage.warning('请填写题干或上传题干图片')
    return
  }
  if (questionType === 'choice' && optionCount < 2) {
    ElMessage.warning('选择题至少填写两个选项或上传两张选项图片')
    return
  }
  if (questionType === 'choice' && Number(questionForm.answer) >= optionCount) {
    ElMessage.warning('答案序号不能超出选项数量')
    return
  }
  if (questionType !== 'choice' && !String(questionForm.answerText || '').trim() && !String(questionForm.answerImageUrl || '').trim()) {
    ElMessage.warning('请填写参考答案或上传参考答案图片')
    return
  }
  if (questionForm.courseId && questionForm.chapterKey && questionForm.lessonKey) {
    applyQuestionBindLabels()
  }
  const payload = {
    ...questionForm,
    questionType,
    options,
    stemImageUrl,
    optionImageUrls,
    answer: questionType === 'choice' ? Number(questionForm.answer || 0) : undefined,
    answerText: questionType === 'choice' ? '' : String(questionForm.answerText || '').trim(),
    acceptableAnswers: questionType === 'fill'
      ? String(questionForm.answerText || '').split('\n').map(item => item.trim()).filter(Boolean)
      : []
  }
  delete payload.optionsText
  delete payload.optionImageUrlsText
  delete payload.chapterKey
  delete payload.lessonKey
  delete payload.bindConfirmed
  const res = await saveQuestion(payload)
  const savedQuestion = res.data || payload
  await bindQuestionToCourseLesson(savedQuestion.id || questionForm.id)
  ElMessage.success('题目已保存')
  questionOpen.value = false
  await Promise.all([loadQuestionsData(), loadCourses(), loadCourseOptions()])
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
  if (orderSubmitting.value) return
  const required = ['userId', 'courseId', 'cardType', 'studentName', 'gender', 'recentExamScore', 'grade', 'schoolName', 'region']
  if (hasMissingFields(orderForm, required)) {
    ElMessage.warning('请填写用户、课程、卡类型、学生名、性别、分数、年级、学校和地区')
    return
  }
  orderSubmitting.value = true
  try {
    await addOrder({ ...orderForm })
    ElMessage.success('课程已开通')
    Object.assign(orderForm, { ...orderForm, cardCode: '', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
    fillOrderUserInfo(orderForm)
    await Promise.all([loadOrdersData(), loadUsersData(), loadDashboard(), loadAgencyData()])
  } finally {
    orderSubmitting.value = false
  }
}

async function submitCodeActivation() {
  const required = ['userId', 'code', 'studentName', 'gender', 'recentExamScore', 'grade', 'schoolName', 'region']
  if (hasMissingFields(codeActivateForm, required)) {
    ElMessage.warning('请填写用户、激活码、学生名、性别、分数、年级、学校和地区')
    return
  }
  await activateCourseByCode({ ...codeActivateForm })
  ElMessage.success('激活码已为该用户开通课程')
  Object.assign(codeActivateForm, { userId: codeActivateForm.userId, code: '', courseId: '', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
  await Promise.all([loadOrdersData(), loadUsersData(), loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function handleCloseOrder(row) {
  await ElMessageBox.confirm(`确认关闭「${row.userName}」的课程权限吗？`, '手动关闭权限', { type: 'warning' })
  await closeOrder(row.id)
  ElMessage.success('课程权限已关闭')
  await Promise.all([loadOrdersData(), loadDashboard()])
}

async function submitActivationCode() {
  if (!activationForm.cardType) {
    ElMessage.warning('请选择卡类型')
    return
  }
  await saveActivationCode({ ...activationForm })
  ElMessage.success('激活码已保存')
  Object.assign(activationForm, { id: '', code: '', courseId: '', cardType: 'year', ownerUserId: '', status: 'available', remark: '' })
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

function openActivationAssign(row) {
  Object.assign(activationAssignForm, {
    id: row.id,
    code: row.code,
    ownerUserId: ''
  })
  activationAssignOpen.value = true
}

async function submitActivationAssign() {
  if (!activationAssignForm.ownerUserId) {
    ElMessage.warning('请选择归宿校区')
    return
  }
  await saveActivationCode({ id: activationAssignForm.id, ownerUserId: activationAssignForm.ownerUserId })
  activationAssignOpen.value = false
  ElMessage.success('激活码已分配到校区')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function toggleActivationLock(row) {
  const nextLocked = !isActivationLocked(row)
  await saveActivationCode({ id: row.id, locked: nextLocked })
  ElMessage.success(nextLocked ? '激活码已锁定，课程暂不可用' : '激活码已解锁恢复正常')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function unassignActivationCode(row) {
  await ElMessageBox.confirm(`确认取消激活码「${row.code}」的校区归属吗？`, '取消分配', { type: 'warning' })
  await saveActivationCode({ id: row.id, ownerUserId: '' })
  ElMessage.success('激活码已取消分配')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function closeActivationAuthorization(row) {
  await ElMessageBox.confirm(`确认关闭激活码「${row.code}」对应的课程授权吗？`, '关闭课程授权', { type: 'warning' })
  await closeActivationCodeAuthorization(row.id)
  ElMessage.success('课程授权已关闭')
  await Promise.all([loadActivationData(), loadOrdersData(), loadUsersData(), loadDashboard(), loadAgencyData()])
}

async function removeActivationCode(row) {
  await ElMessageBox.confirm(`确认删除激活码「${row.code}」吗？`, '删除激活码', { type: 'warning' })
  await deleteActivationCode(row.id)
  ElMessage.success('激活码已删除')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function setAgencyAdmin(row) {
  await updateUserRole(row.id, {
    role: 'agency_admin',
    organizationName: row.organizationName || row.name,
    activationQuota: row.activationQuota || 100
  })
  ElMessage.success('已设置为分机构管理账号')
  await Promise.all([loadUsersData(), loadDashboard(), loadAgencyData()])
  await showAgencyStats(row)
}

async function showAgencyStats(row) {
  const res = await getAgencySummary(row.id)
  agencyStats.value = res.data || null
  selectedUserStats.value = { type: 'agency', name: row.name || row.organizationName || row.id, ...(res.data || {}) }
}

async function updateAgencyQuota(row, value) {
  const agency = row.agency || {}
  if (!agency.id) return
  await updateUserRole(agency.id, {
    role: 'agency_admin',
    organizationName: agency.organizationName || agency.name || '',
    activationQuota: Number(value || 0)
  })
  ElMessage.success('名额已更新')
  await Promise.all([loadUsersData(), loadDashboard(), loadAgencyData()])
  if (selectedUserStats.value?.type === 'agency' && selectedUserStats.value?.agency?.id === agency.id) {
    await showAgencyStats({ ...agency, activationQuota: Number(value || 0) })
  }
}

async function showUserStats(row) {
  if (row.role === 'agency_admin') {
    await showAgencyStats(row)
    return
  }
  const stats = row.studentStats || {}
  selectedUserStats.value = {
    type: 'student',
    name: row.name || row.id,
    courseCount: row.openCourseCount || stats.courseCount || 0,
    attemptCount: stats.attemptCount || 0,
    averageScore: stats.averageScore || 0,
    ratingCount: stats.ratingCount || 0,
    wrongCount: stats.wrongCount || 0,
    progressText: stats.progressText || row.progressText || '暂无',
    courses: row.activatedCourses || []
  }
}

function starCount(row = {}, star) {
  const counts = row.counts || row.totalCounts || {}
  return counts[star] || counts[String(star)] || 0
}

function ratingCourseKey(row = {}) {
  return String(row.id || row.courseId || row.name || '')
}

function ratingLessonKey(row = {}) {
  return String(row.id || row.lessonId || row.name || '')
}

function ratingLessonRowsForCourse(course) {
  if (!course) return []
  const courseKey = ratingCourseKey(course)
  const courseName = cleanCourseName(course.name || course.courseTitle || course.courseName || courseKey)
  return ratingLessonRows.value.filter(item => {
    const itemCourseId = String(item.courseId || '')
    if (courseKey && itemCourseId && itemCourseId === courseKey) return true
    const itemCourseName = cleanCourseName(item.courseTitle || item.subjectTitle || '')
    return !!courseName && !!itemCourseName && itemCourseName === courseName
  })
}

function findRatingCourseForLesson(row = {}) {
  return officialCourseRatingRows.value.find(course => ratingLessonRowsForCourse(course).some(item => ratingLessonKey(item) === ratingLessonKey(row)))
}

function showCourseRatingDetail(row) {
  if (!row) return
  selectedRatingCourseKey.value = ratingCourseKey(row)
  const firstLesson = ratingLessonRowsForCourse(row)[0]
  selectedRatingDetailId.value = firstLesson ? ratingLessonKey(firstLesson) : ''
}

function showRatingDetail(row) {
  const target = row || selectedRatingLessonRows.value[0]
  if (!target) {
    ElMessage.info('暂无评分详情')
    return
  }
  const course = findRatingCourseForLesson(target)
  if (course) {
    selectedRatingCourseKey.value = ratingCourseKey(course)
  }
  selectedRatingDetailId.value = ratingLessonKey(target)
}

function ratingCourseRowClassName({ row }) {
  return ratingCourseKey(row) === selectedRatingCourseKey.value ? 'selected-rating-course-row' : ''
}

function questionSubjectLabel(row = {}) {
  if (row.subjectName) return row.subjectName
  const course = courseById(row.courseId)
  return course ? cleanCourseName(course.courseName || course.title || course.id) : (row.courseId || '-')
}

function normalizeQuestionType(value) {
  if (value === 'fill' || value === '填空' || value === '填空题') return 'fill'
  if (value === 'subjective' || value === '主观' || value === '主观题') return 'subjective'
  return 'choice'
}

function questionTypeLabel(value) {
  const type = normalizeQuestionType(value)
  if (type === 'fill') return '填空题'
  if (type === 'subjective') return '主观题'
  return '选择题'
}

function questionTypeTag(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'fill') return 'warning'
  if (type === 'subjective') return 'success'
  return 'primary'
}

function mediaList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function mediaListText(value) {
  return mediaList(value).join(',')
}

function optionImageList(row = {}) {
  return mediaList(row.optionImageUrls || row.optionImages || row.optionImageUrl)
}

function questionContentSummary(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'choice') {
    const options = Array.isArray(row.options) ? row.options : []
    const text = options.map((item, index) => `${String.fromCharCode(65 + index)}. ${item || '图片选项'}`).join(' / ')
    const imageCount = optionImageList(row).length
    return [text, imageCount ? `${imageCount}张选项图` : ''].filter(Boolean).join('，') || '-'
  }
  return type === 'fill' ? '填空作答' : '主观作答'
}

function questionAnswerLabel(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'choice') return `序号 ${row.answer ?? 0}`
  return row.answerText || row.answer || (row.answerImageUrl ? '图片参考答案' : '-')
}

function questionBoundLabel(row = {}) {
  return [row.courseTitle || '', row.chapterTitle || '', row.lessonTitle || ''].filter(Boolean).join(' / ') || '-'
}

function difficultyLabel(value) {
  const number = Number(value || 0)
  return number > 0 ? `${number}星` : '-'
}

function authStatusText(status = '') {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '已拒绝'
  return status === 'pending' ? '待处理' : status
}

function isActivationLocked(row = {}) {
  return row.locked === true || row.status === 'disabled'
}

function isActivationClosed(row = {}) {
  return row.authorizationClosed === true || row.displayStatus === '已关闭授权'
}

function isActivationExpired(row = {}) {
  return row.expired === true || (row.status === 'used' && !isActivationClosed(row) && isPastDate(row.expiresAt))
}

function isActivationActiveUsed(row = {}) {
  return row.activeUsed === true || (row.status === 'used' && !isActivationClosed(row) && !isActivationExpired(row))
}

function isActivationAvailable(row = {}) {
  return row.status !== 'used' && !isActivationLocked(row) && !isActivationClosed(row) && !isActivationExpired(row)
}

function isPastDate(value = '') {
  const text = String(value || '').trim()
  if (!text) return false
  const dateText = text.length <= 10 ? `${text.slice(0, 10)}T23:59:59` : text.replace(' ', 'T')
  const time = new Date(dateText).getTime()
  return Number.isFinite(time) && time < Date.now()
}

function activationFilterStatus(row = {}) {
  if (isActivationClosed(row)) return 'closed'
  if (isActivationExpired(row)) return 'expired'
  if (isActivationLocked(row)) return 'locked'
  if (row.status === 'used') return 'used'
  return row.ownerUserId ? 'assigned' : 'unassigned'
}

function activationStatusText(row = {}) {
  if (typeof row === 'string') {
    if (row === 'used') return '已使用'
    if (row === 'disabled') return '已锁定'
    if (row === 'available') return '可使用'
    if (row === 'closed') return '已关闭授权'
    if (row === 'expired') return '已过期'
    return row
  }
  if (isActivationClosed(row)) return '已关闭授权'
  if (isActivationExpired(row)) return '已过期'
  if (isActivationLocked(row)) return '已锁定'
  if (row.status === 'used') return '已使用'
  return row.ownerUserId ? '已分配' : '未分配'
}

function activationStatusTagType(row = {}) {
  if (isActivationClosed(row)) return 'info'
  if (isActivationExpired(row)) return 'warning'
  if (isActivationLocked(row)) return 'danger'
  if (row.status === 'used') return 'success'
  return row.ownerUserId ? 'primary' : 'warning'
}

function canAssignActivation(row = {}) {
  return row.status !== 'used' && !row.ownerUserId
}

function canUnassignActivation(row = {}) {
  return row.status !== 'used' && !!row.ownerUserId
}

function userRoleLabel(value = '') {
  return userRoleOptions.find(item => item.value === value)?.label || value || '学生'
}

function accountTypeText(row = {}) {
  if (row.role === 'agency_admin') return '分机构账号'
  if (row.role === 'admin') return '管理员'
  if (row.accountTypeText) return row.accountTypeText
  return Number(row.openCourseCount || 0) > 0 ? '正式学员' : '试用学员'
}

function accountTypeTag(row = {}) {
  if (row.role === 'agency_admin') return 'warning'
  if (row.role === 'admin') return 'danger'
  return Number(row.openCourseCount || 0) > 0 ? 'success' : 'info'
}

function cleanCourseName(value = '') {
  return String(value).replace(/[《》]/g, '').replace(/20\d{2}/g, '').replace(/试听课/g, '').trim() || '未命名课程'
}

function courseLabel(courseId = '') {
  const course = courseOptions.value.find(item => item.id === courseId)
  return course ? course.optionLabel : (courseId || '未选择')
}

function dateOnly(value = '') {
  return String(value || '').slice(0, 10)
}

function docCategoryLabel(category = '') {
  return category === 'paper' ? '试卷' : '资料'
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
    defaultVideoUrl: '',
    studyCount: 0,
    totalLessons: 0,
    totalDuration: '',
    practiceDuration: '',
    status: 'published',
    sort: 0,
    versions: [
      { name: '2026版', chapters: [] },
      { name: '绝招课', chapters: [] },
      { name: '知识巩固', chapters: [] }
    ],
    chapters: [],
    quizzes: [],
    knowledgeQuizzes: []
  }
}

function defaultDocForm() {
  return {
    id: '',
    courseId: 'gk-math-full',
    category: 'lecture',
    title: '',
    fileUrl: '',
    fileType: 'PDF',
    size: '',
    visible: true
  }
}

function defaultQuestionForm() {
  return {
    id: '',
    questionType: 'choice',
    stem: '',
    stemImageUrl: '',
    optionsText: '',
    optionImageUrls: [],
    optionImageUrlsText: '',
    answer: 0,
    answerText: '',
    analysis: '',
    subjectName: '',
    knowledge: '',
    difficulty: 1,
    province: '',
    courseId: '',
    courseTitle: '',
    chapterTitle: '',
    lessonTitle: '',
    chapterKey: '',
    lessonKey: '',
    bindConfirmed: false,
    answerImageUrl: '',
    analysisImageUrl: '',
    videoAnalysisUrl: ''
  }
}

function defaultUserEditForm() {
  return {
    id: '',
    name: '',
    phone: '',
    role: 'student',
    status: 'active',
    gender: '',
    grade: '',
    schoolName: '',
    region: '',
    recentExamScore: '',
    organizationName: '',
    activationQuota: 0,
    expiresAt: '',
    remark: ''
  }
}
</script>

<style scoped>
.course-admin {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  min-height: 104px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7eaf0;
}

.summary-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

.summary-sub {
  margin-top: 6px;
  color: #8a94a6;
  font-size: 12px;
  line-height: 1.4;
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

.user-filter {
  margin-bottom: 12px;
}

.activation-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.activation-code-text {
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-block {
  margin-bottom: 16px;
  border-radius: 8px;
}

.dense-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.dense-form .el-form-item {
  margin-right: 0;
  margin-bottom: 12px;
}

.dense-form :deep(.el-select),
.dense-form :deep(.el-input-number) {
  width: 100%;
}

.dense-form .form-actions {
  grid-column: 1 / -1;
}

.field-hint {
  width: 100%;
  margin-top: 4px;
  color: #8a94a6;
  font-size: 12px;
  line-height: 1.4;
}

.muted-text {
  color: #8a94a6;
  font-size: 12px;
}

.question-stat-grid,
.compact-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.question-stat-chip {
  min-height: 58px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e7eaf0;
}

.question-stat-chip span {
  display: block;
  color: #697386;
  font-size: 12px;
}

.question-stat-chip strong {
  display: block;
  margin-top: 6px;
  color: #1f2937;
  font-size: 18px;
}

.question-preview-cell,
.question-content-preview {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.question-preview-text {
  color: #1f2937;
  line-height: 1.45;
  word-break: break-word;
}

.question-thumb-row,
.question-option-images {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.question-thumb,
.question-picker-thumb {
  display: block;
  border-radius: 6px;
  border: 1px solid #e5eaf2;
  background: #f8fafc;
}

.question-thumb {
  width: 56px;
  height: 56px;
}

.question-picker-thumb {
  width: 72px;
  height: 54px;
}

.user-stats-panel {
  margin-top: 16px;
}

.user-course-expand {
  padding: 8px 18px;
  background: #fbfdff;
}

.course-expand-item {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 32px;
  color: #4b5563;
  font-size: 13px;
}

.course-expand-item strong {
  min-width: 180px;
  color: #1f2937;
}

.agency-cards {
  margin-bottom: 12px;
}

.agency-card {
  min-height: 70px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e7eaf0;
}

.agency-card span {
  display: block;
  color: #697386;
  font-size: 13px;
}

.agency-card strong {
  display: block;
  margin-top: 8px;
  color: #1f2937;
  font-size: 22px;
}

.rating-board {
  background: #fbfdff;
}

.rating-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.rating-hint {
  color: #697386;
  font-size: 13px;
  font-weight: 400;
}

.rating-course-table {
  margin-top: 0;
}

.rating-course-table :deep(.selected-rating-course-row td) {
  background: #eef6ff;
}

.rating-detail-panel {
  margin-top: 12px;
}

.rating-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.rating-detail-grid > div {
  min-height: 70px;
  padding: 12px 14px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #fff;
}

.rating-detail-grid span {
  display: block;
  color: #697386;
  font-size: 13px;
}

.rating-detail-grid strong {
  display: block;
  margin-top: 8px;
  color: #1f2937;
  font-size: 18px;
}

:deep(.course-edit-dialog .el-dialog__body) {
  max-height: 72vh;
  overflow: auto;
  padding-top: 8px;
}

.course-edit-form {
  color: #1f2937;
}

.course-edit-section {
  padding: 18px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #fbfcfe;
}

.course-edit-section + .course-edit-section {
  margin-top: 16px;
}

.base-section {
  background: #fff;
}

.section-title {
  margin-bottom: 14px;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.section-subtitle {
  margin-top: -8px;
  color: #697386;
  font-size: 13px;
}

.content-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.content-mode-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.content-mode-actions .el-button {
  margin-left: 0;
}

.chapter-editor {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 16px;
}

.chapter-sidebar,
.chapter-main,
.knowledge-editor {
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.sidebar-head,
.lesson-editor-head,
.knowledge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.sidebar-head span,
.lesson-editor-head strong,
.knowledge-head strong {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.lesson-editor-head span,
.knowledge-head span {
  margin-left: 10px;
  color: #697386;
  font-size: 13px;
}

.chapter-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}

.chapter-card + .chapter-card {
  margin-top: 10px;
}

.chapter-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.chapter-sort {
  width: 72px;
}

.lesson-row,
.quiz-edit-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.15fr) 96px minmax(170px, 1fr) minmax(190px, 1fr) 34px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #f8fafc;
}

.lesson-row + .lesson-row,
.quiz-edit-row + .quiz-edit-row {
  margin-top: 10px;
}

.lesson-sort-input {
  width: 96px;
}

.lesson-question-cell,
.quiz-question-cell {
  display: grid;
  gap: 8px;
}

.lesson-question-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.delete-icon-button {
  width: 32px;
  height: 32px;
  padding: 0;
}

.question-course-bind {
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #f8fafc;
}

.question-type-group {
  margin-right: 12px;
}

.reference-answer-editor {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 1.35fr);
  gap: 14px;
}

.question-media-editor {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, .9fr);
  gap: 14px;
}

.question-media-pane {
  min-width: 0;
}

.reference-answer-pane {
  min-width: 0;
}

.pane-label {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.upload-pane {
  min-height: 112px;
}

.bind-title {
  margin-bottom: 12px;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.banner-preview {
  width: 144px;
  height: 64px;
  display: block;
  border-radius: 6px;
  background: #f1f5f9;
}

.banner-image-cell {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.banner-upload {
  width: 58px;
}

.banner-upload :deep(.component-upload-image) {
  display: flex;
  align-items: center;
}

.banner-upload :deep(.el-upload-list--picture-card) {
  display: flex;
}

.banner-upload :deep(.el-upload--picture-card),
.banner-upload :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 48px;
  height: 48px;
  margin: 0;
  line-height: 48px;
}

.banner-upload :deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
}

.banner-upload :deep(.el-upload__tip) {
  display: none;
}

.settings-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.question-picker-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 160px 130px 160px 160px;
  gap: 10px;
  margin-bottom: 12px;
}

.question-picker-list {
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.question-option-row {
  padding: 12px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #f8fafc;
}

.question-option-stem {
  display: inline-block;
  max-width: 640px;
  color: #1f2937;
  line-height: 1.45;
  white-space: normal;
}

.question-option-images {
  margin-top: 8px;
  padding-left: 24px;
}

.question-option-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-left: 24px;
}

.empty-editor {
  padding: 20px;
  border: 1px dashed #cfd8e6;
  border-radius: 8px;
  background: #f8fafc;
  color: #697386;
  text-align: center;
  font-size: 13px;
}

.empty-editor.large {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1180px) {
  .chapter-editor {
    grid-template-columns: 1fr;
  }

  .lesson-row,
  .quiz-edit-row {
    grid-template-columns: 1fr;
  }

  .lesson-sort-input,
  .question-bank-input,
  .lesson-title-input,
  .question-picker-filters {
    width: 100%;
  }

  .question-picker-filters {
    grid-template-columns: 1fr;
  }

  .reference-answer-editor {
    grid-template-columns: 1fr;
  }
}
</style>
