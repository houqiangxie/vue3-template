/** 系统管理模块类型定义 */

export interface SysUser {
  userId: number
  userName: string
  nickName: string
  deptId?: number
  deptName?: string
  phonenumber?: string
  email?: string
  sex?: '0' | '1' | '2'
  status: '0' | '1'
  postIds?: number[]
  postNames?: string
  roleIds?: number[]
  roleNames?: string
  remark?: string
  createTime?: string
}

export interface SysRole {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  status: '0' | '1'
  menuIds?: number[]
  remark?: string
  createTime?: string
}

export interface SysMenu {
  menuId: number
  parentId: number
  menuName: string
  /** M=目录 C=菜单 F=按钮 P=页面级菜单 */
  menuType: 'M' | 'C' | 'F' | 'P'
  orderNum: number
  /** 路由 name（keep-alive / 侧栏 key） */
  routeName?: string
  path?: string
  component?: string
  /** 高亮侧栏的菜单 name / 路径 */
  activeMenu?: string
  /** 权限字符 */
  perms?: string
  /** 重定向 url */
  redirect?: string
  icon?: string
  /** 是否缓存：0=缓存 1=不缓存 */
  isCache?: '0' | '1'
  /** 面包屑显示：0=显示 1=隐藏 */
  breadcrumb?: '0' | '1'
  /** 显示工作台：0=显示 1=不显示 */
  workbench?: '0' | '1'
  /** 显示状态：0=显示 1=不显示 */
  visible: '0' | '1'
  status: '0' | '1'
  children?: SysMenu[]
  createTime?: string
}

export interface PageQuery {
  pageNum?: number
  pageSize?: number
  [key: string]: unknown
}

export interface PageResult<T> {
  rows: T[]
  total: number
}

export interface SysDept {
  deptId: number
  parentId: number
  deptName: string
  orderNum: number
  leader?: string
  phone?: string
  email?: string
  status: '0' | '1'
  children?: SysDept[]
  createTime?: string
}

/** 字典类型 */
export interface SysDictType {
  dictId: number
  dictName: string
  dictType: string
  status: '0' | '1'
  remark?: string
  createTime?: string
}

/** 字典数据 */
export interface SysDictData {
  dictCode: number
  dictSort: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass?: string
  listClass?: string
  isDefault?: 'Y' | 'N'
  status: '0' | '1'
  remark?: string
  createTime?: string
}

/** 通知公告 */
export interface SysNotice {
  noticeId: number
  noticeTitle: string
  /** 1=通知 2=公告 */
  noticeType: '1' | '2'
  noticeContent?: string
  status: '0' | '1'
  createBy?: string
  createTime?: string
  remark?: string
}

/** 操作日志 */
export interface SysOperLog {
  operId: number
  title: string
  /** 0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8生成代码 9清空数据 */
  businessType: number
  method?: string
  requestMethod?: string
  /** 0其它 1后台用户 2手机端用户 */
  operatorType?: number
  operName?: string
  deptName?: string
  operUrl?: string
  operIp?: string
  operLocation?: string
  operParam?: string
  jsonResult?: string
  /** 0正常 1异常 */
  status: '0' | '1'
  errorMsg?: string
  operTime?: string
  costTime?: number
}

/** 登录日志 */
export interface SysLogininfor {
  infoId: number
  userName: string
  ipaddr?: string
  loginLocation?: string
  browser?: string
  os?: string
  /** 0成功 1失败 */
  status: '0' | '1'
  msg?: string
  loginTime?: string
}

/** 定时任务 */
export interface SysJob {
  jobId: number
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  /** 0默认 1立即触发执行 2触发一次执行 3不触发立即执行 */
  misfirePolicy?: '0' | '1' | '2' | '3'
  /** 0允许 1禁止 */
  concurrent?: '0' | '1'
  /** 0正常 1暂停 */
  status: '0' | '1'
  remark?: string
  createTime?: string
}

/** 定时任务日志 */
export interface SysJobLog {
  jobLogId: number
  jobName: string
  jobGroup: string
  invokeTarget: string
  jobMessage?: string
  /** 0正常 1失败 */
  status: '0' | '1'
  exceptionInfo?: string
  createTime?: string
}

/** 岗位 */
export interface SysPost {
  postId: number
  postCode: string
  postName: string
  postSort: number
  status: '0' | '1'
  remark?: string
  createTime?: string
}

/** 参数配置 */
export interface SysConfig {
  configId: number
  configName: string
  configKey: string
  configValue: string
  /** Y=系统内置 N=非内置 */
  configType: 'Y' | 'N'
  remark?: string
  createTime?: string
}

/** 在线用户 */
export interface SysUserOnline {
  tokenId: string
  userName: string
  deptName?: string
  ipaddr?: string
  loginLocation?: string
  browser?: string
  os?: string
  loginTime?: string
}
