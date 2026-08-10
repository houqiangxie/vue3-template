<script setup lang="ts" generic="T">
import type { VNode } from 'vue'
import { computed, h, reactive } from 'vue'
import {
  NButton,
  NDivider,
  NDropdown,
  NIcon,
  NPopconfirm,
  NSpace,
  NTooltip,
  useDialog,
} from 'naive-ui'
import type { ButtonProps, DropdownOption } from 'naive-ui'
import { ChevronDownOutline } from '@vicons/ionicons5'
import type { TableActionItem, TableActionRenderContext } from './types'
import {
  cleanDividerActions,
  cleanDropdownOptions,
  collectActionMap,
  filterVisibleActions,
  normalizeConfirmConfig,
  resolveActionKey,
  resolveConfirm,
  resolveLabel,
  resolvePopconfirm,
  resolvePopconfirmTitle,
  resolveRowValue,
  splitInlineAndMore,
} from './table-action.utils'
import { renderIcon } from '@/utils/layout'

export type {
  TableActionConfirmConfig,
  TableActionItem,
  TableActionPopconfirmConfig,
  TableActionRenderContext,
} from './types'

/** 表格行操作按钮组：支持权限、气泡/弹窗二次确认、更多收起、下拉子菜单 */
const props = withDefaults(defineProps<{
  row: T
  actions: TableActionItem<T>[]
  /** 超出后收起到「更多」，0 表示全部收起 */
  max?: number
  moreText?: string
  size?: ButtonProps['size']
}>(), {
  max: 10,
  moreText: '更多',
  size: 'small',
})

const dialog = useDialog()
const internalLoading = reactive<Record<string, boolean>>({})

const visibleActions = computed(() =>
  cleanDividerActions(filterVisibleActions(props.actions, props.row)),
)

const actionGroups = computed(() =>
  splitInlineAndMore(visibleActions.value, props.max),
)

const inlineActions = computed(() => actionGroups.value.inline)
const moreActions = computed(() => cleanDividerActions(actionGroups.value.more))

const hasAnyAction = computed(() =>
  inlineActions.value.length > 0 || moreActions.value.length > 0,
)

const moreActionMap = computed(() => collectActionMap(moreActions.value))

function isDisabled(action: TableActionItem<T>) {
  return resolveRowValue(action.disabled, props.row, false)
}

function getLoading(action: TableActionItem<T>, key: string) {
  if (internalLoading[key])
    return true
  return resolveRowValue(action.loading, props.row, false)
}

function getTooltip(action: TableActionItem<T>) {
  return resolveRowValue(action.tooltip, props.row, '')
}

function getLabel(action: TableActionItem<T>) {
  return resolveLabel(action, props.row)
}

function getButtonType(action: TableActionItem<T>) {
  return resolveRowValue(action.type, props.row, 'primary' as ButtonProps['type'])
}

function getPopconfirmConfig(action: TableActionItem<T>) {
  return resolvePopconfirm(action, props.row)
}

function getPopconfirmTitle(action: TableActionItem<T>) {
  return resolvePopconfirmTitle(action, props.row)
}

/** 弹窗确认；与 popconfirm 同时存在时忽略（优先气泡） */
function getConfirmConfig(action: TableActionItem<T>) {
  if (getPopconfirmConfig(action))
    return undefined
  return resolveConfirm(action, props.row)
}

function getRenderContext(action: TableActionItem<T>, key: string): TableActionRenderContext<T> {
  return {
    row: props.row,
    disabled: isDisabled(action),
    loading: getLoading(action, key),
    onClick: () => handleClick(action, key),
  }
}

async function executeClick(action: TableActionItem<T>, key: string) {
  if (!action.onClick)
    return

  const result = action.onClick(props.row)
  if (result && typeof (result as Promise<void>).then === 'function') {
    internalLoading[key] = true
    try {
      await result
    }
    finally {
      internalLoading[key] = false
    }
  }
}

function openDialogConfirm(action: TableActionItem<T>, key: string) {
  const raw = getConfirmConfig(action)
  if (!raw)
    return false

  const config = normalizeConfirmConfig(raw)
  dialog[config.type]({
    title: config.title,
    content: config.content,
    positiveText: config.positiveText,
    negativeText: config.negativeText,
    onPositiveClick: () => executeClick(action, key),
  })
  return true
}

async function handleClick(action: TableActionItem<T>, key: string) {
  if (isDisabled(action) || getLoading(action, key) || !action.onClick)
    return

  if (openDialogConfirm(action, key))
    return

  await executeClick(action, key)
}

function handleMoreSelect(key: string) {
  const action = moreActionMap.value.get(String(key))
  if (!action || action.divider || getPopconfirmConfig(action))
    return
  handleClick(action, String(key))
}

function createButtonProps(action: TableActionItem<T>, key: string) {
  return {
    text: true,
    type: getButtonType(action),
    size: action.size ?? props.size,
    disabled: isDisabled(action),
    loading: getLoading(action, key),
  }
}

function createButtonSlots(action: TableActionItem<T>, withArrow = false) {
  const label = getLabel(action)

  return {
    icon: action.icon
      ? () => h(NIcon, null, { default: () => h(action.icon!) })
      : undefined,
    default: () => withArrow
      ? h('span', { class: 'table-action__label' }, [
          label,
          h(NIcon, { size: 14, class: 'table-action__arrow' }, {
            default: () => h(ChevronDownOutline),
          }),
        ])
      : label,
  }
}

function wrapWithTooltip(node: VNode, tooltip: string) {
  if (!tooltip)
    return node
  return h(NTooltip, null, {
    trigger: () => node,
    default: () => tooltip,
  })
}

function renderActionButton(action: TableActionItem<T>, key: string) {
  const buttonProps = createButtonProps(action, key)
  const buttonSlots = createButtonSlots(action)
  const popconfirm = getPopconfirmConfig(action)
  const tooltip = getTooltip(action)

  let node: VNode

  if (popconfirm) {
    node = h(
      NPopconfirm,
      {
        positiveText: typeof popconfirm === 'object' ? popconfirm.positiveText : undefined,
        negativeText: typeof popconfirm === 'object' ? popconfirm.negativeText : undefined,
        onPositiveClick: () => executeClick(action, key),
      },
      {
        trigger: () => h(NButton, buttonProps, buttonSlots),
        default: () => getPopconfirmTitle(action),
      },
    )
  }
  else {
    node = h(
      NButton,
      {
        ...buttonProps,
        onClick: () => handleClick(action, key),
      },
      buttonSlots,
    )
  }

  return wrapWithTooltip(node, tooltip)
}

function buildDropdownOptions(
  actions: TableActionItem<T>[],
  prefix = '',
): DropdownOption[] {
  const options: DropdownOption[] = []

  actions.forEach((action, index) => {
    const key = prefix
      ? `${prefix}/${resolveActionKey(action, index)}`
      : resolveActionKey(action, index)

    if (action.divider) {
      options.push({ key, type: 'divider' })
      return
    }

    if (action.children?.length) {
      options.push({
        key,
        label: getLabel(action),
        icon: action.icon ? renderIcon(action.icon) : undefined,
        disabled: isDisabled(action),
        children: buildDropdownOptions(action.children, key),
      })
      return
    }

    const popconfirm = getPopconfirmConfig(action)
    if (popconfirm) {
      options.push({
        key,
        disabled: isDisabled(action),
        label: () => h(
          NPopconfirm,
          {
            positiveText: typeof popconfirm === 'object' ? popconfirm.positiveText : undefined,
            negativeText: typeof popconfirm === 'object' ? popconfirm.negativeText : undefined,
            onPositiveClick: () => executeClick(action, key),
          },
          {
            trigger: () => h(
              'span',
              {
                class: 'table-action__dropdown-item',
                onClick: (event: MouseEvent) => event.stopPropagation(),
              },
              getLabel(action),
            ),
            default: () => getPopconfirmTitle(action),
          },
        ),
        icon: action.icon ? renderIcon(action.icon) : undefined,
      })
      return
    }

    options.push({
      key,
      label: getLabel(action),
      icon: action.icon ? renderIcon(action.icon) : undefined,
      disabled: isDisabled(action) || getLoading(action, key),
    })
  })

  return cleanDropdownOptions(options)
}

function renderDropdownTrigger(action: TableActionItem<T>, key: string) {
  const options = buildDropdownOptions(action.children ?? [])
  const buttonProps = createButtonProps(action, key)
  const buttonSlots = createButtonSlots(action, true)
  const tooltip = getTooltip(action)

  const dropdown = h(
    NDropdown,
    {
      options,
      onSelect: (selectedKey: string) => {
        const actionMap = collectActionMap([action])
        const selected = actionMap.get(selectedKey)
        if (selected && !getPopconfirmConfig(selected))
          handleClick(selected, selectedKey)
      },
    },
    {
      default: () => h(NButton, buttonProps, buttonSlots),
    },
  )

  return wrapWithTooltip(dropdown, tooltip)
}

function renderInlineAction(action: TableActionItem<T>, index: number) {
  const key = resolveActionKey(action, index)

  if (action.render)
    return () => action.render!(props.row, getRenderContext(action, key))

  if (action.divider)
    return () => h(NDivider, { vertical: true, style: { margin: '0 4px', height: '14px' } })

  if (action.dropdown || action.children?.length)
    return () => renderDropdownTrigger(action, key)

  return () => renderActionButton(action, key)
}

const moreDropdownOptions = computed(() => buildDropdownOptions(moreActions.value))
</script>

<template>
  <n-space
    v-if="hasAnyAction"
    :size="8"
    align="center"
    justify="center"
    wrap
    class="table-action"
  >
    <component
      :is="renderInlineAction(action, index)"
      v-for="(action, index) in inlineActions"
      :key="resolveActionKey(action, index)"
    />

    <n-dropdown
      v-if="moreActions.length"
      :options="moreDropdownOptions"
      @select="handleMoreSelect"
    >
      <n-button text :size="size">
        {{ moreText }}
        <n-icon :size="14" class="table-action__more-icon">
          <ChevronDownOutline />
        </n-icon>
      </n-button>
    </n-dropdown>
  </n-space>
</template>

<style scoped>
.table-action {
  width: 100%;
  min-height: 100%;
}

.table-action :deep(.table-action__dropdown-item) {
  display: inline-block;
  width: 100%;
}

.table-action__more-icon {
  margin-left: 2px;
  vertical-align: -2px;
}

.table-action :deep(.table-action__label) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.table-action :deep(.table-action__arrow) {
  vertical-align: -2px;
}
</style>
