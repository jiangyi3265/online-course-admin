<template>
  <div class="agreement-editor">
    <div class="agreement-editor__toolbar">
      <el-button size="small" :type="active.bold ? 'primary' : 'default'" @mousedown.prevent="format('bold')">
        <strong>B</strong>
      </el-button>
      <el-button size="small" :type="active.underline ? 'primary' : 'default'" @mousedown.prevent="format('underline')">
        <span class="underline-mark">U</span>
      </el-button>
    </div>
    <div
      ref="editorRef"
      class="agreement-editor__body"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="emitContent"
      @focus="refreshToolbar"
      @mouseup="refreshToolbar"
      @keyup="refreshToolbar"
      @paste="handlePaste"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入协议内容，可选中文字后点击 B 或 U 设置加粗、下划线。'
  }
})

const emit = defineEmits(['update:modelValue'])
const editorRef = ref(null)
const active = reactive({ bold: false, underline: false })
let syncing = false

watch(
  () => props.modelValue,
  value => {
    if (!syncing) setEditorHtml(value)
  },
  { immediate: true }
)

onMounted(() => setEditorHtml(props.modelValue))

function setEditorHtml(value = '') {
  if (!editorRef.value) return
  const html = normalizeContent(value)
  if (editorRef.value.innerHTML !== html) {
    syncing = true
    editorRef.value.innerHTML = html
    nextTick(() => {
      syncing = false
      refreshToolbar()
    })
  }
}

function normalizeContent(value = '') {
  const content = String(value || '')
  if (!content) return ''
  if (/<[a-z][\s\S]*>/i.test(content)) return content
  return escapeHtml(content).replace(/\r?\n/g, '<br>')
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function format(command) {
  if (!editorRef.value) return
  editorRef.value.focus()
  document.execCommand(command, false, null)
  emitContent()
}

function emitContent() {
  if (!editorRef.value) return
  syncing = true
  emit('update:modelValue', editorRef.value.innerHTML)
  nextTick(() => {
    syncing = false
    refreshToolbar()
  })
}

function refreshToolbar() {
  try {
    active.bold = document.queryCommandState('bold')
    active.underline = document.queryCommandState('underline')
  } catch (error) {
    active.bold = false
    active.underline = false
  }
}

function handlePaste(event) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  emitContent()
}
</script>

<style scoped lang="scss">
.agreement-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.agreement-editor__toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
  background: #f8fafc;
}

.underline-mark {
  text-decoration: underline;
  font-weight: 700;
}

.agreement-editor__body {
  min-height: 320px;
  max-height: 520px;
  padding: 12px 14px;
  overflow: auto;
  color: #303133;
  font-size: 14px;
  line-height: 1.65;
  outline: none;
  white-space: normal;
  word-break: break-word;
}

.agreement-editor__body:empty::before {
  content: attr(data-placeholder);
  color: #a8abb2;
}
</style>
