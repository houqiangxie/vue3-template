import type { MenuOption } from 'naive-ui'
import { h } from 'vue'
import { NIcon } from 'naive-ui'
import {
  HomeOutline,
  GitNetworkOutline,
  ConstructOutline,
  GridOutline,
  DocumentTextOutline,
  FolderOutline,
  PeopleOutline,
  PulseOutline,
  CodeSlashOutline,
  GitBranchOutline,
  CheckboxOutline,
  CalendarOutline,
  CreateOutline,
  MailOutline,
} from '@vicons/ionicons5'

function renderIcon(icon: any) {
  return () => h(NIcon, { size: 18 }, { default: () => h(icon) })
}

/** BPM 独立站侧栏菜单（静态，与 router/bpm、主应用工作流菜单对齐） */
export const bpmMenuOptions: MenuOption[] = [
  {
    label: '工作台',
    key: 'BpmHome',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '流程模型',
    key: 'BpmModel',
    icon: renderIcon(GitNetworkOutline),
  },
  {
    label: '流程分类',
    key: 'BpmCategory',
    icon: renderIcon(FolderOutline),
  },
  {
    label: '流程表单',
    key: 'BpmForm',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: '用户分组',
    key: 'BpmUserGroup',
    icon: renderIcon(PeopleOutline),
  },
  {
    label: '流程监听器',
    key: 'BpmProcessListener',
    icon: renderIcon(PulseOutline),
  },
  {
    label: '流程表达式',
    key: 'BpmProcessExpression',
    icon: renderIcon(CodeSlashOutline),
  },
  {
    label: '发起流程',
    key: 'BpmProcessInstanceCreate',
    icon: renderIcon(CreateOutline),
  },
  {
    label: '流程实例',
    key: 'BpmProcessInstance',
    icon: renderIcon(GitBranchOutline),
  },
  {
    label: '流程任务',
    key: 'BpmTask',
    icon: renderIcon(CheckboxOutline),
  },
  {
    label: '抄送我的',
    key: 'BpmTaskCopy',
    icon: renderIcon(MailOutline),
  },
  {
    label: '请假申请',
    key: 'BpmLeave',
    icon: renderIcon(CalendarOutline),
  },
  {
    label: '简易设计器',
    key: 'BpmSimpleDesign',
    icon: renderIcon(GridOutline),
  },
  {
    label: 'BPMN 设计器',
    key: 'BpmnDesign',
    icon: renderIcon(ConstructOutline),
  },
]

/** 侧栏高亮：编辑页回到「流程模型」 */
export function resolveBpmMenuKey(routeName: string | symbol | null | undefined, activeMenu?: unknown) {
  if (typeof activeMenu === 'string' && activeMenu)
    return activeMenu
  if (routeName == null)
    return null
  return String(routeName)
}
