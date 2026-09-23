/** BPM / 芋道兼容常量（精简） */
export const CommonStatusEnum = {
  ENABLE: 0,
  DISABLE: 1,
}

export const BpmModelType = {
  BPMN: 10,
  SIMPLE: 20,
}

export const BpmModelFormType = {
  NORMAL: 10,
  CUSTOM: 20,
}

export const BpmProcessInstanceStatus = {
  NOT_START: -1,
  RUNNING: 1,
  APPROVE: 2,
  REJECT: 3,
  CANCEL: 4,
}

export const BpmAutoApproveType = {
  NONE: 0,
  APPROVE_ALL: 1,
  APPROVE_SEQUENT: 2,
}
