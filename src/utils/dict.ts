/** BPM 字典类型枚举（展示用；实际文案可由后端字典覆盖） */
export enum DICT_TYPE {
  COMMON_STATUS = 'common_status',
  INFRA_BOOLEAN_STRING = 'infra_boolean_string',
  BPM_MODEL_TYPE = 'bpm_model_type',
  BPM_MODEL_FORM_TYPE = 'bpm_model_form_type',
  BPM_TASK_CANDIDATE_STRATEGY = 'bpm_task_candidate_strategy',
  BPM_PROCESS_INSTANCE_STATUS = 'bpm_process_instance_status',
  BPM_TASK_STATUS = 'bpm_task_status',
  BPM_OA_LEAVE_TYPE = 'bpm_oa_leave_type',
  BPM_PROCESS_LISTENER_TYPE = 'bpm_process_listener_type',
  BPM_PROCESS_LISTENER_VALUE_TYPE = 'bpm_process_listener_value_type',
}

export interface DictDataType {
  dictType: string
  label: string
  value: string | number | boolean
  colorType?: string
  cssClass?: string
}

/** 本地兜底字典（后端未接字典接口时使用） */
const DICT_DATA: Record<string, DictDataType[]> = {
  [DICT_TYPE.INFRA_BOOLEAN_STRING]: [
    { dictType: DICT_TYPE.INFRA_BOOLEAN_STRING, label: '是', value: true },
    { dictType: DICT_TYPE.INFRA_BOOLEAN_STRING, label: '否', value: false },
  ],
  [DICT_TYPE.BPM_MODEL_TYPE]: [
    { dictType: DICT_TYPE.BPM_MODEL_TYPE, label: 'BPMN 设计器', value: 10 },
    { dictType: DICT_TYPE.BPM_MODEL_TYPE, label: '简易设计器', value: 20 },
  ],
  [DICT_TYPE.BPM_MODEL_FORM_TYPE]: [
    { dictType: DICT_TYPE.BPM_MODEL_FORM_TYPE, label: '流程表单', value: 10 },
    { dictType: DICT_TYPE.BPM_MODEL_FORM_TYPE, label: '业务表单', value: 20 },
  ],
  [DICT_TYPE.COMMON_STATUS]: [
    { dictType: DICT_TYPE.COMMON_STATUS, label: '开启', value: 0 },
    { dictType: DICT_TYPE.COMMON_STATUS, label: '关闭', value: 1 },
  ],
  [DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS]: [
    { dictType: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, label: '未开始', value: -1 },
    { dictType: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, label: '审批中', value: 1 },
    { dictType: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, label: '审批通过', value: 2 },
    { dictType: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, label: '审批不通过', value: 3 },
    { dictType: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, label: '已取消', value: 4 },
  ],
  [DICT_TYPE.BPM_TASK_STATUS]: [
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '跳过', value: -2 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '未开始', value: -1 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '待审批', value: 0 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '审批中', value: 1 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '审批通过', value: 2 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '审批不通过', value: 3 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '已取消', value: 4 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '已退回', value: 5 },
    { dictType: DICT_TYPE.BPM_TASK_STATUS, label: '审批通过中', value: 7 },
  ],
  [DICT_TYPE.BPM_OA_LEAVE_TYPE]: [
    { dictType: DICT_TYPE.BPM_OA_LEAVE_TYPE, label: '病假', value: 1 },
    { dictType: DICT_TYPE.BPM_OA_LEAVE_TYPE, label: '事假', value: 2 },
    { dictType: DICT_TYPE.BPM_OA_LEAVE_TYPE, label: '婚假', value: 3 },
  ],
}

export function getDictOptions(dictType: string): DictDataType[] {
  return DICT_DATA[dictType] ? [...DICT_DATA[dictType]] : []
}

export function getIntDictOptions(dictType: string) {
  return getDictOptions(dictType).map(d => ({ ...d, value: Number(d.value) }))
}

export function getStrDictOptions(dictType: string) {
  return getDictOptions(dictType).map(d => ({ ...d, value: String(d.value) }))
}

export function getBoolDictOptions(dictType: string) {
  return getDictOptions(dictType).map(d => ({
    ...d,
    value: d.value === true || d.value === 'true',
  }))
}

export function getDictLabel(dictType: string, value: string | number | boolean) {
  const hit = getDictOptions(dictType).find(d => d.value === value || String(d.value) === String(value))
  return hit?.label ?? (value === undefined || value === null ? '' : String(value))
}
