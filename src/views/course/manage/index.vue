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
        <el-table :data="questionList" border>
          <el-table-column prop="stem" label="题干" min-width="260" show-overflow-tooltip />
          <el-table-column prop="knowledge" label="知识点" width="140" />
          <el-table-column label="选项" min-width="220">
            <template #default="{ row }">{{ (row.options || []).join(' / ') }}</template>
          </el-table-column>
          <el-table-column prop="answer" label="答案序号" width="100" />
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
          <el-col :span="10">
            <el-card shadow="never" class="admin-block">
              <template #header>用户</template>
              <el-table :data="userList" height="260">
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="phone" label="手机号" />
                <el-table-column prop="role" label="角色" width="90" />
                <el-table-column label="分机构" width="170">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="setAgencyAdmin(row)">设为分机构</el-button>
                    <el-button link type="success" @click="showAgencyStats(row)">查看</el-button>
                  </template>
                </el-table-column>
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
                <el-form-item label="激活码">
                  <el-input v-model="orderForm.cardCode" placeholder="可选" style="width: 180px" />
                </el-form-item>
                <el-form-item label="卡类型">
                  <el-select v-model="orderForm.cardType" style="width: 150px">
                    <el-option label="一年期" value="year" />
                    <el-option label="72小时" value="hours72" />
                    <el-option label="7天卡" value="days7" />
                  </el-select>
                </el-form-item>
                <el-form-item label="学生名"><el-input v-model="orderForm.studentName" style="width: 120px" /></el-form-item>
                <el-form-item label="最近分数"><el-input v-model="orderForm.recentExamScore" style="width: 110px" /></el-form-item>
                <el-form-item label="年级"><el-input v-model="orderForm.grade" style="width: 100px" /></el-form-item>
                <el-form-item label="学校"><el-input v-model="orderForm.schoolName" style="width: 150px" /></el-form-item>
                <el-form-item label="地区"><el-input v-model="orderForm.region" style="width: 120px" /></el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Plus" @click="submitOrder">开通课程</el-button>
                </el-form-item>
              </el-form>
            </el-card>
            <el-card shadow="never" class="admin-block">
              <template #header>后台激活码开通</template>
              <el-form :model="codeActivateForm" inline>
                <el-form-item label="用户ID"><el-input v-model="codeActivateForm.userId" style="width: 150px" /></el-form-item>
                <el-form-item label="激活码"><el-input v-model="codeActivateForm.code" placeholder="输入激活码" style="width: 190px" /></el-form-item>
                <el-form-item label="学生名"><el-input v-model="codeActivateForm.studentName" style="width: 120px" /></el-form-item>
                <el-form-item label="最近分数"><el-input v-model="codeActivateForm.recentExamScore" style="width: 110px" /></el-form-item>
                <el-form-item label="年级"><el-input v-model="codeActivateForm.grade" style="width: 100px" /></el-form-item>
                <el-form-item label="学校"><el-input v-model="codeActivateForm.schoolName" style="width: 150px" /></el-form-item>
                <el-form-item label="地区"><el-input v-model="codeActivateForm.region" style="width: 120px" /></el-form-item>
                <el-form-item>
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
            <el-table-column prop="cardCode" label="激活码" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'activated' ? 'success' : 'info'">{{ row.status === 'activated' ? '已开通' : row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="100" />
            <el-table-column prop="expiresAt" label="到期时间" width="170" />
            <el-table-column prop="createdAt" label="时间" width="180" />
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button link type="danger" :disabled="row.status !== 'activated'" @click="handleCloseOrder(row)">关闭权限</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card v-if="agencyStats" shadow="never" class="admin-block">
          <template #header>分机构账号概览</template>
          <el-row :gutter="12" class="agency-cards">
            <el-col :span="4"><div class="agency-card"><span>名额</span><strong>{{ agencyStats.quota }}</strong></div></el-col>
            <el-col :span="4"><div class="agency-card"><span>激活码总量</span><strong>{{ agencyStats.totalCodes }}</strong></div></el-col>
            <el-col :span="4"><div class="agency-card"><span>已激活</span><strong>{{ agencyStats.activatedCount }}</strong></div></el-col>
            <el-col :span="4"><div class="agency-card"><span>未激活</span><strong>{{ agencyStats.unusedCount }}</strong></div></el-col>
            <el-col :span="4"><div class="agency-card"><span>锁定</span><strong>{{ agencyStats.lockedCount || 0 }}</strong></div></el-col>
            <el-col :span="4"><div class="agency-card"><span>用户数</span><strong>{{ agencyStats.userCount || 0 }}</strong></div></el-col>
          </el-row>
          <el-table :data="agencyStats.students || []" border>
            <el-table-column prop="studentName" label="学生名字" />
            <el-table-column prop="subject" label="科目" />
            <el-table-column prop="region" label="地区" />
            <el-table-column prop="activatedAt" label="激活日期" width="180" />
          </el-table>
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
          <el-form-item>
            <el-button icon="Refresh" @click="resetUserQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="filteredUserList" border>
          <el-table-column prop="id" label="用户ID" width="130" show-overflow-tooltip />
          <el-table-column prop="name" label="姓名" min-width="130">
            <template #default="{ row }">
              <el-input v-model="row.name" size="small" @change="saveUser(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.phone" size="small" @change="saveUser(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="150">
            <template #default="{ row }">
              <el-select v-model="row.role" size="small" @change="saveUser(row)">
                <el-option v-for="item in userRoleOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-switch v-model="row.status" active-value="active" inactive-value="disabled" @change="saveUser(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="organizationName" label="机构/归属" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.organizationName" size="small" placeholder="机构名称" @change="saveUser(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="activationQuota" label="激活名额" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.activationQuota" :min="0" size="small" controls-position="right" @change="saveUser(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="180" show-overflow-tooltip />
          <el-table-column label="操作" fixed="right" width="170">
            <template #default="{ row }">
              <el-button link type="primary" @click="setAgencyAdmin(row)">设为机构</el-button>
              <el-button link type="success" @click="showAgencyStats(row)">统计</el-button>
            </template>
          </el-table-column>
        </el-table>
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
            <el-form-item label="激活码"><el-input v-model="activationForm.code" placeholder="不填自动生成" style="width: 180px" /></el-form-item>
            <el-form-item label="课程ID"><el-input v-model="activationForm.courseId" style="width: 180px" /></el-form-item>
            <el-form-item label="类型">
              <el-select v-model="activationForm.cardType" style="width: 150px">
                <el-option label="一年期" value="year" />
                <el-option label="72小时" value="hours72" />
                <el-option label="7天卡" value="days7" />
              </el-select>
            </el-form-item>
            <el-form-item label="归属账号ID"><el-input v-model="activationForm.ownerUserId" style="width: 140px" /></el-form-item>
            <el-form-item label="状态">
              <el-select v-model="activationForm.status" style="width: 120px">
                <el-option label="可用" value="available" />
                <el-option label="关闭" value="disabled" />
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
              <el-option label="可用" value="available" />
              <el-option label="已锁定" value="disabled" />
              <el-option label="已使用" value="used" />
            </el-select>
          </el-form-item>
          <el-form-item label="归属账号">
            <el-input v-model="activationQuery.owner" clearable placeholder="账号ID" style="width: 140px" />
          </el-form-item>
        </el-form>

        <el-table :data="filteredActivationList" border>
          <el-table-column prop="code" label="激活码" width="170" />
          <el-table-column prop="courseTitle" label="课程" min-width="180" />
          <el-table-column prop="cardTypeText" label="类型" width="130" />
          <el-table-column prop="ownerName" label="归属账号" width="120" />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.status === 'used' ? 'success' : row.status === 'disabled' ? 'danger' : 'primary'">{{ row.status === 'used' ? '已使用' : row.status === 'disabled' ? '已锁定' : '可使用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="使用学生" width="120" />
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="activatedAt" label="激活日期" width="180" />
          <el-table-column prop="expiresAt" label="到期时间" width="180" />
          <el-table-column label="操作" fixed="right" width="260">
            <template #default="{ row }">
              <el-button link type="primary" @click="editActivationCode(row)">编辑</el-button>
              <el-button link :type="row.status === 'disabled' ? 'success' : 'warning'" :disabled="row.status === 'used'" @click="disableActivationCode(row)">{{ row.status === 'disabled' ? '解锁' : '锁定' }}</el-button>
              <el-button link type="info" :disabled="row.status === 'used' || !row.ownerUserId" @click="unassignActivationCode(row)">取消分配</el-button>
              <el-button link type="danger" :disabled="row.status === 'used'" @click="removeActivationCode(row)">删除</el-button>
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
          <el-table-column prop="quota" label="名额" width="90" />
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
              <template #header>错题与巩固</template>
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

      <el-tab-pane v-if="isRootAdmin" label="课程打分统计" name="ratings">
        <el-card shadow="never" class="admin-block rating-board">
          <template #header>课程打分评价统计</template>
          <div class="rating-overview">
            <div class="rating-chip">
              <span>平均星级</span>
              <strong>{{ ratingStats.average || '0.0' }}星</strong>
            </div>
            <div class="rating-chip">
              <span>评价总数</span>
              <strong>{{ ratingStats.chapterTotal || 0 }}条</strong>
            </div>
            <div class="rating-chip" v-for="star in ratingOptions" :key="star">
              <span>{{ star }}星</span>
              <strong>{{ starCount(ratingStats, star) }}</strong>
            </div>
          </div>
        </el-card>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never" class="admin-block">
              <template #header>科目评分统计</template>
              <el-table :data="ratingStats.subjects || []" height="320" empty-text="暂无科目评分">
                <el-table-column prop="name" label="科目" show-overflow-tooltip />
                <el-table-column prop="average" label="均星" width="80" />
                <el-table-column prop="total" label="数量" width="80" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="admin-block">
              <template #header>章节评分统计</template>
              <el-table :data="ratingStats.chapters || []" height="320" empty-text="暂无章节评分">
                <el-table-column prop="name" label="章节" show-overflow-tooltip />
                <el-table-column prop="average" label="均星" width="80" />
                <el-table-column prop="total" label="数量" width="80" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="admin-block">
              <template #header>课程小节评分统计</template>
              <el-table :data="ratingStats.lessons || []" height="320" empty-text="暂无小节评分">
                <el-table-column prop="name" label="课程小节" show-overflow-tooltip />
                <el-table-column prop="average" label="均星" width="80" />
                <el-table-column prop="total" label="数量" width="80" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="admin-block">
          <template #header>激活分数阶段星级分布</template>
          <el-table :data="ratingStats.groups || []" border>
            <el-table-column prop="range" label="激活分数段" width="120" />
            <el-table-column prop="students" label="人数" width="90" />
            <el-table-column v-for="star in ratingOptions" :key="star" :label="`${star}星`" width="90">
              <template #default="{ row }">{{ starCount(row, star) }}</template>
            </el-table-column>
          </el-table>
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
            <el-col :span="24">
              <el-form-item label="课程视频">
                <file-upload v-model="courseForm.defaultVideoUrl" :limit="1" :file-size="1024" :file-type="['mp4', 'mov', 'm4v', 'webm']" />
              </el-form-item>
            </el-col>
            <el-col :span="6"><el-form-item label="排序"><el-input-number v-model="courseForm.sort" :min="0" style="width: 100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="课程节数"><el-input-number v-model="courseForm.totalLessons" :min="0" style="width: 100%" /></el-form-item></el-col>
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
                添加【{{ item.label }}】内容
              </el-button>
            </div>
          </div>

          <div v-if="contentMode !== 'knowledge'" class="chapter-editor">
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
                <el-button text type="danger" icon="Delete" @click.stop="removeCourseChapter(index)" />
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
                  <el-input v-model="lesson.questionBankName" placeholder="输入题库名称" class="question-bank-input" />
                  <el-button text type="danger" icon="Delete" @click="removeCourseLesson(index)">删除此节内容</el-button>
                </div>
              </div>
              <div v-else class="empty-editor large">请先新建或选择一个章节。</div>
            </div>
          </div>

          <div v-else class="knowledge-editor">
            <div class="knowledge-head">
              <div>
                <strong>知识巩固题库</strong>
                <span>用于课程内章节扫雷、知识巩固等练习入口。</span>
              </div>
              <el-button type="primary" icon="Plus" @click="addCourseQuiz">添加题库</el-button>
            </div>
            <div v-if="!courseForm.quizzes.length" class="empty-editor">暂无题库，可点击“添加题库”。</div>
            <div v-for="(quiz, index) in courseForm.quizzes" :key="index" class="quiz-edit-row">
              <el-input v-model="quiz.name" placeholder="输入题库名称" />
              <el-input v-model="quiz.status" placeholder="显示状态，如：未学习" />
              <el-input v-model="quiz.action" placeholder="按钮文案，如：去测评" />
              <el-button text type="danger" icon="Delete" @click="removeCourseQuiz(index)">删除</el-button>
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

    <el-dialog v-model="questionOpen" :title="questionForm.id ? '编辑题目' : '新增题目'" width="720px" append-to-body>
      <el-form :model="questionForm" label-width="90px">
        <el-form-item label="题干"><el-input v-model="questionForm.stem" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="选项"><el-input v-model="questionForm.optionsText" type="textarea" :rows="4" placeholder="每行一个选项" /></el-form-item>
        <el-form-item label="答案序号"><el-input-number v-model="questionForm.answer" :min="0" :max="9" /></el-form-item>
        <el-form-item label="知识点"><el-input v-model="questionForm.knowledge" /></el-form-item>
        <el-form-item label="解析"><el-input v-model="questionForm.analysis" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="视频解析">
          <file-upload v-model="questionForm.videoAnalysisUrl" :limit="1" :file-size="500" :file-type="['mp4', 'mov', 'm4v', 'webm']" />
        </el-form-item>
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
import useUserStore from '@/store/modules/user'
import {
  addCourse,
  addOrder,
  activateCourseByCode,
  closeOrder,
  deleteActivationCode,
  deleteCourse,
  deleteDoc,
  deleteQuestion,
  getAgencySummary,
  getCourseDashboard,
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
  saveQuestion,
  updateUserRole,
  updateCourse
} from '@/api/course'

const activeTab = ref('courses')
const userStore = useUserStore()
const loading = ref(false)
const dashboard = reactive({})
const courseQuery = reactive({ stage: '', kind: '' })
const userQuery = reactive({ keyword: '', role: '', status: '' })
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
  aiChats: []
})

const courseOpen = ref(false)
const docOpen = ref(false)
const questionOpen = ref(false)
const editingCourseId = ref('')
const courseForm = reactive(defaultCourseForm())
const docForm = reactive(defaultDocForm())
const questionForm = reactive(defaultQuestionForm())
const orderForm = reactive({ userId: '56596', courseId: 'gk-math-full', cardCode: '', cardType: 'year', studentName: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const codeActivateForm = reactive({ userId: '56596', code: '', studentName: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const activationQuery = reactive({ keyword: '', status: '', owner: '' })
const activationForm = reactive({ id: '', code: '', courseId: 'gk-math-full', cardType: 'year', ownerUserId: '33075', status: 'available', remark: '' })
const contentMode = ref('review')
const activeChapterIndex = ref(0)
const contentModes = [
  { label: '复习加强课', value: 'review' },
  { label: '技巧绝招课', value: 'tactics' },
  { label: '知识巩固', value: 'knowledge' }
]
const ratingOptions = [1, 2, 3, 4, 5]
const userRoleOptions = [
  { label: '学生', value: 'student' },
  { label: '分机构', value: 'agency_admin' },
  { label: '管理员', value: 'admin' }
]
const userStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' }
]

const summaryCards = computed(() => [
  { label: '课程数', value: dashboard.courseTotal || 0 },
  { label: '用户数', value: dashboard.userTotal || 0 },
  { label: '开通数', value: dashboard.orderTotal || 0 },
  { label: '待授权', value: dashboard.authPending || 0 },
  { label: '练习记录', value: dashboard.attemptTotal || 0 },
  { label: '待复盘错题', value: dashboard.wrongTotal || 0 }
])
const ratingStats = computed(() => dashboard.ratingStats || {})
const activationStats = computed(() => dashboard.activationStats || {})
const isRootAdmin = computed(() => String(userStore.id) === '1' || userStore.name === 'admin')
const activationSummaryCards = computed(() => [
  { label: '已生成激活码', value: activationStats.value.generated || activationList.value.length || 0 },
  { label: '已分配激活码', value: activationStats.value.assigned || 0 },
  { label: '未分配激活码', value: activationStats.value.unassigned || 0 },
  { label: '已经使用激活码', value: activationStats.value.used || 0 },
  { label: '分配未使用', value: activationStats.value.assignedUnused || 0 },
  { label: '锁定不可用', value: activationStats.value.locked || 0 }
])
const filteredActivationList = computed(() => {
  const keyword = activationQuery.keyword.trim().toLowerCase()
  return activationList.value.filter(item => {
    const text = `${item.code || ''} ${item.courseTitle || ''} ${item.ownerName || ''} ${item.ownerUserId || ''} ${item.studentName || ''}`.toLowerCase()
    const statusMatched = !activationQuery.status || item.status === activationQuery.status
    const ownerMatched = !activationQuery.owner || String(item.ownerUserId || '') === String(activationQuery.owner)
    return statusMatched && ownerMatched && (!keyword || text.includes(keyword))
  })
})
const filteredUserList = computed(() => {
  const keyword = userQuery.keyword.trim().toLowerCase()
  return userList.value.filter(user => {
    const text = `${user.id || ''} ${user.name || ''} ${user.phone || ''} ${user.organizationName || ''}`.toLowerCase()
    const roleMatched = !userQuery.role || user.role === userQuery.role
    const statusMatched = !userQuery.status || (user.status || 'active') === userQuery.status
    const keywordMatched = !keyword || text.includes(keyword)
    return roleMatched && statusMatched && keywordMatched
  })
})
const courseOptions = computed(() => (courseOptionList.value.length ? courseOptionList.value : courseList.value).map(course => ({
  ...course,
  optionLabel: `${cleanCourseName(course.courseName || course.title || course.id)}（${course.id}）`
})))
const activeVersionIndex = computed(() => contentMode.value === 'tactics' ? 1 : 0)
const activeVersion = computed(() => contentMode.value === 'knowledge' ? null : ensureCourseVersion(activeVersionIndex.value))
const activeChapters = computed(() => activeVersion.value ? activeVersion.value.chapters : [])
const activeChapter = computed(() => activeChapters.value[activeChapterIndex.value] || null)
const activeLessons = computed(() => {
  if (!activeChapter.value) return []
  if (!Array.isArray(activeChapter.value.items)) activeChapter.value.items = []
  return activeChapter.value.items
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

function resetCourseQuery() {
  courseQuery.stage = ''
  courseQuery.kind = ''
  loadCourses()
}

function resetUserQuery() {
  userQuery.keyword = ''
  userQuery.role = ''
  userQuery.status = ''
}

function versionLabelForEditor(index) {
  return index === 0 ? '复习加强课' : '技巧绝招课'
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
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
  courseForm.versions.forEach((version, versionIndex) => {
    version.name = versionIndex === 0 ? '2026版' : '绝招课'
    if (!Array.isArray(version.chapters)) version.chapters = []
    version.chapters.forEach((chapter, chapterIndex) => {
      if (!chapter.title) chapter.title = `第${chapterIndex + 1}章`
      if (!chapter.sort) chapter.sort = chapterIndex + 1
      chapter.open = !!chapter.open
      if (!Array.isArray(chapter.items)) chapter.items = []
      chapter.items.forEach((lesson, lessonIndex) => {
        if (!lesson.title) lesson.title = `章节内容${lessonIndex + 1}`
        if (!lesson.sort) lesson.sort = lessonIndex + 1
        lesson.open = !!lesson.open
        if (!Array.isArray(lesson.children) || !lesson.children.length) {
          lesson.children = [
            { name: '视频课程', type: 1, total: 1, read: 0 },
            { name: '真题讲练', type: 2, total: 0, read: 0 }
          ]
        }
        if (lesson.videoUrl) lesson.children[0].videoUrl = lesson.videoUrl
        if (lesson.questionBankName) lesson.children[1].questionBankName = lesson.questionBankName
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
  if (mode !== 'knowledge') ensureCourseVersion(activeVersionIndex.value)
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
}

function addCourseChapter() {
  const version = ensureCourseVersion(activeVersionIndex.value)
  const next = version.chapters.length + 1
  version.chapters.push({ title: `新建章节${next}`, sort: next, open: true, items: [] })
  activeChapterIndex.value = version.chapters.length - 1
}

function removeCourseChapter(index) {
  const version = ensureCourseVersion(activeVersionIndex.value)
  version.chapters.splice(index, 1)
  activeChapterIndex.value = Math.max(0, Math.min(activeChapterIndex.value, version.chapters.length - 1))
}

function addCourseLesson() {
  if (!activeChapter.value) addCourseChapter()
  const chapter = activeChapter.value
  if (!Array.isArray(chapter.items)) chapter.items = []
  const next = chapter.items.length + 1
  chapter.items.push({
    title: '',
    sort: next,
    open: false,
    videoUrl: '',
    questionBankName: '',
    durationMinutes: 0,
    children: [
      { name: '视频课程', type: 1, total: 1, read: 0 },
      { name: '真题讲练', type: 2, total: 0, read: 0 }
    ]
  })
}

function removeCourseLesson(index) {
  if (!activeChapter.value || !Array.isArray(activeChapter.value.items)) return
  activeChapter.value.items.splice(index, 1)
}

function addCourseQuiz() {
  if (!Array.isArray(courseForm.quizzes)) courseForm.quizzes = []
  courseForm.quizzes.push({ name: '', status: '未学习', action: '去测评' })
}

function removeCourseQuiz(index) {
  if (!Array.isArray(courseForm.quizzes)) return
  courseForm.quizzes.splice(index, 1)
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
  const count = editableLessonCount(payload.chapters || [])
  if (count > 0) payload.totalLessons = count
  return payload
}

async function saveUser(row) {
  await updateUserRole(row.id, {
    name: row.name,
    phone: row.phone,
    role: row.role || 'student',
    status: row.status || 'active',
    organizationName: row.organizationName || '',
    activationQuota: row.activationQuota || 0,
    remark: row.remark || ''
  })
  ElMessage.success('用户信息已保存')
  await Promise.all([loadUsersData(), loadDashboard()])
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

async function submitCodeActivation() {
  if (!codeActivateForm.userId || !codeActivateForm.code) {
    ElMessage.warning('请填写用户ID和激活码')
    return
  }
  await activateCourseByCode({ ...codeActivateForm })
  ElMessage.success('激活码已为该用户开通课程')
  Object.assign(codeActivateForm, { userId: codeActivateForm.userId, code: '', studentName: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
  await Promise.all([loadOrdersData(), loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function handleCloseOrder(row) {
  await ElMessageBox.confirm(`确认关闭「${row.userName}」的课程权限吗？`, '手动关闭权限', { type: 'warning' })
  await closeOrder(row.id)
  ElMessage.success('课程权限已关闭')
  await Promise.all([loadOrdersData(), loadDashboard()])
}

async function submitActivationCode() {
  if (!activationForm.courseId || !activationForm.cardType) {
    ElMessage.warning('请填写课程ID和卡类型')
    return
  }
  await saveActivationCode({ ...activationForm })
  ElMessage.success('激活码已保存')
  Object.assign(activationForm, { id: '', code: '', courseId: 'gk-math-full', cardType: 'year', ownerUserId: '33075', status: 'available', remark: '' })
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

function editActivationCode(row) {
  Object.assign(activationForm, {
    id: row.id,
    code: row.code,
    courseId: row.courseId,
    cardType: row.cardType,
    ownerUserId: row.ownerUserId,
    status: row.status,
    remark: row.remark || ''
  })
}

async function disableActivationCode(row) {
  await saveActivationCode({ id: row.id, status: row.status === 'disabled' ? 'available' : 'disabled' })
  ElMessage.success(row.status === 'disabled' ? '激活码已解锁恢复正常' : '激活码已锁定，不能使用')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
}

async function unassignActivationCode(row) {
  await saveActivationCode({ id: row.id, ownerUserId: '' })
  ElMessage.success('激活码已取消分配')
  await Promise.all([loadActivationData(), loadDashboard(), loadAgencyData()])
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
}

function starCount(row = {}, star) {
  const counts = row.counts || row.totalCounts || {}
  return counts[star] || counts[String(star)] || 0
}

function cleanCourseName(value = '') {
  return String(value).replace(/[《》]/g, '').replace(/20\d{2}/g, '').replace(/试听课/g, '').trim() || '未命名课程'
}

function courseLabel(courseId = '') {
  const course = courseOptions.value.find(item => item.id === courseId)
  return course ? course.optionLabel : (courseId || '未选择')
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
      { name: '绝招课', chapters: [] }
    ],
    chapters: [],
    quizzes: []
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
    stem: '',
    optionsText: '',
    answer: 0,
    analysis: '',
    knowledge: '',
    videoAnalysisUrl: ''
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

.user-filter {
  margin-bottom: 12px;
}

.admin-block {
  margin-bottom: 16px;
  border-radius: 8px;
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

.rating-overview {
  display: grid;
  grid-template-columns: repeat(7, minmax(100px, 1fr));
  gap: 12px;
}

.rating-chip {
  min-height: 72px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7eaf0;
}

.rating-chip span {
  display: block;
  color: #697386;
  font-size: 13px;
}

.rating-chip strong {
  display: block;
  margin-top: 8px;
  color: #1f2937;
  font-size: 22px;
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
  grid-template-columns: minmax(160px, 1.2fr) 96px minmax(160px, 1fr) minmax(150px, 1fr) auto;
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
  .lesson-title-input {
    width: 100%;
  }
}
</style>
