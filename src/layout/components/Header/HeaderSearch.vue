<script setup lang="ts">
import { SearchOutlined } from '@vicons/antd'
import { NEmpty, NIcon, NInput } from 'naive-ui'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import { usePermissionStore } from '@/store/modules/permission'
import type { MenuItem } from '@/router/utils/types'

interface SearchItem {
  name: string
  title: string
  path: string
  parents: string[]
}

const router = useRouter()
const permissionStore = usePermissionStore()
const show = ref(false)
const keyword = ref('')
const activeIndex = ref(0)
const inputRef = ref<{ focus: () => void } | null>(null)

function flattenMenus(menus: MenuItem[], parents: string[] = []): SearchItem[] {
  const result: SearchItem[] = []
  for (const menu of menus) {
    if (menu.hidden)
      continue
    const title = menu.meta?.title
    const hasChildren = !!menu.children?.length
    const isLeaf = !hasChildren && !!menu.component && !['ParentView', 'Layout'].includes(menu.component)
    if (title && (isLeaf || menu.component === 'TabView')) {
      result.push({
        name: menu.name,
        title,
        path: menu.path,
        parents,
      })
    }
    if (hasChildren)
      result.push(...flattenMenus(menu.children!, title ? [...parents, title] : parents))
  }
  return result
}

const allItems = computed(() => flattenMenus(permissionStore.userMenuList as MenuItem[]))

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q)
    return allItems.value.slice(0, 20)
  return allItems.value
    .filter((item) => {
      const chain = [...item.parents, item.title].join(' ').toLowerCase()
      return chain.includes(q) || item.name.toLowerCase().includes(q)
    })
    .slice(0, 30)
})

watch(filtered, () => {
  activeIndex.value = 0
})

function open() {
  show.value = true
  keyword.value = ''
  activeIndex.value = 0
  nextTick(() => inputRef.value?.focus())
}

function close() {
  show.value = false
}

function go(item: SearchItem) {
  close()
  router.push({ name: item.name }).catch(() => {
    router.push(item.path)
  })
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (show.value)
      close()
    else
      open()
    return
  }
  if (!show.value)
    return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, Math.max(filtered.value.length - 1, 0))
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }
  else if (e.key === 'Enter') {
    const item = filtered.value[activeIndex.value]
    if (item)
      go(item)
  }
  else if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ open, close })
</script>

<template>
  <div class="header-search">
    <div class="header-search__trigger" @click="open">
      <n-tooltip placement="bottom">
        <template #trigger>
          <NIcon size="18"><SearchOutlined /></NIcon>
        </template>
        <span>搜索菜单 (Ctrl+K)</span>
      </n-tooltip>
    </div>

    <CommonModal
      v-model:show="show"
      class="header-search-modal"
      :width="560"
      :show-footer="false"
      :closable="true"
      :mask-closable="true"
      :draggable="false"
    >
      <template #header>
        <NInput
          ref="inputRef"
          v-model:value="keyword"
          clearable
          placeholder="搜索菜单名称..."
          size="large"
        >
          <template #prefix>
            <NIcon><SearchOutlined /></NIcon>
          </template>
        </NInput>
      </template>

      <div class="header-search-list">
        <template v-if="filtered.length">
          <div
            v-for="(item, index) in filtered"
            :key="item.name"
            class="header-search-item"
            :class="{ 'is-active': index === activeIndex }"
            @mouseenter="activeIndex = index"
            @click="go(item)"
          >
            <div class="header-search-item__title">{{ item.title }}</div>
            <div v-if="item.parents.length" class="header-search-item__path">
              {{ item.parents.join(' / ') }}
            </div>
          </div>
        </template>
        <NEmpty v-else description="暂无匹配菜单" size="small" />
      </div>
    </CommonModal>
  </div>
</template>

<style scoped>
.header-search {
  display: inline-flex;
  align-items: stretch;
  align-self: stretch;
  height: 100%;
}

.header-search__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.header-search__trigger:hover {
  background: #f8f8f9;
}

.header-search-list {
  max-height: 360px;
  overflow: auto;
}

.header-search-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.header-search-item.is-active,
.header-search-item:hover {
  background: rgba(24, 160, 88, 0.08);
}

.header-search-item__title {
  font-size: 14px;
  color: #1f2937;
}

.header-search-item__path {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
