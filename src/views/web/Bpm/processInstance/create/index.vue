<template>
  <div v-loading="loading" class="bpm-create">
    <template v-if="!selectProcessDefinition">
      <div class="bpm-create__toolbar">
        <n-input
          v-model:value="searchName"
          clearable
          placeholder="搜索流程"
          style="width: 240px"
          @update:value="handleQuery"
        />
      </div>

      <div class="bpm-create__layout">
        <n-menu
          class="bpm-create__menu"
          :options="categoryMenuOptions"
          :value="categoryActive?.code"
          @update:value="onCategorySelect"
        />

        <div class="bpm-create__list">
          <template v-for="(defs, categoryCode) in processDefinitionGroup" :key="categoryCode">
            <div :ref="(el) => setCategoryRef(String(categoryCode), el)" class="bpm-create__group">
              <div class="bpm-create__group-title">
                {{ getCategoryName(String(categoryCode)) }}
              </div>
              <div class="bpm-create__cards">
                <n-card
                  v-for="item in defs"
                  :key="item.id"
                  size="small"
                  hoverable
                  class="bpm-create__card"
                  @click="handleSelect(item)"
                >
                  <div class="bpm-create__card-inner">
                    <img
                      v-if="item.icon"
                      class="bpm-create__icon-img"
                      :src="item.icon"
                      :alt="item.name"
                    >
                    <div v-else class="bpm-create__icon">
                      {{ (item.name || '?').slice(0, 2) }}
                    </div>
                    <div class="bpm-create__name">{{ item.name }}</div>
                  </div>
                </n-card>
              </div>
            </div>
          </template>
          <n-empty v-if="!Object.keys(processDefinitionGroup).length" description="暂无可发起流程" />
        </div>
      </div>
    </template>

    <ProcessDefinitionDetail
      v-else
      ref="detailRef"
      @cancel="selectProcessDefinition = null"
      @success="onCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { CategoryApi } from '@/api/bpm/category'
import { getProcessDefinitionList } from '@/api/bpm/definition'
import { getProcessInstance } from '@/api/bpm/processInstance'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'
import ProcessDefinitionDetail from './ProcessDefinitionDetail.vue'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const searchName = ref('')
const categoryList = ref<any[]>([])
const categoryActive = ref<any>({})
const processDefinitionList = ref<any[]>([])
const filteredProcessDefinitionList = ref<any[]>([])
const selectProcessDefinition = ref<any>(null)
const detailRef = ref<InstanceType<typeof ProcessDefinitionDetail> | null>(null)
const categoryElMap = new Map<string, HTMLElement>()

const processDefinitionGroup = computed(() => {
  const grouped: Record<string, any[]> = {}
  for (const def of filteredProcessDefinitionList.value) {
    const key = def.category || 'default'
    if (!grouped[key])
      grouped[key] = []
    grouped[key].push(def)
  }
  const ordered: Record<string, any[]> = {}
  for (const cat of categoryList.value) {
    if (grouped[cat.code])
      ordered[cat.code] = grouped[cat.code]
  }
  for (const [k, v] of Object.entries(grouped)) {
    if (!ordered[k])
      ordered[k] = v
  }
  return ordered
})

const availableCategories = computed(() => {
  const codes = new Set(Object.keys(processDefinitionGroup.value))
  return categoryList.value.filter(c => codes.has(c.code))
})

const categoryMenuOptions = computed<MenuOption[]>(() =>
  availableCategories.value.map(c => ({
    label: c.name,
    key: c.code,
  })),
)

function setCategoryRef(code: string, el: unknown) {
  if (el && el instanceof HTMLElement)
    categoryElMap.set(code, el)
}

function getCategoryName(code: string) {
  return categoryList.value.find(c => c.code === code)?.name || code
}

function handleQuery() {
  const keyword = searchName.value.trim().toLowerCase()
  if (!keyword) {
    filteredProcessDefinitionList.value = [...processDefinitionList.value]
    return
  }
  filteredProcessDefinitionList.value = processDefinitionList.value.filter(d =>
    String(d.name || '').toLowerCase().includes(keyword),
  )
}

function onCategorySelect(code: string) {
  categoryActive.value = categoryList.value.find(c => c.code === code) || { code }
  const el = categoryElMap.get(code)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function handleSelect(row: any, formVariables?: Record<string, unknown>) {
  selectProcessDefinition.value = row
  await nextTick()
  await detailRef.value?.initProcessInfo(row, formVariables)
}

async function getList() {
  loading.value = true
  try {
    categoryList.value = (await CategoryApi.getCategorySimpleList() as any[]) || []
    processDefinitionList.value = (await getProcessDefinitionList({
      suspensionState: 1,
    }) as any[]) || []
    handleQuery()
    if (availableCategories.value.length && !categoryActive.value?.code)
      categoryActive.value = availableCategories.value[0]

    const processInstanceId = route.query.processInstanceId
      ? String(route.query.processInstanceId)
      : ''
    if (processInstanceId) {
      const processInstance = await getProcessInstance(processInstanceId) as any
      if (!processInstance) {
        message.error('重新发起失败：流程实例不存在')
        return
      }
      const def = processDefinitionList.value.find(
        (item: any) => item.key === processInstance.processDefinition?.key
          || item.id === processInstance.processDefinitionId,
      )
      if (!def) {
        message.error('重新发起失败：流程定义不存在')
        return
      }
      await handleSelect(def, processInstance.formVariables)
    }
  }
  finally {
    loading.value = false
  }
}

function onCreateSuccess(id: string) {
  const name = resolveBpmRouteName(router, 'Bpm-ProcessInstanceDetail', 'BpmProcessInstanceDetail')
  router.push({ name, query: { id } })
}

onMounted(getList)
</script>

<style scoped>
.bpm-create {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bpm-create__toolbar {
  flex-shrink: 0;
}
.bpm-create__layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 12px;
}
.bpm-create__menu {
  background: var(--n-card-color, #fff);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: auto;
}
.bpm-create__list {
  overflow: auto;
  padding-right: 4px;
}
.bpm-create__group {
  margin-bottom: 20px;
}
.bpm-create__group-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}
.bpm-create__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.bpm-create__card {
  cursor: pointer;
}
.bpm-create__card-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bpm-create__icon,
.bpm-create__icon-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
}
.bpm-create__icon {
  background: var(--n-primary-color);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.bpm-create__icon-img {
  object-fit: cover;
}
.bpm-create__name {
  font-size: 14px;
  font-weight: 500;
}
@media (max-width: 768px) {
  .bpm-create__layout {
    grid-template-columns: 1fr;
  }
}
</style>
