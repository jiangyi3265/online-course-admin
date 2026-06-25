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

    <el-empty v-if="!visiblePanelNames.length" description="暂无授权板块，请联系总后台账号开通权限" />
    <el-tabs v-else v-model="activeTab" class="course-tabs">
      <el-tab-pane v-if="canPanel('subAccounts')" label="后台小号" name="subAccounts">
        <el-card shadow="never" class="admin-block">
          <template #header>
            <div class="block-head">
              <span>后台小号管理</span>
              <el-button type="primary" icon="Plus" @click="openSubAccountDialog()">开通小号</el-button>
            </div>
          </template>
          <el-table :data="subAccountList" border>
            <el-table-column prop="userName" label="登录账号" width="150" />
            <el-table-column prop="nickName" label="账号名称" width="150" />
            <el-table-column prop="phonenumber" label="手机号" width="130" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="授权板块" min-width="280" show-overflow-tooltip>
              <template #default="{ row }">{{ subAccountPermissionText(row.permissionKeys) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" icon="Edit" @click="openSubAccountDialog(row)">编辑</el-button>
                <el-button link type="danger" icon="Delete" @click="removeSubAccount(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('frontend')" label="前端配置" name="frontend">
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

      <el-tab-pane v-if="canPanel('courses')" label="课程管理" name="courses">
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
          <el-table-column label="学习人数" width="116" align="center">
            <template #default="{ row }">
              <el-button class="study-count-link" link type="primary" @click="openStudyCountDialog(row)">
                {{ Number(row.studyCount || 0) }}
              </el-button>
            </template>
          </el-table-column>
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

      <el-tab-pane v-if="canPanel('docs')" label="资料管理" name="docs">
        <el-row class="toolbar-row">
          <el-button type="success" icon="Plus" @click="openDocDialog()">新增资料</el-button>
          <el-select v-model="docQuery.courseId" clearable filterable placeholder="按所属科目筛选" class="toolbar-filter-select">
            <el-option v-for="course in docCourseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
          </el-select>
          <el-select v-model="docQuery.category" clearable placeholder="资料/试卷" class="toolbar-filter-select narrow">
            <el-option label="资料" value="lecture" />
            <el-option label="试卷" value="paper" />
          </el-select>
        </el-row>
        <el-table :data="filteredDocList" border>
          <el-table-column type="index" label="序号" width="64" align="center" />
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

      <el-tab-pane v-if="canPanel('questions')" label="题库管理" name="questions">
        <el-row class="toolbar-row">
          <el-button type="success" icon="Plus" @click="openQuestionDialog()">新增题目</el-button>
        </el-row>
        <div class="question-stat-grid">
          <div
            class="question-stat-chip"
            v-for="item in questionStatChips"
            :key="item.label"
            :class="{ active: isQuestionChipActive(item) }"
            role="button"
            tabindex="0"
            @click="setQuestionQuickFilter(item)"
            @keyup.enter="setQuestionQuickFilter(item)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <el-table
          :data="filteredQuestionList"
          border
          class="question-bank-table"
          height="520"
          row-key="id"
          scrollbar-always-on
          empty-text="暂无题库题目"
        >
          <el-table-column type="index" label="序号" width="64" fixed="left" align="center" :index="questionIndexMethod" />
          <el-table-column label="题干" min-width="300" fixed="left">
            <template #default="{ row }">
              <div class="question-preview-cell">
                <span class="question-preview-text math-rich-preview" v-html="mathHtml(row.stem || (stemImageList(row).length ? '图片题干' : '-'))"></span>
                <audio v-if="stemAudioUrl(row)" class="question-audio-player" :src="stemAudioUrl(row)" controls preload="metadata"></audio>
                <el-image
                  v-if="stemImageList(row).length"
                  class="question-thumb"
                  :src="stemImageList(row)[0]"
                  fit="cover"
                  :preview-src-list="stemImageList(row)"
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
                <span class="math-rich-preview" v-html="mathHtml(questionContentSummary(row))"></span>
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
            <template #default="{ row }">
              <span class="math-rich-preview" v-html="mathHtml(questionAnswerLabel(row))"></span>
            </template>
          </el-table-column>
          <el-table-column label="视频解析" width="100">
            <template #default="{ row }">
              <el-tag :type="row.videoAnalysisUrl ? 'success' : 'info'">{{ row.videoAnalysisUrl ? '已上传' : '暂无' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" icon="Edit" @click="openQuestionDialog(row)">编辑</el-button>
              <el-button link type="danger" icon="Delete" @click="removeQuestion(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('orders')" label="授权开通" name="orders">
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
                    <el-option v-for="course in fullCourseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="卡类型">
                  <el-select v-model="orderForm.cardType">
                    <el-option label="一年期" value="year" />
                    <el-option label="月卡" value="month" />
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
                  <el-select v-model="codeActivateForm.courseId" filterable placeholder="选择正式课程">
                    <el-option v-for="course in fullCourseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
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
              <el-table :data="pagedOrderList" border class="record-compact-table">
                <el-table-column label="记录/用户" min-width="230">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <strong>{{ row.userName || '-' }}</strong>
                      <span>{{ row.id || '-' }}</span>
                      <span>来源：{{ row.source || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="课程与激活码" min-width="260">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <strong>{{ row.courseTitle || '-' }}</strong>
                      <span class="mono-line">{{ row.cardCode || '无激活码' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="学生资料" min-width="250">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <span>{{ row.studentName || '-' }} / {{ row.gender || '-' }} / {{ row.grade || '-' }}</span>
                      <span>分数：{{ row.recentExamScore || '-' }}</span>
                      <span>{{ row.schoolName || '未填学校' }}，{{ row.region || '未填地区' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="时间状态" width="220">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <el-tag :type="orderStatusTagType(row)">{{ orderStatusText(row) }}</el-tag>
                      <span>开通：{{ shortDateTime(row.createdAt) }}</span>
                      <span>到期：{{ dateOnly(row.expiresAt) || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button link type="danger" :disabled="row.status !== 'activated'" @click="handleCloseOrder(row)">关闭权限</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <pagination
                v-show="orderList.length > orderPager.pageSize"
                v-model:page="orderPager.pageNum"
                v-model:limit="orderPager.pageSize"
                :total="orderList.length"
                :page-sizes="[8, 12, 20, 50]"
                layout="total, sizes, prev, pager, next"
                :auto-scroll="false"
              />
            </el-tab-pane>
            <el-tab-pane label="操作记录" name="operations">
              <div class="record-filter-row">
                <el-date-picker
                  v-model="operationQuery.dateRange"
                  type="daterange"
                  unlink-panels
                  value-format="YYYY-MM-DD"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
                <el-button icon="Refresh" @click="resetOperationQuery">重置</el-button>
              </div>
              <el-table :data="pagedAdminOperationRecords" border class="record-compact-table">
                <el-table-column label="操作信息" min-width="240">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <strong>{{ row.type || '后台操作' }}</strong>
                      <span>操作人：{{ row.user || '-' }}</span>
                      <span>状态：{{ row.status || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="内容" min-width="360">
                  <template #default="{ row }">
                    <div class="stack-cell">
                      <strong>{{ row.course || '-' }}</strong>
                      <span>{{ row.detail || '-' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="time" label="时间" width="180" />
              </el-table>
              <pagination
                v-show="filteredAdminOperationRecords.length > operationPager.pageSize"
                v-model:page="operationPager.pageNum"
                v-model:limit="operationPager.pageSize"
                :total="filteredAdminOperationRecords.length"
                :page-sizes="[8, 12, 20, 50]"
                layout="total, sizes, prev, pager, next"
                :auto-scroll="false"
              />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('users')" label="用户管理" name="users">
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

        <el-table :data="filteredUserList" border class="user-management-table" row-key="id">
          <el-table-column type="expand" width="48">
            <template #default="{ row }">
              <div class="user-course-expand">
                <div class="user-expand-profile">
                  <span>用户ID：{{ row.id || '-' }}</span>
                  <span>手机：{{ row.phone || '-' }}</span>
                  <span>学校：{{ row.schoolName || '-' }}</span>
                  <span>地区：{{ row.region || '-' }}</span>
                  <span>机构/归属：{{ row.organizationName || '-' }}</span>
                  <span>注册：{{ shortDateTime(row.createdAt) }}</span>
                  <span v-if="row.role === 'agency_admin'">激活名额：{{ row.activationQuota || 0 }}</span>
                </div>
                <div v-if="!row.activatedCourses || !row.activatedCourses.length" class="muted-text">暂无开通课程</div>
                <div class="course-expand-grid" v-else>
                  <div v-for="course in row.activatedCourses || []" :key="`${row.id}-${course.courseId || course.id}-${course.cardCode || ''}`" class="course-expand-card">
                    <div class="course-expand-title">{{ course.courseTitle || course.title || course.courseName || course.courseId }}</div>
                    <div class="course-expand-meta">
                      <span>激活码：{{ course.cardCode || '-' }}</span>
                      <span>激活时间：{{ course.activatedAt || course.openedAt || '-' }}</span>
                      <span>课程到期：{{ course.expiresAt || course.expiry || '-' }}</span>
                      <span>科目分数：{{ course.recentExamScore || '-' }}</span>
                      <span>学生：{{ course.studentName || row.studentName || row.name || '-' }}</span>
                      <span>进度：{{ course.progress || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="用户" min-width="230">
            <template #default="{ row }">
              <div class="user-main-cell">
                <strong>{{ row.name || row.studentName || '未填写姓名' }}</strong>
                <span>ID：{{ row.id || '-' }}</span>
                <span>手机：{{ row.phone || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="身份状态" width="180">
            <template #default="{ row }">
              <div class="user-identity-cell">
                <div class="user-tag-row">
                  <el-tag :type="accountTypeTag(row)">{{ accountTypeText(row) }}</el-tag>
                  <el-tag :type="(row.status || 'active') === 'active' ? 'success' : 'danger'">{{ (row.status || 'active') === 'active' ? '正常' : '禁用' }}</el-tag>
                </div>
                <span>{{ userRoleLabel(row.role) }}</span>
                <span v-if="row.role === 'agency_admin'">名额：{{ row.activationQuota || 0 }}</span>
                <span v-else-if="row.organizationName">{{ row.organizationName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="开通课程" min-width="420">
            <template #default="{ row }">
              <div v-if="row.activatedCourses && row.activatedCourses.length" class="course-summary-list">
                <div v-for="course in visibleActivatedCourses(row)" :key="`${row.id}-${course.courseId || course.id}-${course.cardCode || ''}`" class="course-summary-item">
                  <div class="course-summary-title">{{ courseTitle(course) }}</div>
                  <div class="course-summary-meta">
                    <span>开通：{{ shortDateTime(course.activatedAt || course.openedAt) }}</span>
                    <span>到期：{{ courseExpiryText(course) }}</span>
                    <span>分数：{{ course.recentExamScore || '-' }}</span>
                  </div>
                  <div class="course-summary-code">
                    <span>{{ course.cardCode || '无激活码' }}</span>
                    <el-button v-if="course.cardCode" link type="primary" @click="copyActivationCode(course.cardCode)">复制</el-button>
                  </div>
                </div>
                <div v-if="row.activatedCourses.length > 2" class="course-summary-more">展开查看全部 {{ row.activatedCourses.length }} 门课程</div>
              </div>
              <span v-else class="muted-text">暂无开通课程</span>
            </template>
          </el-table-column>
          <el-table-column label="学生资料" min-width="220">
            <template #default="{ row }">
              <div class="student-info-cell">
                <span>{{ row.gender || '-' }} / {{ row.grade || '-' }}</span>
                <span>{{ row.schoolName || '未填学校' }}</span>
                <span>{{ row.region || '未填地区' }}</span>
              </div>
            </template>
          </el-table-column>
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

      <el-tab-pane v-if="canPanel('codes')" label="激活码管理" name="codes">
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
          <el-form :model="activationForm" class="activation-settings-form">
            <el-form-item label="激活码"><el-input v-model="activationForm.code" :disabled="!!activationForm.id" placeholder="不填自动生成9位小写字母数字" style="width: 220px" /></el-form-item>
            <el-form-item label="适用课程">
              <el-select v-model="activationForm.courseId" filterable clearable placeholder="可不选，激活时选择" style="width: 240px">
                <el-option v-for="course in fullCourseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
              </el-select>
              <div class="field-hint activation-course-hint">不选课程时，此激活码可用于任意正式课程，由激活人提交时选择。</div>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="activationForm.cardType" style="width: 150px">
                <el-option label="一年期" value="year" />
                <el-option label="72小时" value="hours72" />
                <el-option label="7天卡" value="days7" />
                <el-option label="月卡" value="month" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="activationForm.cardType === 'month'" label="每日时长">
              <el-select v-model="activationForm.dailyLimitMinutes" style="width: 150px">
                <el-option v-for="opt in dailyLimitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <div class="field-hint">月卡每日可观看时长上限，以半小时为单位；选「不限时长」则不限制。到达上限当天不能再观看课程。</div>
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
            <el-form-item class="activation-form-action"><el-button type="primary" icon="Plus" @click="submitActivationCode">{{ activationForm.id ? '保存激活码' : '新增激活码' }}</el-button></el-form-item>
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

        <el-table :data="pagedActivationList" border class="record-compact-table activation-table">
          <el-table-column label="激活码/状态" min-width="230">
            <template #default="{ row }">
              <div class="stack-cell">
                <div class="activation-code-cell">
                  <span class="activation-code-text">{{ row.code }}</span>
                  <el-button link type="primary" @click="copyActivationCode(row.code)">复制</el-button>
                </div>
                <div class="inline-meta-row">
                  <el-tag :type="activationStatusTagType(row)">{{ activationStatusText(row) }}</el-tag>
                  <span>{{ row.cardTypeText || '-' }}</span>
                  <span v-if="row.cardType === 'month' && row.dailyLimitMinutes > 0">{{ row.dailyLimitText }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="课程与归属" min-width="300">
            <template #default="{ row }">
              <div class="stack-cell">
                <strong>{{ activationCourseLabel(row) }}</strong>
                <span>归属：{{ activationOwnerLabel(row) }}</span>
                <span>ID：{{ row.ownerUserId || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="使用信息" min-width="280">
            <template #default="{ row }">
              <div class="stack-cell">
                <span>学生：{{ row.studentName || '-' }}</span>
                <span>地区：{{ row.region || '-' }}</span>
                <span>激活：{{ shortDateTime(row.activatedAt) }}</span>
                <span>到期：{{ dateOnly(row.expiresAt) || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230">
            <template #default="{ row }">
              <div class="table-action-row">
                <el-button v-if="canAssignActivation(row)" link type="primary" @click="openActivationAssign(row)">分配</el-button>
                <el-button link :type="isActivationLocked(row) ? 'success' : 'warning'" @click="toggleActivationLock(row)">{{ isActivationLocked(row) ? '解锁' : '锁定' }}</el-button>
                <el-button v-if="canUnassignActivation(row)" link type="info" @click="unassignActivationCode(row)">取消分配</el-button>
                <el-button v-if="row.usedByUserId" link type="warning" @click="clearStudentRecords(row)">清除记录</el-button>
                <el-button v-if="row.status === 'used'" link type="danger" :disabled="row.authorizationClosed" @click="closeActivationAuthorization(row)">{{ row.authorizationClosed ? '已关闭授权' : '关闭授权' }}</el-button>
                <el-button v-else link type="danger" @click="removeActivationCode(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="filteredActivationList.length > activationPager.pageSize"
          v-model:page="activationPager.pageNum"
          v-model:limit="activationPager.pageSize"
          :total="filteredActivationList.length"
          :page-sizes="[8, 12, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :auto-scroll="false"
        />
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('agencies')" label="校区管理" name="agencies">
        <el-table :data="agencyList" border class="record-compact-table agency-management-table">
          <el-table-column label="校区/账号" min-width="260">
            <template #default="{ row }">
              <div class="stack-cell">
                <strong>{{ row.agency?.organizationName || row.agency?.name || row.agency?.id }}</strong>
                <span>ID：{{ row.agency?.id || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="quota" label="名额加减" width="180">
            <template #default="{ row }">
              <el-input-number :model-value="row.quota || 0" :min="0" size="small" controls-position="right" @change="value => updateAgencyQuota(row, value)" />
            </template>
          </el-table-column>
          <el-table-column label="激活码统计" min-width="360">
            <template #default="{ row }">
              <div class="agency-metric-strip">
                <span>总数 <strong>{{ row.totalCodes || 0 }}</strong></span>
                <span>已激活 <strong>{{ row.activatedCount || 0 }}</strong></span>
                <span>未使用 <strong>{{ row.unusedCount || 0 }}</strong></span>
                <span>锁定 <strong>{{ row.lockedCount || 0 }}</strong></span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="userCount" label="用户数" width="100" />
          <el-table-column label="操作" width="110">
            <template #default="{ row }">
              <el-button link type="primary" @click="showAgencyStats(row.agency)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-card v-if="selectedUserStats && selectedUserStats.type === 'agency'" shadow="never" class="admin-block user-stats-panel">
          <template #header>{{ selectedUserStatsTitle }}</template>
          <div class="compact-stat-grid">
            <div
              class="agency-card"
              :class="{ clickable: agencyStatCardClickable(item), active: selectedAgencyDetailStatus === item.status }"
              v-for="item in selectedUserStatCards"
              :key="item.label"
              @click="selectAgencyStatCard(item)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <div class="agency-detail-toolbar">
            <span>{{ selectedAgencyDetailTitle }}</span>
            <el-button type="primary" link @click="copyVisibleAgencyCodes">复制当前激活码</el-button>
          </div>
          <el-table :data="pagedSelectedAgencyCodeRows" border class="record-compact-table agency-code-table">
            <el-table-column label="激活码/课程" min-width="280">
              <template #default="{ row }">
                <div class="stack-cell">
                  <div class="activation-code-cell">
                    <span class="activation-code-text">{{ row.code || '-' }}</span>
                    <el-button v-if="row.code" link type="primary" @click="copyActivationCode(row.code)">复制</el-button>
                  </div>
                  <strong>{{ row.courseTitle || '-' }}</strong>
                  <span>{{ row.cardTypeText || '-' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="使用人" min-width="240">
              <template #default="{ row }">
                <div class="stack-cell">
                  <span>激活人：{{ row.studentName || '-' }}</span>
                  <span>账号：{{ row.usedByName || '-' }}</span>
                  <span>分数：{{ row.recentExamScore || '-' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="学校地区" min-width="240">
              <template #default="{ row }">
                <div class="stack-cell">
                  <span>{{ row.schoolName || '未填学校' }}</span>
                  <span>{{ row.region || '未填地区' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="220">
              <template #default="{ row }">
                <div class="stack-cell">
                  <span>激活：{{ shortDateTime(row.activatedAt) }}</span>
                  <span>到期：{{ dateOnly(row.expiresAt) || '-' }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="selectedAgencyCodeRows.length > agencyCodePager.pageSize"
            v-model:page="agencyCodePager.pageNum"
            v-model:limit="agencyCodePager.pageSize"
            :total="selectedAgencyCodeRows.length"
            :page-sizes="[8, 12, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :auto-scroll="false"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('study')" label="后台记录查看" name="study">
        <el-card shadow="never" class="admin-block">
          <template #header>后台所有操作记录</template>
          <div class="record-filter-row">
            <el-date-picker
              v-model="operationQuery.dateRange"
              type="daterange"
              unlink-panels
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <el-button icon="Refresh" @click="resetOperationQuery">重置</el-button>
          </div>
          <el-table :data="pagedAdminOperationRecords" border class="record-compact-table">
            <el-table-column label="操作信息" min-width="240">
              <template #default="{ row }">
                <div class="stack-cell">
                  <strong>{{ row.type || '后台操作' }}</strong>
                  <span>操作人：{{ row.user || '-' }}</span>
                  <span>状态：{{ row.status || '-' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="360">
              <template #default="{ row }">
                <div class="stack-cell">
                  <strong>{{ row.course || '-' }}</strong>
                  <span>{{ row.detail || '-' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="180" />
          </el-table>
          <pagination
            v-show="filteredAdminOperationRecords.length > operationPager.pageSize"
            v-model:page="operationPager.pageNum"
            v-model:limit="operationPager.pageSize"
            :total="filteredAdminOperationRecords.length"
            :page-sizes="[8, 12, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :auto-scroll="false"
          />
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
                <el-table-column prop="reply" label="AI回答" show-overflow-tooltip />
                <el-table-column prop="createdAt" label="时间" width="170" />
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="openAiChatEdit(row)">编辑</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane v-if="canPanel('ratings')" label="课程打分统计" name="ratings">
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

      <el-tab-pane v-if="canPanel('vocabulary')" label="外语词汇系统" name="vocabulary">
        <el-card shadow="never" class="admin-block">
          <template #header>外语词汇系统</template>
          <div class="empty-editor">预留模块，后续可接入词汇库、词汇练习与记忆统计。</div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="subAccountOpen" :title="subAccountForm.userId ? '编辑后台小号' : '开通后台小号'" width="720px" append-to-body>
      <el-form :model="subAccountForm" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="登录账号">
              <el-input v-model="subAccountForm.userName" :disabled="!!subAccountForm.userId" maxlength="30" placeholder="用于登录后台" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号名称">
              <el-input v-model="subAccountForm.nickName" maxlength="30" placeholder="例如：课程运营" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录密码">
              <el-input v-model="subAccountForm.password" type="password" show-password :placeholder="subAccountForm.userId ? '留空则不修改' : '请输入初始密码'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号状态">
              <el-switch v-model="subAccountForm.status" active-value="0" inactive-value="1" active-text="正常" inactive-text="停用" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="subAccountForm.phonenumber" maxlength="11" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="subAccountForm.email" maxlength="50" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="授权板块">
              <el-checkbox-group v-model="subAccountForm.permissionKeys" class="permission-checks">
                <el-checkbox v-for="item in subAccountPermissionOptions" :key="item.key" :label="item.key" border>
                  <div class="permission-check-content">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.description }}</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="subAccountOpen = false">取消</el-button>
        <el-button type="primary" :loading="subAccountSaving" @click="submitSubAccount">保存小号</el-button>
      </template>
    </el-dialog>

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
            <el-col :span="6"><el-form-item label="学习人数"><el-input-number v-model="courseForm.studyCount" :min="0" :precision="0" style="width: 100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="状态"><el-switch v-model="courseForm.status" active-value="published" inactive-value="draft" active-text="发布" inactive-text="草稿" /></el-form-item></el-col>
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
                <el-switch v-model="chapter.visible" inline-prompt active-text="显示" inactive-text="隐藏" class="visibility-switch" />
                <el-tooltip content="删除章节" placement="top">
                  <el-button text type="danger" icon="Delete" @click.stop="removeCourseChapter(index)">删除</el-button>
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
                  <div class="lesson-editor-actions">
                    <el-button type="danger" plain icon="Delete" @click="removeCourseChapter(activeChapterIndex)">删除章节</el-button>
                    <el-button type="primary" icon="Plus" @click="addCourseLesson">增加章节内容</el-button>
                  </div>
                </div>

                <div v-if="!activeLessons.length" class="empty-editor">当前章节还没有内容。</div>
                <div v-for="(lesson, index) in activeLessons" :key="index" class="lesson-row">
                  <div class="lesson-title-cell">
                    <el-input v-model="lesson.title" placeholder="输入章节内容名称" class="lesson-title-input" />
                    <el-button type="danger" plain icon="Delete" class="lesson-delete-action" @click="removeCourseLesson(index)">删除小节</el-button>
                  </div>
                  <el-input-number v-model="lesson.sort" :min="1" controls-position="right" placeholder="排序" class="lesson-sort-input" />
                  <el-switch v-model="lesson.visible" inline-prompt active-text="显示" inactive-text="隐藏" class="visibility-switch" />
                  <div class="lesson-video-cell">
                    <file-upload v-model="lesson.videoUrl" :limit="1" :file-size="1024" :file-type="['mp4', 'mov', 'm4v', 'webm']" />
                    <el-switch v-model="lesson.children[0].visible" inline-prompt active-text="显示" inactive-text="隐藏" class="child-visible-switch" />
                  </div>
                  <div class="lesson-question-cell">
                    <el-input v-model="lesson.questionBankName" placeholder="输入题库名称" class="question-bank-input" />
                    <div class="lesson-question-actions">
                      <el-button type="primary" plain @click="openQuestionPicker('lesson', lesson)">选择题库题目</el-button>
                      <el-tag v-if="questionCount(lesson)" type="info">已选 {{ questionCount(lesson) }} 题</el-tag>
                      <el-switch v-model="lesson.children[1].visible" inline-prompt active-text="显示" inactive-text="隐藏" class="child-visible-switch" />
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
              <el-switch v-model="quiz.visible" inline-prompt active-text="显示" inactive-text="隐藏" class="visibility-switch" />
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
          <el-select v-model="docForm.courseId" filterable placeholder="选择正式课程" style="width: 100%">
            <el-option v-for="course in fullCourseOptions" :key="course.id" :label="course.optionLabel" :value="course.id" />
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

    <el-dialog v-model="questionOpen" :title="questionForm.id ? '编辑题目' : '新增题目'" width="1000px" class="question-edit-dialog" append-to-body>
      <el-form :model="questionForm" label-width="90px">
        <el-form-item label="题型类型">
          <el-radio-group v-model="questionForm.questionType" class="question-type-group">
            <el-radio-button v-for="item in questionTypeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
          <div class="field-hint">可填：选择题、填空题、主观题、阅读理解类题；公式示例 $f(x)=\ln(1+x)-\frac{2x}{x+2}$，先选中文字再点“下划线”即可标注。</div>
        </el-form-item>
        <el-form-item label="题干">
          <div class="question-media-editor">
            <div class="question-media-pane">
              <div class="pane-label">{{ questionForm.questionType === 'reading' ? '阅读题干（大题干 / 阅读材料）' : '文字题干' }}</div>
              <div class="markup-toolbar">
                <el-button size="small" icon="EditPen" @mousedown.prevent="insertQuestionMarkup('stem', 'inlineMath')">行内公式</el-button>
                <el-button size="small" icon="Collection" @mousedown.prevent="insertQuestionMarkup('stem', 'displayMath')">独立公式</el-button>
                <el-button size="small" icon="Minus" @mousedown.prevent="insertQuestionMarkup('stem', 'underline')">下划线</el-button>
              </div>
              <el-input
                v-model="questionForm.stem"
                type="textarea"
                :rows="questionForm.questionType === 'reading' ? 6 : 4"
                :placeholder="questionForm.questionType === 'reading' ? '输入阅读材料或大题干，下面可继续添加多个问题和选项' : '输入题干文字，支持 LaTeX 公式和 __下划线文字__'"
                @select="rememberMarkupSelection(markupFieldKey('stem'), $event)"
                @mouseup="rememberMarkupSelection(markupFieldKey('stem'), $event)"
                @keyup="rememberMarkupSelection(markupFieldKey('stem'), $event)"
                @focus="rememberMarkupSelection(markupFieldKey('stem'), $event)"
              />
              <div v-if="questionForm.stem" class="math-preview" v-html="mathHtml(questionForm.stem)"></div>
            </div>
            <div class="question-media-pane upload-pane">
              <div class="pane-label">题干图片</div>
              <image-upload v-model="questionForm.stemImageUrl" :limit="10" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
              <div class="field-hint">可上传多张，拖动图片可排序。</div>
              <div class="pane-label file-pane-label">题干文档</div>
              <file-upload v-model="questionForm.stemFileUrl" :limit="1" :file-size="500" :file-type="['pdf', 'doc', 'docx']" />
              <div class="pane-label file-pane-label">听力音频（题干下方播放）</div>
              <file-upload v-model="questionForm.stemAudioUrl" :limit="1" :file-size="50" :file-type="['mp3', 'm4a', 'wav', 'aac', 'ogg', 'mp4']" />
              <audio v-if="questionForm.stemAudioUrl" class="question-audio-player" :src="mediaUrl(questionForm.stemAudioUrl)" controls preload="metadata"></audio>
            </div>
          </div>
        </el-form-item>
        <template v-if="questionForm.questionType === 'choice'">
          <el-form-item label="选项">
            <div class="question-media-editor">
              <div class="question-media-pane">
                <div class="pane-label">文字选项</div>
                <div class="markup-toolbar">
                  <el-button size="small" icon="EditPen" @mousedown.prevent="insertQuestionMarkup('optionsText', 'inlineMath')">行内公式</el-button>
                  <el-button size="small" icon="Minus" @mousedown.prevent="insertQuestionMarkup('optionsText', 'underline')">下划线</el-button>
                </div>
                <el-input
                  v-model="questionForm.optionsText"
                  type="textarea"
                  :rows="4"
                  placeholder="每行一个选项；如只有图片，可留空并按顺序上传图片"
                  @select="rememberMarkupSelection(markupFieldKey('optionsText'), $event)"
                  @mouseup="rememberMarkupSelection(markupFieldKey('optionsText'), $event)"
                  @keyup="rememberMarkupSelection(markupFieldKey('optionsText'), $event)"
                  @focus="rememberMarkupSelection(markupFieldKey('optionsText'), $event)"
                />
                <div v-if="questionForm.optionsText" class="math-preview" v-html="mathHtml(questionForm.optionsText)"></div>
              </div>
              <div class="question-media-pane upload-pane">
                <div class="pane-label">选项图片</div>
                <image-upload v-model="questionForm.optionImageUrlsText" :limit="20" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
                <div class="field-hint">按上传顺序对应 A、B、C...；支持 7 选五等多选项，拖动图片可排序。</div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="答案序号">
            <el-input-number v-model="questionForm.answer" :min="1" />
            <div class="field-hint">从 1 开始填写：1=A，2=B，4=D，7=G。</div>
          </el-form-item>
        </template>
        <template v-else-if="questionForm.questionType === 'reading'">
          <el-form-item label="小题">
            <div class="reading-question-editor">
              <div class="reading-question-head">
                <div>
                  <strong>阅读理解类题</strong>
                  <span>一个阅读题干下可添加多个问题，每个问题单独设置题干、选项和答案。</span>
                </div>
                <el-button type="primary" plain icon="Plus" @click="addReadingSubQuestion">添加问题选项</el-button>
              </div>
              <div v-if="!questionForm.subQuestions.length" class="empty-editor">请至少添加 1 个小题。</div>
              <div v-for="(sub, subIndex) in questionForm.subQuestions" :key="sub.uid || sub.id || subIndex" class="reading-sub-editor">
                <div class="reading-sub-editor-head">
                  <strong>问题 {{ subIndex + 1 }}</strong>
                  <div class="reading-sub-actions">
                    <el-select v-model="sub.questionType" class="reading-sub-type">
                      <el-option label="选择题" value="choice" />
                      <el-option label="填空题" value="fill" />
                      <el-option label="主观题" value="subjective" />
                    </el-select>
                    <el-button link type="danger" icon="Delete" @click="removeReadingSubQuestion(subIndex)">删除</el-button>
                  </div>
                </div>
                <div class="pane-label">问题 {{ subIndex + 1 }} 题干</div>
                <div class="markup-toolbar">
                  <el-button size="small" icon="EditPen" @mousedown.prevent="insertSubQuestionMarkup(sub, 'stem', 'inlineMath')">行内公式</el-button>
                  <el-button size="small" icon="Minus" @mousedown.prevent="insertSubQuestionMarkup(sub, 'stem', 'underline')">下划线</el-button>
                </div>
                <el-input
                  v-model="sub.stem"
                  type="textarea"
                  :rows="2"
                  placeholder="输入小题问题"
                  @select="rememberMarkupSelection(subMarkupFieldKey(sub, 'stem'), $event)"
                  @mouseup="rememberMarkupSelection(subMarkupFieldKey(sub, 'stem'), $event)"
                  @keyup="rememberMarkupSelection(subMarkupFieldKey(sub, 'stem'), $event)"
                  @focus="rememberMarkupSelection(subMarkupFieldKey(sub, 'stem'), $event)"
                />
                <div v-if="sub.stem" class="math-preview compact" v-html="mathHtml(sub.stem)"></div>
                <template v-if="sub.questionType === 'choice'">
                  <div class="pane-label file-pane-label">问题 {{ subIndex + 1 }} 选项</div>
                  <div class="markup-toolbar">
                    <el-button size="small" icon="EditPen" @mousedown.prevent="insertSubQuestionMarkup(sub, 'optionsText', 'inlineMath')">行内公式</el-button>
                    <el-button size="small" icon="Minus" @mousedown.prevent="insertSubQuestionMarkup(sub, 'optionsText', 'underline')">下划线</el-button>
                  </div>
                  <el-input
                    v-model="sub.optionsText"
                    type="textarea"
                    :rows="3"
                    placeholder="每行一个选项，例如 A/B/C/D 对应 4 行"
                    @select="rememberMarkupSelection(subMarkupFieldKey(sub, 'optionsText'), $event)"
                    @mouseup="rememberMarkupSelection(subMarkupFieldKey(sub, 'optionsText'), $event)"
                    @keyup="rememberMarkupSelection(subMarkupFieldKey(sub, 'optionsText'), $event)"
                    @focus="rememberMarkupSelection(subMarkupFieldKey(sub, 'optionsText'), $event)"
                  />
                  <div class="reading-answer-row">
                    <span class="reading-answer-label">参考答案选项</span>
                    <el-input-number v-model="sub.answer" :min="1" controls-position="right" class="reading-answer-input" />
                    <span class="field-hint">答案序号从 1 开始：1=A，2=B，3=C。</span>
                  </div>
                  <div v-if="sub.optionsText" class="math-preview compact" v-html="mathHtml(sub.optionsText)"></div>
                </template>
                <template v-else>
                  <div class="pane-label file-pane-label">参考答案</div>
                  <el-input
                    v-model="sub.answerText"
                    type="textarea"
                    :rows="sub.questionType === 'fill' ? 2 : 3"
                    :placeholder="sub.questionType === 'fill' ? '多个可接受答案可换行' : '填写参考答案或评分要点'"
                  />
                </template>
              </div>
              <el-button class="reading-add-question-btn" type="primary" plain icon="Plus" @click="addReadingSubQuestion">添加问题选项</el-button>
            </div>
          </el-form-item>
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
              <image-upload v-model="questionForm.answerImageUrl" :limit="10" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
              <div class="field-hint">可上传多张，拖动图片可排序。</div>
              <div class="pane-label file-pane-label">答案文档</div>
              <file-upload v-model="questionForm.answerFileUrl" :limit="1" :file-size="500" :file-type="['pdf', 'doc', 'docx']" />
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
          <image-upload v-model="questionForm.analysisImageUrl" :limit="10" :file-size="20" :file-type="['png', 'jpg', 'jpeg', 'webp']" />
          <div class="field-hint">可上传多张，拖动图片可排序。</div>
        </el-form-item>
        <el-form-item label="解析文档">
          <file-upload v-model="questionForm.analysisFileUrl" :limit="1" :file-size="500" :file-type="['pdf', 'doc', 'docx']" />
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
          <el-checkbox :label="question.id" class="question-option-checkbox">
            <span>选择</span>
          </el-checkbox>
          <div class="question-option-main">
            <div class="question-option-stem math-rich-preview" v-html="mathHtml(questionPickerStem(question))"></div>
            <audio v-if="stemAudioUrl(question)" class="question-audio-player question-picker-audio" :src="stemAudioUrl(question)" controls preload="metadata"></audio>
            <div v-if="stemImageList(question).length || optionImageList(question).length" class="question-option-images">
              <el-image
                v-if="stemImageList(question).length"
                class="question-picker-thumb"
                :src="stemImageList(question)[0]"
                fit="cover"
                :preview-src-list="stemImageList(question)"
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
              <el-button class="question-view-button" size="small" type="primary" plain @click.stop="openQuestionDetail(question)">查看题目</el-button>
            </div>
          </div>
        </div>
      </el-checkbox-group>
      <div v-if="!filteredQuestionOptions.length" class="empty-editor">没有匹配的题目。</div>
      <template #footer>
        <el-button @click="questionPickerOpen = false">取消</el-button>
        <el-button type="primary" @click="applyQuestionSelection">加入所选题目</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="questionDetailOpen" title="题目详情" width="780px" class="question-detail-dialog" append-to-body>
      <div v-if="questionDetail" class="question-detail-view">
        <div class="question-detail-tags">
          <el-tag size="small" :type="questionTypeTag(questionDetail)">{{ questionTypeLabel(questionDetail.questionType) }}</el-tag>
          <el-tag v-if="questionSubjectLabel(questionDetail) !== '-'" size="small" type="success">{{ questionSubjectLabel(questionDetail) }}</el-tag>
          <el-tag v-if="questionDetail.knowledge" size="small">{{ questionDetail.knowledge }}</el-tag>
          <el-tag v-if="questionDetail.province" size="small" type="info">{{ questionDetail.province }}</el-tag>
        </div>
        <div class="question-detail-section">
          <div class="question-detail-label">{{ normalizeQuestionType(questionDetail.questionType) === 'reading' ? '阅读材料' : '题干' }}</div>
          <div class="question-detail-content math-rich-preview" v-html="mathHtml(questionStemText(questionDetail) || '未填写题干')"></div>
          <audio v-if="stemAudioUrl(questionDetail)" class="question-audio-player" :src="stemAudioUrl(questionDetail)" controls preload="metadata"></audio>
          <div v-if="stemImageList(questionDetail).length" class="question-detail-images">
            <el-image
              v-for="(url, index) in stemImageList(questionDetail)"
              :key="`${url}-${index}`"
              class="question-picker-thumb"
              :src="url"
              fit="cover"
              :preview-src-list="stemImageList(questionDetail)"
              :initial-index="index"
              preview-teleported
            />
          </div>
        </div>
        <template v-if="normalizeQuestionType(questionDetail.questionType) === 'reading'">
          <div v-for="(sub, subIndex) in readingSubQuestions(questionDetail)" :key="sub.id || sub.uid || subIndex" class="question-detail-section sub">
            <div class="question-detail-label">问题 {{ subIndex + 1 }}</div>
            <div class="question-detail-content math-rich-preview" v-html="mathHtml(questionStemText(sub) || '未填写小题题干')"></div>
            <div v-if="normalizeQuestionType(sub.questionType) === 'choice'" class="question-detail-options">
              <div v-for="(option, optionIndex) in questionOptions(sub)" :key="optionIndex" class="question-detail-option">
                <span>{{ String.fromCharCode(65 + optionIndex) }}.</span>
                <div class="math-rich-preview" v-html="mathHtml(option || '图片选项')"></div>
              </div>
            </div>
            <div class="question-detail-answer">参考答案：{{ readingSubAnswerLabel(sub) }}</div>
          </div>
        </template>
        <template v-else-if="normalizeQuestionType(questionDetail.questionType) === 'choice'">
          <div class="question-detail-section">
            <div class="question-detail-label">选项</div>
            <div class="question-detail-options">
              <div v-for="(option, optionIndex) in questionOptions(questionDetail)" :key="optionIndex" class="question-detail-option">
                <span>{{ String.fromCharCode(65 + optionIndex) }}.</span>
                <div class="math-rich-preview" v-html="mathHtml(option || '图片选项')"></div>
              </div>
            </div>
            <div v-if="optionImageList(questionDetail).length" class="question-detail-images">
              <el-image
                v-for="(url, index) in optionImageList(questionDetail)"
                :key="`${url}-${index}`"
                class="question-picker-thumb"
                :src="url"
                fit="cover"
                :preview-src-list="optionImageList(questionDetail)"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
        </template>
        <div class="question-detail-section">
          <div class="question-detail-label">参考答案</div>
          <div class="question-detail-answer math-rich-preview" v-html="mathHtml(questionAnswerLabel(questionDetail))"></div>
        </div>
        <div v-if="questionDetail.analysis" class="question-detail-section">
          <div class="question-detail-label">解析</div>
          <div class="question-detail-content math-rich-preview" v-html="mathHtml(questionDetail.analysis)"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="questionDetailOpen = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userEditOpen" title="修改用户信息" width="860px" class="user-edit-dialog" append-to-body>
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
          <el-col :span="12"><el-form-item label="性别"><el-select v-model="userEditForm.gender" clearable style="width: 100%"><el-option v-for="item in genderOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="年级"><el-input v-model="userEditForm.grade" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="学校"><el-input v-model="userEditForm.schoolName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="地区"><el-input v-model="userEditForm.region" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="机构/校区"><el-input v-model="userEditForm.organizationName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="激活名额"><el-input-number v-model="userEditForm.activationQuota" :min="0" controls-position="right" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <div class="user-course-editor">
          <div class="user-course-editor-head">
            <div>
              <strong>已开通课程</strong>
              <span>课程到期时间控制前端课程有效期；报名时近期考试分数用于学习报告与统计展示。</span>
            </div>
          </div>
          <div class="user-course-param-note">
            <div><strong>课程到期时间</strong><span>到期后前端课程卡会按有效期显示。</span></div>
            <div><strong>报名时近期考试分数</strong><span>用于学习报告、分校统计和学员基础分记录。</span></div>
          </div>
          <div v-if="!userEditForm.activatedCourses.length" class="empty-editor">暂无已开通课程</div>
          <div v-else class="user-course-editor-list">
            <div v-for="course in userEditForm.activatedCourses" :key="`${course.courseId}-${course.cardCode || ''}`" class="user-course-editor-row">
              <div class="user-course-editor-main">
                <strong>{{ courseTitle(course) }}</strong>
                <span>激活码：{{ course.cardCode || '-' }} · 开通：{{ shortDateTime(course.activatedAt || course.openedAt) }}</span>
              </div>
              <div class="user-course-field">
                <span>课程到期时间</span>
                <el-date-picker v-model="course.expiresAt" value-format="YYYY-MM-DD" type="date" placeholder="选择到期日期" style="width: 100%" />
              </div>
              <div class="user-course-field">
                <span>报名时近期考试分数</span>
                <el-input v-model="course.recentExamScore" placeholder="如 60" />
              </div>
            </div>
          </div>
        </div>
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

    <el-dialog v-model="studyCountOpen" title="修改学习人数" width="420px" append-to-body>
      <el-form :model="studyCountForm" label-width="88px">
        <el-form-item label="课程">
          <div class="study-count-course-name">{{ studyCountForm.courseName || studyCountForm.id }}</div>
        </el-form-item>
        <el-form-item label="学习人数">
          <el-input-number v-model="studyCountForm.studyCount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="studyCountOpen = false">取消</el-button>
        <el-button type="primary" :loading="studyCountSaving" @click="submitStudyCount">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="aiChatEditOpen" title="编辑 AI 问答" width="640px" append-to-body>
      <el-form :model="aiChatEditForm" label-width="88px">
        <el-form-item label="上下文">
          <el-input v-model="aiChatEditForm.context" placeholder="课程或章节上下文" />
        </el-form-item>
        <el-form-item label="问题">
          <el-input v-model="aiChatEditForm.message" type="textarea" :rows="3" placeholder="学生提问内容" />
        </el-form-item>
        <el-form-item label="AI回答">
          <el-input v-model="aiChatEditForm.reply" type="textarea" :rows="5" placeholder="AI回答内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiChatEditOpen = false">取消</el-button>
        <el-button type="primary" :loading="aiChatSaving" @click="submitAiChatEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CourseManage">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addCourse,
  addOrder,
  addSubAccount,
  activateCourseByCode,
  closeActivationCodeAuthorization,
  clearActivationStudyRecords,
  closeOrder,
  deleteActivationCode,
  deleteCourse,
  deleteDoc,
  deleteQuestion,
  deleteSubAccount,
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
  listSubAccountPermissions,
  listSubAccounts,
  listUsers,
  saveActivationCode,
  saveDoc,
  saveFrontendSettings,
  saveQuestion,
  updateSubAccount,
  updateUserRole,
  updateAiChat,
  updateCourse
} from '@/api/course'
import AgreementEditor from './components/AgreementEditor.vue'
import useUserStore from '@/store/modules/user'
import { renderMath } from '@/utils/mathRender'

const mediaBaseUrl = import.meta.env.VITE_APP_BASE_API || ''
const activeTab = ref('frontend')
const userStore = useUserStore()
const loading = ref(false)
const dashboard = reactive({})
const courseQuery = reactive({ stage: '', kind: '' })
const docQuery = reactive({ courseId: '', category: '' })
const questionQuery = reactive({ subject: '', type: '' })
const userQuery = reactive({ keyword: '', role: '', status: '', courseStatus: '' })
const operationQuery = reactive({ dateRange: [] })
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
const selectedAgencyDetailStatus = ref('all')
const subAccountList = ref([])
const subAccountPermissionOptions = ref([])
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
const studyCountOpen = ref(false)
const aiChatEditOpen = ref(false)
const subAccountOpen = ref(false)
const activationAssignOpen = ref(false)
const editingCourseId = ref('')
const courseForm = reactive(defaultCourseForm())
const docForm = reactive(defaultDocForm())
const questionForm = reactive(defaultQuestionForm())
const userEditForm = reactive(defaultUserEditForm())
const studyCountForm = reactive({ id: '', courseName: '', studyCount: 0 })
const aiChatEditForm = reactive({ id: '', context: '', message: '', reply: '' })
const aiChatSaving = ref(false)
const studyCountSaving = ref(false)
const orderSubmitting = ref(false)
const orderRecordTab = ref('orders')
const selectedUserStats = ref(null)
const selectedRatingCourseKey = ref('')
const selectedRatingDetailId = ref('')
const orderPager = reactive(defaultLocalPager(8))
const operationPager = reactive(defaultLocalPager(8))
const activationPager = reactive(defaultLocalPager(8))
const agencyCodePager = reactive(defaultLocalPager(8))
const orderForm = reactive({ userId: '56596', courseId: 'gk-math-full', cardCode: '', cardType: 'year', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const codeActivateForm = reactive({ userId: '56596', code: '', courseId: '', studentName: '', gender: '', recentExamScore: '', grade: '', schoolName: '', region: '' })
const activationQuery = reactive({ keyword: '', status: '', owner: '' })
const activationForm = reactive({ id: '', code: '', courseId: '', cardType: 'year', dailyLimitMinutes: 0, ownerUserId: '', status: 'available', remark: '' })
// 月卡每日观看时长上限选项（半小时为单位）
const dailyLimitOptions = (() => {
  const list = [{ value: 0, label: '不限时长' }]
  for (let m = 30; m <= 480; m += 30) {
    list.push({ value: m, label: (m % 60 === 0 ? (m / 60) : (m / 60).toFixed(1)) + ' 小时' })
  }
  return list
})()
const activationAssignForm = reactive({ id: '', code: '', ownerUserId: '' })
const subAccountForm = reactive(defaultSubAccountForm())
const subAccountSaving = ref(false)
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
const questionDetailOpen = ref(false)
const questionDetail = ref(null)
const markupSelections = reactive({})
const contentModes = [
  { label: '章节扫雷', value: 'chapterQuiz', buttonLabel: '添加章节扫雷内容' },
  { label: '复习加强课', value: 'review' },
  { label: '技巧绝招课', value: 'tactics' },
  { label: '知识巩固', value: 'knowledge' }
]
const questionTypeOptions = [
  { label: '选择题', value: 'choice' },
  { label: '填空题', value: 'fill' },
  { label: '主观题', value: 'subjective' },
  { label: '阅读理解类题', value: 'reading' }
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
const allPermission = '*:*:*'
const panelPermissions = {
  frontend: ['course:settings:view', 'course:settings:edit'],
  courses: ['course:courses:list', 'course:courses:add', 'course:courses:edit', 'course:courses:remove'],
  docs: ['course:docs:list', 'course:docs:add', 'course:docs:edit', 'course:docs:remove'],
  questions: ['course:questions:list', 'course:questions:add', 'course:questions:edit', 'course:questions:remove'],
  orders: ['course:orders:list', 'course:orders:add', 'course:orders:edit', 'course:orders:close', 'course:auth:list', 'course:auth:edit'],
  users: ['course:users:list', 'course:users:edit'],
  codes: ['course:codes:list', 'course:codes:add', 'course:codes:edit', 'course:codes:remove', 'course:codes:close'],
  agencies: ['course:agencies:list', 'course:agencies:edit'],
  study: ['course:study:list'],
  ratings: ['course:ratings:list'],
  vocabulary: ['course:vocabulary:view']
}
const panelOrder = ['subAccounts', 'frontend', 'courses', 'docs', 'questions', 'orders', 'users', 'codes', 'agencies', 'study', 'ratings', 'vocabulary']

const visiblePanelNames = computed(() => panelOrder.filter(name => canPanel(name)))
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
  }).sort((a, b) => activationSortValue(b) - activationSortValue(a))
})
const sortedOrderList = computed(() => [...orderList.value].sort((a, b) => orderSortValue(b) - orderSortValue(a)))
const pagedOrderList = computed(() => paginateRows(sortedOrderList.value, orderPager))
const pagedActivationList = computed(() => paginateRows(filteredActivationList.value, activationPager))
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
const fullCourseOptions = computed(() => courseOptions.value.filter(isFullCourseOption))
const docCourseOptions = computed(() => fullCourseOptions.value.length ? fullCourseOptions.value : courseOptions.value)
const filteredDocList = computed(() => {
  const courseId = String(docQuery.courseId || '').trim()
  const category = String(docQuery.category || '').trim()
  return docList.value.filter(doc => {
    const matchedCourse = !courseId || String(doc.courseId || '') === courseId
    const matchedCategory = !category || String(doc.category || 'lecture') === category
    return matchedCourse && matchedCategory
  })
})
const filteredQuestionList = computed(() => {
  const subject = compactText(questionQuery.subject)
  const type = String(questionQuery.type || '').trim()
  return questionList.value.filter(question => {
    const questionSubject = compactText(questionSubjectLabel(question))
    const matchedSubject = !subject || questionSubject.includes(subject)
    const matchedType = !type || normalizeQuestionType(question.questionType) === type
    return matchedSubject && matchedType
  })
})
const questionStatChips = computed(() => {
  const list = [{ label: '总题目数', value: questionList.value.length, filterType: 'all', filterValue: '' }]
  questionTypeOptions.forEach(item => {
    list.push({
      label: `${item.label}数`,
      value: questionList.value.filter(question => normalizeQuestionType(question.questionType) === item.value).length,
      filterType: 'type',
      filterValue: item.value
    })
  })
  questionSubjectStats.forEach(label => {
    const normalized = compactText(label)
    const value = questionList.value.filter(question => questionSubjectLabel(question).replace(/\s/g, '').includes(normalized)).length
    list.push({ label: `${label}题数`, value, filterType: 'subject', filterValue: label })
  })
  return list
})

function isFullCourseOption(course = {}) {
  const kind = String(course.kind || '').trim()
  if (kind) return kind === 'full'
  if (course.isTry === true || course.openMode === 'trial') return false
  const id = String(course.id || '').toLowerCase()
  const text = `${course.courseName || ''} ${course.introduction || ''} ${course.title || ''}`.toLowerCase()
  if (id.includes('trial') || text.includes('试听')) return false
  return id.endsWith('-full') || text.length > 0
}
const subAccountPermissionMap = computed(() => {
  const map = {}
  subAccountPermissionOptions.value.forEach(item => {
    map[item.key] = item.label
  })
  return map
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
const filteredAdminOperationRecords = computed(() => {
  const range = Array.isArray(operationQuery.dateRange) ? operationQuery.dateRange : []
  const start = dateOnly(range[0])
  const end = dateOnly(range[1])
  return adminOperationRecords.value.filter(row => {
    const day = dateOnly(row.time)
    if (start && day < start) return false
    if (end && day > end) return false
    return true
  })
})
const pagedAdminOperationRecords = computed(() => paginateRows(filteredAdminOperationRecords.value, operationPager))
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
      { label: '激活码总数', value: stats.totalCodes || 0, status: 'all' },
      { label: '未使用激活码', value: stats.unusedCount || 0, status: 'unused' },
      { label: '已使用激活码', value: stats.activatedCount || 0, status: 'used' },
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
const selectedAgencyDetailTitle = computed(() => {
  if (selectedAgencyDetailStatus.value === 'used') return '已使用激活码明细'
  if (selectedAgencyDetailStatus.value === 'unused') return '未使用激活码明细'
  return '激活码总数明细'
})
const selectedAgencyCodeRows = computed(() => {
  const stats = selectedUserStats.value || {}
  const rows = Array.isArray(stats.codes) ? stats.codes : []
  const status = selectedAgencyDetailStatus.value
  return rows.filter(item => {
    if (status === 'used') return item.status === 'used'
    if (status === 'unused') return item.status !== 'used'
    return true
  }).map(item => ({
    ...item,
    usedByName: item.usedByName || item.studentName || '',
    courseTitle: item.courseTitle || item.subject || item.courseId || '-',
    cardTypeText: item.cardTypeText || item.durationText || '-'
  }))
})
const pagedSelectedAgencyCodeRows = computed(() => paginateRows(selectedAgencyCodeRows.value, agencyCodePager))
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
function questionIndexMethod(index) {
  return index + 1
}

function setQuestionQuickFilter(item = {}) {
  if (item.filterType === 'all') {
    questionQuery.subject = ''
    questionQuery.type = ''
    return
  }
  if (item.filterType === 'subject') {
    questionQuery.subject = item.filterValue || ''
    questionQuery.type = ''
    return
  }
  if (item.filterType === 'type') {
    questionQuery.type = item.filterValue || ''
    questionQuery.subject = ''
  }
}

function isQuestionChipActive(item = {}) {
  if (item.filterType === 'all') {
    return !questionQuery.subject && !questionQuery.type
  }
  if (item.filterType === 'subject') {
    return compactText(questionQuery.subject) === compactText(item.filterValue)
  }
  if (item.filterType === 'type') {
    return questionQuery.type === item.filterValue
  }
  return false
}

const filteredQuestionOptions = computed(() => {
  const keyword = questionPickerKeyword.value.trim().toLowerCase()
  const subject = String(questionPickerSubject.value || '').replace(/\s/g, '')
  return questionList.value.filter(question => {
    const text = [
      questionStemText(question),
      questionOptions(question).join(' '),
      readingSubQuestions(question).map(sub => `${questionStemText(sub)} ${questionOptions(sub).join(' ')}`).join(' '),
      question.knowledge || '',
      question.province || '',
      questionSubjectLabel(question)
    ].join(' ').toLowerCase()
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

watch(visiblePanelNames, (names) => {
  if (!names.includes(activeTab.value)) {
    activeTab.value = names[0] || ''
  }
}, { immediate: true })

watch([() => activationQuery.keyword, () => activationQuery.status, () => activationQuery.owner], () => resetPager(activationPager))
watch([() => operationQuery.dateRange?.[0], () => operationQuery.dateRange?.[1]], () => resetPager(operationPager))
watch(selectedAgencyDetailStatus, () => resetPager(agencyCodePager))
watch(orderRecordTab, () => {
  resetPager(orderPager)
  resetPager(operationPager)
})

watch(() => questionForm.questionType, (type) => {
  if (normalizeQuestionType(type) === 'reading' && !questionForm.subQuestions.length) {
    questionForm.subQuestions = [defaultReadingSubQuestion()]
  }
})

async function loadAll() {
  const tasks = []
  if (visiblePanelNames.value.length) {
    tasks.push(loadDashboard())
  }
  if (needsCourseData()) {
    tasks.push(loadCourseOptions())
  }
  if (canPanel('courses') || canPanel('ratings')) {
    tasks.push(loadCourses())
  }
  if (canPanel('docs')) tasks.push(loadDocsData())
  if (canPanel('questions')) tasks.push(loadQuestionsData())
  if (needsUsersData()) tasks.push(loadUsersData())
  if (canPanel('codes')) tasks.push(loadActivationData())
  if (canPanel('agencies')) tasks.push(loadAgencyData())
  if (canPanel('orders')) {
    tasks.push(loadAuthData(), loadOrdersData())
  }
  if (canPanel('study')) tasks.push(loadStudyData())
  if (canPanel('frontend')) tasks.push(loadFrontendSettings())
  if (canPanel('subAccounts')) {
    tasks.push(loadSubAccountPermissions(), loadSubAccountsData())
  }
  await Promise.all(tasks)
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

async function loadSubAccountPermissions() {
  const res = await listSubAccountPermissions()
  subAccountPermissionOptions.value = res.data || []
}

async function loadSubAccountsData() {
  const res = await listSubAccounts()
  subAccountList.value = res.data || []
}

function canPanel(name) {
  if (name === 'subAccounts') return isSuperAdmin()
  return isSuperAdmin() || hasAnyPermi(panelPermissions[name] || [])
}

function isSuperAdmin() {
  return userStore.roles.includes('admin') || userStore.permissions.includes(allPermission)
}

function hasAnyPermi(permissions = []) {
  return permissions.some(permission => hasPermi(permission))
}

function hasPermi(permission = '') {
  return userStore.permissions.includes(allPermission) || userStore.permissions.includes(permission)
}

function needsCourseData() {
  return ['courses', 'docs', 'questions', 'orders', 'codes', 'agencies', 'ratings'].some(canPanel)
}

function needsUsersData() {
  return ['users', 'orders', 'codes', 'agencies'].some(canPanel)
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

function openSubAccountDialog(row = null) {
  Object.assign(subAccountForm, defaultSubAccountForm())
  if (row) {
    Object.assign(subAccountForm, {
      userId: row.userId,
      userName: row.userName,
      nickName: row.nickName,
      phonenumber: row.phonenumber || '',
      email: row.email || '',
      status: row.status || '0',
      permissionKeys: [...(row.permissionKeys || [])]
    })
  }
  subAccountOpen.value = true
}

async function submitSubAccount() {
  if (!subAccountForm.userName.trim()) {
    ElMessage.warning('请输入登录账号')
    return
  }
  if (!subAccountForm.nickName.trim()) {
    ElMessage.warning('请输入账号名称')
    return
  }
  if (!subAccountForm.userId && !subAccountForm.password.trim()) {
    ElMessage.warning('请输入初始密码')
    return
  }
  if (!subAccountForm.permissionKeys.length) {
    ElMessage.warning('请至少选择一个授权板块')
    return
  }
  subAccountSaving.value = true
  try {
    const payload = {
      userName: subAccountForm.userName.trim(),
      nickName: subAccountForm.nickName.trim(),
      password: subAccountForm.password.trim(),
      phonenumber: subAccountForm.phonenumber.trim(),
      email: subAccountForm.email.trim(),
      status: subAccountForm.status,
      permissionKeys: [...subAccountForm.permissionKeys]
    }
    if (subAccountForm.userId) {
      await updateSubAccount(subAccountForm.userId, payload)
    } else {
      await addSubAccount(payload)
    }
    ElMessage.success('后台小号已保存')
    subAccountOpen.value = false
    await loadSubAccountsData()
  } finally {
    subAccountSaving.value = false
  }
}

function removeSubAccount(row) {
  ElMessageBox.confirm(`确认删除后台小号“${row.userName}”吗？`, '删除确认', { type: 'warning' }).then(async () => {
    await deleteSubAccount(row.userId)
    ElMessage.success('后台小号已删除')
    await loadSubAccountsData()
  }).catch(() => {})
}

function subAccountPermissionText(keys = []) {
  return keys.map(key => subAccountPermissionMap.value[key] || key).join('、') || '未授权'
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

function resetOperationQuery() {
  operationQuery.dateRange = []
  resetPager(operationPager)
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

function cardCodeSummary(row = {}) {
  const codes = Array.isArray(row.openedCardCodes)
    ? row.openedCardCodes.filter(Boolean)
    : (row.openedCardCode ? [row.openedCardCode] : [])
  if (!codes.length) return '-'
  return codes.length > 1 ? `${codes[0]} 等 ${codes.length} 个` : codes[0]
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

function agencyStatCardClickable(item = {}) {
  return ['all', 'unused', 'used'].includes(item.status)
}

function selectAgencyStatCard(item = {}) {
  if (!agencyStatCardClickable(item)) return
  selectedAgencyDetailStatus.value = item.status
}

async function copyVisibleAgencyCodes() {
  const codes = selectedAgencyCodeRows.value.map(item => item.code).filter(Boolean)
  await copyActivationCode(codes.join('\n'))
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
      ensureVisibleFlag(chapter)
      chapter.open = !!chapter.open
      if (!Array.isArray(chapter.items)) chapter.items = []
      chapter.items.forEach((lesson, lessonIndex) => {
        const labels = lessonChildLabels(versionIndex === 1 ? 'tactics' : (versionIndex === 2 ? 'knowledge' : 'review'))
        if (!lesson.title) lesson.title = `章节内容${lessonIndex + 1}`
        if (!lesson.sort) lesson.sort = lessonIndex + 1
        ensureVisibleFlag(lesson)
        lesson.open = !!lesson.open
        if (!Array.isArray(lesson.questionIds)) lesson.questionIds = []
        if (!Array.isArray(lesson.children)) lesson.children = []
        if (!lesson.children[0]) lesson.children[0] = { name: labels.video, type: 1, total: 1, read: 0 }
        if (!lesson.children[1]) lesson.children[1] = { name: labels.practice, type: 2, total: 0, read: 0 }
        ensureVisibleFlag(lesson.children[0])
        ensureVisibleFlag(lesson.children[1])
        if (!lesson.children[0].name) lesson.children[0].name = labels.video
        if (!lesson.children[1].name) lesson.children[1].name = labels.practice
        if (!hasOwnField(lesson, 'videoUrl')) lesson.videoUrl = lesson.children[0].videoUrl || ''
        if (!hasOwnField(lesson, 'questionBankName')) lesson.questionBankName = lesson.children[1].questionBankName || ''
        lesson.children[0].videoUrl = lesson.videoUrl || ''
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

function hasOwnField(target, field) {
  return Object.prototype.hasOwnProperty.call(target || {}, field)
}

function ensureVisibleFlag(target = {}) {
  if (!hasOwnField(target, 'visible')) target.visible = true
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
    ensureVisibleFlag(quiz)
    if (!quiz.status) quiz.status = '未学习'
    if (!quiz.action) quiz.action = '去测评'
  })
}

function addCourseChapter() {
  const version = ensureCourseVersion(activeVersionIndex.value)
  const next = version.chapters.length + 1
  version.chapters.push({ title: `新建章节${next}`, sort: next, open: true, visible: true, items: [] })
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
    visible: true,
    videoUrl: '',
    questionBankName: '',
    questionIds: [],
    durationMinutes: 0,
    children: [
      { name: labels.video, type: 1, total: 1, read: 0, visible: true },
      { name: labels.practice, type: 2, total: 0, read: 0, visible: true }
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
  activeQuizList.value.push({ name: '', status: '未学习', action: '去测评', questionIds: [], visible: true })
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

function openQuestionDetail(row) {
  questionDetail.value = row || null
  questionDetailOpen.value = !!row
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

function exactName(value = '') {
  return String(value || '').trim()
}

function hasDuplicateCourseName(payload = {}) {
  const name = exactName(payload.courseName || payload.title)
  if (!name) return false
  const currentId = String(payload.id || editingCourseId.value || '')
  return courseList.value.some(course => {
    const courseId = String(course.id || '')
    return courseId !== currentId && exactName(course.courseName || course.title) === name
  })
}

function hasDuplicateDocName(payload = {}) {
  const name = exactName(payload.title)
  if (!name) return false
  const currentId = String(payload.id || '')
  return docList.value.some(doc => {
    const docId = String(doc.id || '')
    return docId !== currentId && exactName(doc.title) === name
  })
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
    activatedCourses: editableActivatedCourses(row.activatedCourses),
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
    expiresAt: dateOnly(row.expiresAt),
    activatedCourses: editableActivatedCourses(row.activatedCourses)
  })
  userEditOpen.value = true
}

async function submitUserEdit() {
  if (!userEditForm.id) return
  await saveUser(userEditForm)
  userEditOpen.value = false
}

function openAiChatEdit(row = {}) {
  Object.assign(aiChatEditForm, {
    id: row.id || '',
    context: row.context || '',
    message: row.message || '',
    reply: row.reply || ''
  })
  aiChatEditOpen.value = true
}

async function submitAiChatEdit() {
  if (!aiChatEditForm.id) {
    ElMessage.warning('缺少 AI 问答记录ID')
    return
  }
  aiChatSaving.value = true
  try {
    await updateAiChat(aiChatEditForm.id, {
      context: aiChatEditForm.context,
      message: aiChatEditForm.message,
      reply: aiChatEditForm.reply
    })
    ElMessage.success('AI问答已保存')
    aiChatEditOpen.value = false
    await loadStudyData()
  } finally {
    aiChatSaving.value = false
  }
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
  if (hasDuplicateCourseName(payload)) {
    ElMessage.warning('课程名称不能和已有课程完全相同')
    return
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

function openStudyCountDialog(row) {
  Object.assign(studyCountForm, {
    id: row.id,
    courseName: row.courseName || row.title || '',
    studyCount: Number(row.studyCount || 0)
  })
  studyCountOpen.value = true
}

async function submitStudyCount() {
  if (!studyCountForm.id) return
  studyCountSaving.value = true
  try {
    await updateCourse(studyCountForm.id, {
      studyCount: Math.max(0, Number(studyCountForm.studyCount || 0))
    })
    ElMessage.success('学习人数已更新')
    studyCountOpen.value = false
    await Promise.all([loadCourses(), loadCourseOptions(), loadDashboard()])
  } finally {
    studyCountSaving.value = false
  }
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
  if (hasDuplicateDocName(docForm)) {
    ElMessage.warning('资料名称不能和已有资料完全相同')
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

function markupSnippet(type) {
  if (type === 'displayMath') return '\n$$\n\\frac{2x}{x+2}\n$$'
  if (type === 'underline') return '__需要下划线的文字__'
  return '$\\frac{2x}{x+2}$'
}

function markupFieldKey(field) {
  return `question:${field}`
}

function subMarkupFieldKey(sub = {}, field = '') {
  return `sub:${sub.uid || sub.id || 'new'}:${field}`
}

function rememberMarkupSelection(key, event) {
  const target = event && event.target
  if (!key || !target || typeof target.selectionStart !== 'number') return
  markupSelections[key] = {
    start: target.selectionStart,
    end: target.selectionEnd
  }
}

function normalizeSelection(selection, length) {
  if (!selection) return { start: length, end: length }
  const start = Math.max(0, Math.min(Number(selection.start) || 0, length))
  const end = Math.max(start, Math.min(Number(selection.end) || start, length))
  return { start, end }
}

function currentTextSelection(key, value = '') {
  const textLength = String(value || '').length
  const active = typeof document !== 'undefined' ? document.activeElement : null
  if (active && /^(TEXTAREA|INPUT)$/.test(active.tagName || '') && typeof active.selectionStart === 'number') {
    return normalizeSelection({ start: active.selectionStart, end: active.selectionEnd }, textLength)
  }
  return normalizeSelection(markupSelections[key], textLength)
}

function wrapMarkupValue(selected = '', type = 'inlineMath') {
  if (!selected) return markupSnippet(type)
  if (type === 'displayMath') return `\n$$\n${selected}\n$$`
  if (type === 'underline') return `__${selected}__`
  return `$${selected}$`
}

function insertMarkupValue(value = '', type = 'inlineMath', key = '') {
  const text = String(value || '')
  const selection = currentTextSelection(key, text)
  const selected = text.slice(selection.start, selection.end)
  let inserted = wrapMarkupValue(selected, type)
  if (!selected && selection.start === text.length && text && !/[\s\n]$/.test(text) && !inserted.startsWith('\n')) {
    inserted = ` ${inserted}`
  }
  const nextValue = `${text.slice(0, selection.start)}${inserted}${text.slice(selection.end)}`
  markupSelections[key] = {
    start: selection.start + inserted.length,
    end: selection.start + inserted.length
  }
  return nextValue
}

function insertQuestionMarkup(field, type) {
  const key = markupFieldKey(field)
  questionForm[field] = insertMarkupValue(questionForm[field], type, key)
}

function insertSubQuestionMarkup(sub, field, type) {
  if (!sub) return
  const key = subMarkupFieldKey(sub, field)
  sub[field] = insertMarkupValue(sub[field], type, key)
}

function addReadingSubQuestion() {
  questionForm.subQuestions.push(defaultReadingSubQuestion())
}

function removeReadingSubQuestion(index) {
  questionForm.subQuestions.splice(index, 1)
}

function editableReadingSubQuestions(value) {
  const list = Array.isArray(value) ? value : []
  return list.map((item, index) => {
    const type = normalizeQuestionType(item.questionType || item.type)
    const options = Array.isArray(item.options) ? item.options.map(option => String(option || '')) : []
    return {
      ...defaultReadingSubQuestion(),
      ...item,
      uid: item.uid || `sub-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      id: item.subQuestionId || item.rawId || item.id || '',
      questionType: type === 'reading' ? 'choice' : type,
      stem: item.stem || item.question || '',
      options,
      optionsText: options.join('\n'),
      answer: type === 'choice' ? Number(item.answer || 0) + 1 : 1,
      answerText: item.answerText || (type === 'choice' ? '' : String(item.answer || ''))
    }
  })
}

function readingSubQuestionPayload(sub, index) {
  const type = normalizeQuestionType(sub.questionType)
  const options = type === 'choice'
    ? String(sub.optionsText || '').split('\n').map(item => item.trim())
    : []
  while (options.length && !options[options.length - 1]) {
    options.pop()
  }
  return {
    id: sub.id || `sub-${index + 1}`,
    questionType: type === 'reading' ? 'choice' : type,
    stem: String(sub.stem || '').trim(),
    options,
    answer: type === 'choice' ? Number(sub.answer || 1) - 1 : undefined,
    answerText: type === 'choice' ? '' : String(sub.answerText || '').trim(),
    acceptableAnswers: type === 'fill'
      ? String(sub.answerText || '').split('\n').map(item => item.trim()).filter(Boolean)
      : []
  }
}

function openQuestionDialog(row) {
  Object.assign(questionForm, defaultQuestionForm(), row || {})
  questionForm.questionType = normalizeQuestionType(questionForm.questionType || (row && row.options && row.options.length ? 'choice' : 'choice'))
  questionForm.optionsText = row && row.options ? row.options.join('\n') : ''
  questionForm.stemImageUrl = row ? (row.stemImageUrl || row.questionImageUrl || row.stemImage || '') : ''
  questionForm.stemAudioUrl = row ? (row.stemAudioUrl || row.questionAudioUrl || row.audioUrl || row.stemAudio || '') : ''
  questionForm.stemFileUrl = row ? (row.stemFileUrl || row.questionFileUrl || row.stemFile || '') : ''
  questionForm.optionImageUrlsText = row ? mediaListText(row.optionImageUrls || row.optionImages || row.optionImageUrl) : ''
  questionForm.answer = row && questionForm.questionType === 'choice' ? Number(row.answer || 0) + 1 : (questionForm.answer || 1)
  questionForm.answerText = row ? (row.answerText || (questionForm.questionType === 'choice' ? '' : String(row.answer || ''))) : ''
  questionForm.subQuestions = row ? editableReadingSubQuestions(row.subQuestions) : []
  if (questionForm.questionType === 'reading' && !questionForm.subQuestions.length) {
    questionForm.subQuestions = [defaultReadingSubQuestion()]
  }
  questionForm.bindConfirmed = false
  questionOpen.value = true
}

async function submitQuestion() {
  const questionType = normalizeQuestionType(questionForm.questionType)
  const stemImageUrl = String(questionForm.stemImageUrl || '').trim()
  const stemAudioUrl = String(questionForm.stemAudioUrl || '').trim()
  const optionImageUrls = questionType === 'choice' ? mediaList(questionForm.optionImageUrlsText) : []
  const options = questionType === 'choice'
    ? (questionForm.optionsText || '').split('\n').map(item => item.trim())
    : []
  while (options.length && !options[options.length - 1] && !optionImageUrls[options.length - 1]) {
    options.pop()
  }
  const optionCount = Math.max(options.length, optionImageUrls.length)
  while (options.length < optionCount) options.push('')
  const answerIndex = Number(questionForm.answer || 1) - 1
  if (!String(questionForm.stem || '').trim() && !stemImageUrl && !stemAudioUrl) {
    ElMessage.warning('请填写题干、上传题干图片或题干音频')
    return
  }
  const subQuestions = questionType === 'reading'
    ? questionForm.subQuestions.map(readingSubQuestionPayload)
    : []
  if (questionType === 'choice' && optionCount < 2) {
    ElMessage.warning('选择题至少填写两个选项或上传两张选项图片')
    return
  }
  if (questionType === 'choice' && (answerIndex < 0 || answerIndex >= optionCount)) {
    ElMessage.warning(`答案序号不能超出选项数量，当前可填 1-${optionCount}`)
    return
  }
  if (questionType === 'reading') {
    if (!subQuestions.length) {
      ElMessage.warning('阅读理解至少添加 1 个小题')
      return
    }
    for (let index = 0; index < subQuestions.length; index += 1) {
      const sub = subQuestions[index]
      if (!sub.stem) {
        ElMessage.warning(`请填写第 ${index + 1} 个小题题干`)
        return
      }
      if (sub.questionType === 'choice' && sub.options.length < 2) {
        ElMessage.warning(`第 ${index + 1} 个小题至少填写两个选项`)
        return
      }
      if (sub.questionType === 'choice' && (sub.answer < 0 || sub.answer >= sub.options.length)) {
        ElMessage.warning(`第 ${index + 1} 个小题答案序号不能超出选项数量`)
        return
      }
      if (sub.questionType !== 'choice' && !sub.answerText) {
        ElMessage.warning(`请填写第 ${index + 1} 个小题参考答案`)
        return
      }
    }
  }
  if (questionType !== 'choice' && questionType !== 'reading' && !String(questionForm.answerText || '').trim() && !String(questionForm.answerImageUrl || '').trim() && !String(questionForm.answerFileUrl || '').trim()) {
    ElMessage.warning('请填写参考答案、上传参考答案图片或文档')
    return
  }
  if (questionForm.courseId && questionForm.chapterKey && questionForm.lessonKey) {
    applyQuestionBindLabels()
    questionForm.bindConfirmed = true
  }
  const payload = {
    ...questionForm,
    questionType,
    options,
    subQuestions,
    stemImageUrl,
    stemAudioUrl,
    optionImageUrls,
    answer: questionType === 'choice' ? answerIndex : undefined,
    answerText: questionType === 'choice' || questionType === 'reading' ? '' : String(questionForm.answerText || '').trim(),
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
  const required = ['userId', 'code', 'courseId', 'studentName', 'gender', 'recentExamScore', 'grade', 'schoolName', 'region']
  if (hasMissingFields(codeActivateForm, required)) {
    ElMessage.warning('请填写用户、激活码、课程、学生名、性别、分数、年级、学校和地区')
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
  Object.assign(activationForm, { id: '', code: '', courseId: '', cardType: 'year', dailyLimitMinutes: 0, ownerUserId: '', status: 'available', remark: '' })
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

async function clearStudentRecords(row) {
  await ElMessageBox.confirm(
    `确认清除学生「${row.studentName || row.usedByUserId}」在《${row.courseTitle || '该课程'}》的全部学习记录吗？此操作不可恢复。`,
    '清除学习记录',
    { type: 'warning', confirmButtonText: '确定清除' }
  )
  await clearActivationStudyRecords(row.id)
  ElMessage.success('学习记录已清除')
  await loadDashboard()
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
  selectedAgencyDetailStatus.value = 'all'
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
  if (value === 'reading' || value === '阅读理解' || value === '阅读理解题') return 'reading'
  return 'choice'
}

function questionTypeLabel(value) {
  const type = normalizeQuestionType(value)
  if (type === 'fill') return '填空题'
  if (type === 'subjective') return '主观题'
  if (type === 'reading') return '阅读理解'
  return '选择题'
}

function questionTypeTag(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'fill') return 'warning'
  if (type === 'subjective') return 'success'
  if (type === 'reading') return 'info'
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

function mediaUrl(value = '') {
  const url = String(value || '').trim()
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  return `${mediaBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

function optionImageList(row = {}) {
  return mediaList(row.optionImageUrls || row.optionImages || row.optionImageUrl)
}

function questionStemText(row = {}) {
  return firstQuestionText(
    row.stem,
    row.questionStem,
    row.question,
    row.title,
    row.content,
    row.questionContent
  )
}

function firstQuestionText(...values) {
  for (const value of values) {
    const text = String(value || '').trim()
    if (text) return text
  }
  return ''
}

function questionOptions(row = {}) {
  if (Array.isArray(row.options)) return row.options.map(item => String(item || ''))
  if (Array.isArray(row.optionList)) return row.optionList.map(item => String(item || ''))
  return String(row.optionsText || row.optionText || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function readingSubQuestions(row = {}) {
  return Array.isArray(row.subQuestions) ? row.subQuestions : []
}

function stemImageList(row = {}) {
  return mediaList(row.stemImageUrl || row.questionImageUrl || row.stemImage)
}

function stemAudioUrl(row = {}) {
  return mediaUrl(row.stemAudioUrl || row.questionAudioUrl || row.audioUrl || row.stemAudio)
}

function questionContentSummary(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'reading') {
    const count = Array.isArray(row.subQuestions) ? row.subQuestions.length : 0
    return count ? `阅读材料，${count} 个小题` : '阅读材料，未添加小题'
  }
  if (type === 'choice') {
    const options = Array.isArray(row.options) ? row.options : []
    const text = options.map((item, index) => `${String.fromCharCode(65 + index)}. ${item || '图片选项'}`).join(' / ')
    const imageCount = optionImageList(row).length
    return [text, imageCount ? `${imageCount}张选项图` : ''].filter(Boolean).join('，') || '-'
  }
  return type === 'fill' ? '填空作答' : '主观作答'
}

function mathHtml(value = '', fallback = '') {
  return renderMath(value, fallback)
}

function plainQuestionText(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function questionPickerStem(row = {}) {
  const stem = plainQuestionText(questionStemText(row))
  if (normalizeQuestionType(row.questionType) === 'reading') {
    const count = readingSubQuestions(row).length
    const preview = stem || (stemImageList(row).length ? '图片阅读材料' : '未填写阅读材料')
    return `${preview}\n（阅读理解类题，${count || 0} 个小题）`
  }
  return stem || (stemImageList(row).length ? '图片题干' : '未填写题干')
}

function readingSubAnswerLabel(sub = {}) {
  const type = normalizeQuestionType(sub.questionType)
  if (type === 'choice') {
    const answerIndex = Number(sub.answer || 0)
    return Number.isFinite(answerIndex) && answerIndex >= 0 ? `${answerIndex + 1}（${String.fromCharCode(65 + answerIndex)}）` : '-'
  }
  return sub.answerText || sub.answer || '-'
}

function questionAnswerLabel(row = {}) {
  const type = normalizeQuestionType(row.questionType)
  if (type === 'reading') {
    const subs = Array.isArray(row.subQuestions) ? row.subQuestions : []
    return subs.map((item, index) => {
      const subType = normalizeQuestionType(item.questionType)
      if (subType === 'choice') {
        const answerIndex = Number(item.answer || 0)
        return `${index + 1}. ${Number.isFinite(answerIndex) ? String.fromCharCode(65 + answerIndex) : '-'}`
      }
      return `${index + 1}. ${item.answerText || item.answer || '-'}`
    }).join(' / ') || '-'
  }
  if (type === 'choice') {
    const index = Number(row.answer || 0)
    if (!Number.isFinite(index) || index < 0) return '-'
    return `第 ${index + 1} 项（${String.fromCharCode(65 + index)}）`
  }
  return row.answerText || row.answer || (row.answerImageUrl ? '图片参考答案' : '') || (row.answerFileUrl ? '文档参考答案' : '-')
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

function activationSortValue(row = {}) {
  const timeText = row.activatedAt || row.updatedAt || row.createdAt || ''
  const time = new Date(String(timeText).replace(' ', 'T')).getTime()
  return Number.isFinite(time) ? time : 0
}

function orderSortValue(row = {}) {
  const timeText = row.createdAt || row.activatedAt || row.openedAt || row.updatedAt || row.closedAt || ''
  const time = new Date(String(timeText).replace(' ', 'T')).getTime()
  return Number.isFinite(time) ? time : 0
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

function defaultLocalPager(pageSize = 8) {
  return { pageNum: 1, pageSize }
}

function paginateRows(rows = [], pager = {}) {
  const list = Array.isArray(rows) ? rows : []
  const pageSize = Math.max(1, Number(pager.pageSize || 8))
  const pageNum = Math.max(1, Number(pager.pageNum || 1))
  const start = (pageNum - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function resetPager(pager = {}) {
  pager.pageNum = 1
}

function orderStatusText(row = {}) {
  if (row.status === 'activated') return '已开通'
  if (row.status === 'closed') return '已关闭'
  return row.status || '-'
}

function orderStatusTagType(row = {}) {
  if (row.status === 'activated') return 'success'
  if (row.status === 'closed') return 'info'
  return 'warning'
}

function activationCourseLabel(row = {}) {
  return row.courseTitle || (row.courseId ? courseLabel(row.courseId) : '激活时选择课程')
}

function activationOwnerLabel(row = {}) {
  return row.ownerName || row.ownerUserId || '未分配'
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

function compactText(value = '') {
  return String(value || '').replace(/\s/g, '')
}

function courseTitle(course = {}) {
  return course.courseTitle || course.title || course.courseName || course.courseId || course.id || '未命名课程'
}

function courseLabel(courseId = '') {
  const course = courseOptions.value.find(item => item.id === courseId)
  return course ? course.optionLabel : (courseId || '未选择')
}

function dateOnly(value = '') {
  return String(value || '').slice(0, 10)
}

function shortDateTime(value = '') {
  const text = String(value || '').replace('T', ' ').trim()
  return text ? text.slice(0, 16) : '-'
}

function courseExpiryText(course = {}) {
  return dateOnly(course.expiresAt || course.expiry) || '-'
}

function visibleActivatedCourses(row = {}) {
  return Array.isArray(row.activatedCourses) ? row.activatedCourses.slice(0, 2) : []
}

function editableActivatedCourses(courses = []) {
  if (!Array.isArray(courses)) return []
  return courses.map(course => ({
    courseId: course.courseId || course.id || '',
    courseTitle: courseTitle(course),
    cardCode: course.cardCode || '',
    activatedAt: course.activatedAt || '',
    openedAt: course.openedAt || '',
    expiresAt: dateOnly(course.expiresAt || course.expiry),
    recentExamScore: course.recentExamScore || ''
  }))
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

function defaultReadingSubQuestion() {
  return {
    uid: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: '',
    questionType: 'choice',
    stem: '',
    optionsText: '',
    options: [],
    answer: 1,
    answerText: ''
  }
}

function defaultQuestionForm() {
  return {
    id: '',
    questionType: 'choice',
    stem: '',
    stemImageUrl: '',
    stemAudioUrl: '',
    stemFileUrl: '',
    optionsText: '',
    optionImageUrls: [],
    optionImageUrlsText: '',
    subQuestions: [],
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
    answerFileUrl: '',
    analysisImageUrl: '',
    analysisFileUrl: '',
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
    activatedCourses: [],
    remark: ''
  }
}

function defaultSubAccountForm() {
  return {
    userId: '',
    userName: '',
    nickName: '',
    password: '',
    phonenumber: '',
    email: '',
    status: '0',
    permissionKeys: []
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

.study-count-link {
  padding: 0 4px;
  font-weight: 700;
}

.study-count-course-name {
  min-width: 0;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-all;
}

.permission-checks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
  width: 100%;
}

.permission-checks :deep(.el-checkbox.is-bordered) {
  height: auto;
  margin-right: 0;
  padding: 10px 12px;
}

.permission-check-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.35;
  white-space: normal;
}

.permission-check-content span {
  color: #8a94a6;
  font-size: 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-filter-select {
  width: min(360px, 100%);
}

.toolbar-filter-select.narrow {
  width: 180px;
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

.activation-settings-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 18px;
  align-items: start;
}

.activation-settings-form :deep(.el-form-item) {
  margin: 0;
}

.activation-settings-form :deep(.el-form-item__content) {
  min-width: 0;
  align-items: flex-start;
}

.activation-settings-form :deep(.el-input),
.activation-settings-form :deep(.el-select) {
  width: 100% !important;
}

.activation-form-action {
  align-self: end;
}

.record-compact-table {
  width: 100%;
}

.record-filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.record-compact-table :deep(.el-table__cell) {
  vertical-align: top;
}

.stack-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
  line-height: 1.45;
}

.stack-cell strong {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stack-cell span,
.mono-line {
  min-width: 0;
  overflow: hidden;
  color: #667085;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono-line {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.inline-meta-row,
.table-action-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.table-action-row :deep(.el-button) {
  margin-left: 0;
}

.table-pagination,
.pagination-container {
  margin-top: 12px;
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
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}

.question-stat-chip.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.14);
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

.question-bank-table {
  width: 100%;
  margin-top: 8px;
}

.question-bank-table :deep(.el-table__cell) {
  vertical-align: top;
}

.question-bank-table :deep(.el-table__fixed),
.question-bank-table :deep(.el-table__fixed-right) {
  box-shadow: 0 0 10px rgba(15, 23, 42, 0.08);
}

.question-bank-table :deep(.el-scrollbar__bar.is-horizontal) {
  height: 10px;
}

.question-bank-table :deep(.el-scrollbar__bar.is-vertical) {
  width: 10px;
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

.math-rich-preview {
  line-height: 1.55;
  word-break: break-word;
}

.math-rich-preview :deep(.katex) {
  font-size: 1em;
}

.math-rich-preview :deep(.katex-display) {
  margin: 6px 0;
  overflow-x: auto;
  overflow-y: hidden;
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

.user-management-table {
  width: 100%;
}

.user-management-table :deep(.el-table__cell) {
  vertical-align: top;
}

.user-main-cell,
.user-identity-cell,
.student-info-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.user-main-cell strong {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.35;
}

.user-main-cell span,
.user-identity-cell span,
.student-info-cell span {
  min-width: 0;
  overflow: hidden;
  color: #667085;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.user-course-expand {
  padding: 12px 18px;
  background: #fbfdff;
}

.user-expand-profile {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px 18px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f7;
  color: #4b5563;
  font-size: 13px;
}

.course-expand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

.course-expand-card {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e6edf5;
  background: #fff;
}

.course-expand-title {
  margin-bottom: 8px;
  color: #1f2937;
  font-weight: 700;
}

.course-expand-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
  color: #4b5563;
  font-size: 13px;
}

.course-summary-list {
  display: grid;
  gap: 8px;
}

.course-summary-item {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #edf1f7;
  border-radius: 6px;
  background: #fbfdff;
}

.course-summary-title,
.course-summary-code span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-summary-title {
  color: #1f2937;
  font-weight: 600;
}

.course-summary-meta,
.course-summary-code {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 4px;
  color: #8a94a6;
  font-size: 12px;
}

.course-summary-code {
  flex-wrap: nowrap;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.course-summary-code span {
  min-width: 0;
}

.course-summary-code :deep(.el-button) {
  padding: 0;
}

.course-summary-more {
  color: #409eff;
  font-size: 12px;
  line-height: 1.4;
}

.user-course-editor {
  margin-top: 6px;
  padding: 14px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #fbfcfe;
}

.user-course-editor-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.user-course-editor-head strong,
.user-course-editor-head span {
  display: block;
}

.user-course-editor-head strong {
  color: #1f2937;
  font-size: 14px;
}

.user-course-editor-head span {
  margin-top: 3px;
  color: #8a94a6;
  font-size: 12px;
}

.user-course-param-note {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.user-course-param-note div {
  padding: 10px 12px;
  border: 1px solid #e6eef8;
  border-radius: 8px;
  background: #f8fbff;
}

.user-course-param-note strong,
.user-course-param-note span {
  display: block;
}

.user-course-param-note strong {
  color: #1f2937;
  font-size: 13px;
}

.user-course-param-note span {
  margin-top: 4px;
  color: #7b8794;
  font-size: 12px;
  line-height: 1.45;
}

.user-course-editor-list {
  display: grid;
  gap: 10px;
}

.user-course-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 188px 176px;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #edf1f7;
  border-radius: 6px;
  background: #fff;
}

.user-course-editor-main {
  min-width: 0;
}

.user-course-editor-main strong,
.user-course-editor-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-course-editor-main strong {
  color: #1f2937;
}

.user-course-editor-main span {
  margin-top: 4px;
  color: #8a94a6;
  font-size: 12px;
}

.user-course-field {
  min-width: 0;
}

.user-course-field > span {
  display: block;
  margin-bottom: 5px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .user-course-editor-row,
  .user-course-param-note {
    grid-template-columns: 1fr;
  }
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

.agency-card.clickable {
  cursor: pointer;
}

.agency-card.clickable.active {
  border-color: #409eff;
  background: #f0f7ff;
}

.agency-metric-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
  gap: 8px;
}

.agency-metric-strip span {
  min-width: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f8fafc;
  color: #667085;
  font-size: 12px;
  line-height: 1.35;
}

.agency-metric-strip strong {
  display: block;
  margin-top: 3px;
  color: #1f2937;
  font-size: 16px;
}

.agency-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 4px 0 10px;
  color: #344054;
  font-weight: 700;
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
  grid-template-columns: minmax(400px, 430px) minmax(0, 1fr);
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

.lesson-editor-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.lesson-editor-actions .el-button {
  margin-left: 0;
}

.chapter-card {
  display: grid;
  grid-template-columns: 72px minmax(170px, 1fr) 74px 58px;
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
  grid-template-columns: minmax(150px, 1.05fr) 96px 74px minmax(190px, 1.1fr) minmax(220px, 1.15fr) 34px;
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

.lesson-title-cell {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.lesson-delete-action {
  width: 100%;
  margin-left: 0;
}

.visibility-switch,
.child-visible-switch {
  justify-self: center;
}

.lesson-video-cell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 74px;
  align-items: center;
  gap: 8px;
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

.math-preview {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px dashed #d9e2ef;
  border-radius: 6px;
  background: #fbfdff;
  color: #1f2937;
  line-height: 1.55;
  word-break: break-word;
}

.math-preview :deep(.katex) {
  font-size: 1em;
}

.math-preview :deep(.katex-display) {
  margin: 6px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.math-rich-preview :deep(u),
.math-preview :deep(u) {
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.markup-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
}

.math-preview.compact {
  margin-top: 8px;
  padding: 8px 10px;
}

.reading-question-editor {
  width: 100%;
  display: grid;
  gap: 12px;
}

.reading-question-head,
.reading-sub-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reading-sub-editor-head {
  margin-bottom: 12px;
}

.reading-question-head strong,
.reading-sub-editor-head strong {
  display: block;
  color: #111827;
  font-size: 14px;
}

.reading-question-head span {
  display: block;
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.reading-sub-editor {
  padding: 16px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #fbfdff;
}

.reading-sub-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.reading-sub-type {
  width: 128px;
}

.reading-answer-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.reading-answer-input {
  width: 128px;
}

.reading-answer-label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}

.reading-add-question-btn {
  justify-self: start;
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

.file-pane-label {
  margin-top: 14px;
}

.question-audio-player {
  width: 100%;
  max-width: 360px;
  height: 34px;
  margin-top: 8px;
  display: block;
}

.question-picker-audio {
  margin: 0;
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #f8fafc;
}

.question-option-checkbox {
  align-self: start;
  padding-top: 7px;
}

.question-option-main {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.question-option-stem {
  display: block;
  max-width: 100%;
  max-height: 128px;
  overflow: auto;
  padding: 8px 10px;
  border: 1px solid #e8edf5;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  line-height: 1.55;
  white-space: normal;
}

.question-option-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-option-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.question-view-button {
  margin-left: auto;
}

.question-detail-view {
  display: grid;
  gap: 14px;
}

.question-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.question-detail-section {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #fbfdff;
}

.question-detail-section.sub {
  background: #fff;
}

.question-detail-label {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.question-detail-content {
  max-height: 260px;
  overflow: auto;
  color: #1f2937;
  line-height: 1.65;
  word-break: break-word;
}

.question-detail-options {
  display: grid;
  gap: 8px;
}

.question-detail-option {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  padding: 8px 10px;
  border: 1px solid #eef2f7;
  border-radius: 6px;
  background: #fff;
}

.question-detail-option > span {
  color: #4b5563;
  font-weight: 800;
}

.question-detail-answer {
  color: #1f2937;
  font-weight: 700;
  line-height: 1.6;
  word-break: break-word;
}

.question-detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

  .lesson-video-cell {
    grid-template-columns: 1fr;
  }

  .lesson-sort-input,
  .lesson-title-cell,
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
