<script setup lang="ts">
const emit = defineEmits<{
  hideMentionModal: []
  insertMention: [id: string, name: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const top = ref('0px')
const left = ref('0px')
const searchVal = ref('')
const list = ref([
  { id: 'startUser', name: '发起人' },
  { id: 'startUserDept', name: '发起人部门' },
  { id: 'processName', name: '流程名称' },
  { id: 'processNum', name: '流程编号' },
  { id: 'startTime', name: '发起时间' },
  { id: 'endTime', name: '结束时间' },
  { id: 'processStatus', name: '流程状态' },
  { id: 'printUser', name: '打印人' },
  { id: 'printTime', name: '打印时间' },
])

const formFields = inject<Ref<Array<{ field: string, title: string }>> | undefined>('formFieldsObj')

const searchedList = computed(() => {
  const keyword = searchVal.value.trim().toLowerCase()
  return list.value.filter(item => item.name.toLowerCase().includes(keyword))
})

function insertMentionHandler(id: string, name: string) {
  emit('insertMention', id, name)
  emit('hideMentionModal')
}

function onKeyup(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('hideMentionModal')
    return
  }
  if (event.key === 'Enter') {
    const first = searchedList.value[0]
    if (first)
      insertMentionHandler(first.id, first.name)
  }
}

onMounted(() => {
  const fields = formFields?.value
  if (fields?.length) {
    list.value.push(
      ...fields.map(item => ({
        id: item.field,
        name: `[表单]${item.title}`,
      })),
    )
  }

  try {
    const range = document.getSelection()?.getRangeAt(0)
    if (range) {
      const rect = range.getBoundingClientRect()
      top.value = `${rect.top + 20}px`
      left.value = `${rect.left + 5}px`
    }
  }
  catch {
    // ignore
  }
  nextTick(() => inputRef.value?.focus())
})
</script>

<template>
  <div class="mention-modal" :style="{ top, left }">
    <input
      ref="inputRef"
      v-model="searchVal"
      class="mention-modal__input"
      placeholder="搜索字段"
      @keyup="onKeyup"
    >
    <ul class="mention-modal__list">
      <li
        v-for="item in searchedList"
        :key="item.id"
        @click="insertMentionHandler(item.id, item.name)"
      >
        {{ item.name }}
      </li>
      <li v-if="!searchedList.length" class="mention-modal__empty">
        无匹配项
      </li>
    </ul>
  </div>
</template>

<style scoped>
.mention-modal {
  position: fixed;
  z-index: 4000;
  border: 1px solid var(--n-border-color, #ccc);
  background: var(--n-color, #fff);
  border-radius: 4px;
  padding: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  min-width: 160px;
}
.mention-modal__input {
  width: 140px;
  outline: none;
  border: 1px solid var(--n-border-color, #ddd);
  border-radius: 3px;
  padding: 4px 6px;
}
.mention-modal__list {
  margin: 6px 0 0;
  padding: 0;
  max-height: 220px;
  overflow: auto;
}
.mention-modal__list li {
  list-style: none;
  cursor: pointer;
  padding: 4px 2px;
}
.mention-modal__list li:hover {
  color: var(--n-primary-color, #2080f0);
}
.mention-modal__empty {
  color: var(--n-text-color-3, #999);
  cursor: default !important;
}
</style>
