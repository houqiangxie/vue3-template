import { TaskStatusEnum } from '@/api/bpm/task'
import { NodeType, type SimpleFlowNode } from '@/components/SimpleProcessDesignerV2/src/consts'

/** 根据流程运行态，给简易流程图节点写入 activityStatus（用于节点着色） */
export function setSimpleModelNodeTaskStatus(
  simpleModel: SimpleFlowNode | undefined,
  processStatus: number | undefined,
  rejectedTaskActivityIds: string[] = [],
  unfinishedTaskActivityIds: string[] = [],
  finishedActivityIds: string[] = [],
  finishedSequenceFlowActivityIds: string[] = [],
) {
  if (!simpleModel)
    return

  if (simpleModel.type === NodeType.END_EVENT_NODE) {
    simpleModel.activityStatus = finishedActivityIds.includes(simpleModel.id)
      ? (processStatus as TaskStatusEnum)
      : TaskStatusEnum.NOT_START
    return
  }

  if (
    simpleModel.type === NodeType.START_USER_NODE
    || simpleModel.type === NodeType.USER_TASK_NODE
    || simpleModel.type === NodeType.TRANSACTOR_NODE
    || simpleModel.type === NodeType.CHILD_PROCESS_NODE
  ) {
    simpleModel.activityStatus = TaskStatusEnum.NOT_START
    if (rejectedTaskActivityIds.includes(simpleModel.id))
      simpleModel.activityStatus = TaskStatusEnum.REJECT
    else if (unfinishedTaskActivityIds.includes(simpleModel.id))
      simpleModel.activityStatus = TaskStatusEnum.RUNNING
    else if (finishedActivityIds.includes(simpleModel.id))
      simpleModel.activityStatus = TaskStatusEnum.APPROVE
  }

  if (simpleModel.type === NodeType.COPY_TASK_NODE
    || simpleModel.type === NodeType.DELAY_TIMER_NODE
    || simpleModel.type === NodeType.TRIGGER_NODE) {
    simpleModel.activityStatus = finishedActivityIds.includes(simpleModel.id)
      ? TaskStatusEnum.APPROVE
      : TaskStatusEnum.NOT_START
  }

  if (simpleModel.type === NodeType.CONDITION_NODE) {
    simpleModel.activityStatus = finishedSequenceFlowActivityIds.includes(simpleModel.id)
      ? TaskStatusEnum.APPROVE
      : TaskStatusEnum.NOT_START
  }

  if (
    simpleModel.type === NodeType.CONDITION_BRANCH_NODE
    || simpleModel.type === NodeType.PARALLEL_BRANCH_NODE
    || simpleModel.type === NodeType.INCLUSIVE_BRANCH_NODE
    || simpleModel.type === NodeType.ROUTER_BRANCH_NODE
  ) {
    simpleModel.activityStatus = finishedActivityIds.includes(simpleModel.id)
      ? TaskStatusEnum.APPROVE
      : TaskStatusEnum.NOT_START
    simpleModel.conditionNodes?.forEach((node) => {
      setSimpleModelNodeTaskStatus(
        node,
        processStatus,
        rejectedTaskActivityIds,
        unfinishedTaskActivityIds,
        finishedActivityIds,
        finishedSequenceFlowActivityIds,
      )
    })
  }

  setSimpleModelNodeTaskStatus(
    simpleModel.childNode,
    processStatus,
    rejectedTaskActivityIds,
    unfinishedTaskActivityIds,
    finishedActivityIds,
    finishedSequenceFlowActivityIds,
  )
}
