import type { Ref } from 'vue'
import type { UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import type { BuilderField, FormBuilderDraft, FormBuilderSaveStatus } from './types'
import {
  AUTO_SAVE_PREF_KEY,
  DRAFT_VERSION,
  HISTORY_LIMIT,
  PERSIST_DEBOUNCE_MS,
  STORAGE_KEY,
} from './constants'
import { cloneBuilderFields, normalizeImportedField, rehydrateBuilderField } from './serialize'

interface HistoryEntry {
  fields: BuilderField[]
  formCols: number
  /** 与 fields + formCols 对应的指纹，用于去重 */
  fingerprint: string
}

function readAutoSavePref(): boolean {
  try {
    return localStorage.getItem(AUTO_SAVE_PREF_KEY) === '1'
  }
  catch {
    return false
  }
}

function writeAutoSavePref(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_SAVE_PREF_KEY, enabled ? '1' : '0')
  }
  catch {
    // ignore quota / private mode
  }
}

function fingerprintOf(fieldsJson: string, formCols: number): string {
  return `${formCols}\0${fieldsJson}`
}

function isDraftV1(draft: FormBuilderDraft): draft is FormBuilderDraft & { version: 1, fields: BuilderField[] } {
  return draft.version === DRAFT_VERSION && Array.isArray(draft.fields)
}

export interface FormBuilderPersistenceOptions {
  /** 是否自动读写 localStorage 草稿，默认 false（也可传入外部 ref 受控） */
  autoSave?: Ref<boolean> | boolean
}

export function useFormBuilderPersistence(
  fields: Ref<BuilderField[]>,
  formCols: Ref<number>,
  selectedUid: Ref<string>,
  options?: FormBuilderPersistenceOptions,
) {
  const autoSave = isRef(options?.autoSave)
    ? options.autoSave
    : ref(options?.autoSave ?? readAutoSavePref())

  const saveStatus = ref<FormBuilderSaveStatus>('idle')
  const history = ref<HistoryEntry[]>([])
  const historyIndex = ref(-1)
  let skipHistory = false
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  /** 与当前防抖周期共用的快照，避免历史与落盘各克隆一次 */
  let pendingSnapshot: HistoryEntry | null = null

  function createSnapshot(): HistoryEntry {
    const fieldsJson = JSON.stringify(fields.value)
    const cloned = (JSON.parse(fieldsJson) as BuilderField[]).map(rehydrateBuilderField)
    const cols = formCols.value
    return {
      fields: cloned,
      formCols: cols,
      fingerprint: fingerprintOf(fieldsJson, cols),
    }
  }

  function pushHistory(snap?: HistoryEntry) {
    if (skipHistory)
      return
    const entry = snap ?? createSnapshot()
    if (historyIndex.value >= 0) {
      const current = history.value[historyIndex.value]
      if (current?.fingerprint === entry.fingerprint)
        return
    }
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(entry)
    if (history.value.length > HISTORY_LIMIT)
      history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function restoreFromHistory(index: number) {
    const snap = history.value[index]
    if (!snap)
      return
    skipHistory = true
    fields.value = cloneBuilderFields(snap.fields)
    formCols.value = snap.formCols
    if (!fields.value.some(f => f.uid === selectedUid.value))
      selectedUid.value = fields.value[0]?.uid || ''
    historyIndex.value = index
    nextTick(() => {
      skipHistory = false
    })
  }

  function undo() {
    if (historyIndex.value <= 0)
      return false
    restoreFromHistory(historyIndex.value - 1)
    return true
  }

  function redo() {
    if (historyIndex.value >= history.value.length - 1)
      return false
    restoreFromHistory(historyIndex.value + 1)
    return true
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function saveDraft(snap?: HistoryEntry): boolean {
    if (!autoSave.value)
      return false
    const entry = snap ?? createSnapshot()
    const draft: FormBuilderDraft = {
      version: DRAFT_VERSION,
      fields: entry.fields,
      formCols: entry.formCols,
      selectedUid: selectedUid.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      saveStatus.value = 'saved'
      return true
    }
    catch {
      saveStatus.value = 'error'
      return false
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    }
    catch {
      // ignore
    }
  }

  function flushPersist() {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    if (pendingSnapshot) {
      const snap = pendingSnapshot
      pendingSnapshot = null
      pushHistory(snap)
      if (autoSave.value)
        saveDraft(snap)
      return
    }
    if (autoSave.value)
      saveDraft()
  }

  function schedulePersist() {
    if (skipHistory)
      return
    pendingSnapshot = createSnapshot()
    if (autoSave.value)
      saveStatus.value = 'pending'
    if (persistTimer)
      clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      persistTimer = null
      const snap = pendingSnapshot
      pendingSnapshot = null
      if (!snap)
        return
      pushHistory(snap)
      if (autoSave.value)
        saveDraft(snap)
    }, PERSIST_DEBOUNCE_MS)
  }

  function loadDraft(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw)
        return false
      const draft = JSON.parse(raw) as FormBuilderDraft
      if (!draft.fields?.length)
        return false
      skipHistory = true
      if (isDraftV1(draft)) {
        fields.value = cloneBuilderFields(draft.fields)
      }
      else {
        fields.value = (draft.fields as UnifiedFieldConfig[]).map(item => normalizeImportedField(item))
      }
      formCols.value = draft.formCols ?? 2
      selectedUid.value = draft.selectedUid && fields.value.some(f => f.uid === draft.selectedUid)
        ? draft.selectedUid
        : fields.value[0]?.uid || ''
      saveStatus.value = 'saved'
      nextTick(() => {
        skipHistory = false
      })
      return true
    }
    catch {
      skipHistory = false
      return false
    }
  }

  function initHistory() {
    history.value = [createSnapshot()]
    historyIndex.value = 0
  }

  watch(fields, () => {
    schedulePersist()
  }, { deep: true })

  watch(formCols, () => {
    schedulePersist()
  })

  watch(selectedUid, () => {
    if (skipHistory)
      return
    if (!autoSave.value)
      return
    // 仅选中变化：不入历史，只刷新草稿 selectedUid
    saveStatus.value = 'pending'
    if (persistTimer)
      return
    persistTimer = setTimeout(() => {
      persistTimer = null
      saveDraft()
    }, PERSIST_DEBOUNCE_MS)
  })

  watch(autoSave, (enabled) => {
    writeAutoSavePref(enabled)
    if (enabled) {
      saveDraft()
      return
    }
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    // 关闭自动保存时仍把待入栈快照写入历史，避免丢失撤销点
    if (pendingSnapshot) {
      pushHistory(pendingSnapshot)
      pendingSnapshot = null
    }
    clearDraft()
    saveStatus.value = 'idle'
  })

  function onBeforeUnload() {
    if (!autoSave.value)
      return
    if (persistTimer || pendingSnapshot)
      flushPersist()
  }

  onMounted(() => {
    // 仅开启自动保存时恢复草稿；关闭时保持空画布，便于接口/外部数据渲染
    if (autoSave.value)
      loadDraft()
    initHistory()
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (autoSave.value && (persistTimer || pendingSnapshot))
      flushPersist()
    else if (persistTimer)
      clearTimeout(persistTimer)
  })

  return {
    autoSave,
    saveStatus,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    saveDraft,
    clearDraft,
    loadDraft,
    flushPersist,
  }
}
