import type {
  SysConfig,
  SysDept,
  SysDictData,
  SysDictType,
  SysJob,
  SysJobLog,
  SysLogininfor,
  SysMenu,
  SysNotice,
  SysOperLog,
  SysPost,
  SysRole,
  SysUser,
  SysUserOnline,
} from '../../src/api/system/types'
import type { MenuItem } from '../../src/router/utils/types'
import { now } from '../utils'

let nextUserId = 4
let nextRoleId = 3
let nextMenuId = 100
let nextDeptId = 5
let nextDictTypeId = 4
let nextDictDataId = 8
let nextNoticeId = 4
let nextOperId = 6
let nextLoginId = 5
let nextJobId = 4
let nextJobLogId = 5
let nextPostId = 4
let nextConfigId = 5
let nextBpmCategoryId = 3
let nextBpmFormId = 3
let nextBpmUserGroupId = 3
let nextBpmProcessListenerId = 3
let nextBpmProcessExpressionId = 3
let nextBpmLeaveId = 3
let nextBpmModelId = 3
let nextBpmProcessDefinitionSeq = 3
let nextBpmProcessInstanceId = 4
let nextBpmTaskId = 4

export const users: SysUser[] = [
  {
    userId: 1,
    userName: 'admin',
    nickName: '超级管理员',
    deptId: 1,
    deptName: '总公司',
    phonenumber: '13800000001',
    email: 'admin@example.com',
    sex: '0',
    status: '1',
    roleIds: [1],
    roleNames: '超级管理员',
    remark: '系统内置',
    createTime: '2024-01-01 00:00:00',
  },
  {
    userId: 2,
    userName: 'zhangsan',
    nickName: '张三',
    deptId: 2,
    deptName: '研发部',
    phonenumber: '13800000002',
    email: 'zhangsan@example.com',
    sex: '0',
    status: '1',
    roleIds: [2],
    roleNames: '普通角色',
    createTime: '2024-02-01 10:00:00',
  },
  {
    userId: 3,
    userName: 'lisi',
    nickName: '李四',
    deptId: 3,
    deptName: '市场部',
    phonenumber: '13800000003',
    email: 'lisi@example.com',
    sex: '1',
    status: '0',
    roleIds: [2],
    roleNames: '普通角色',
    createTime: '2024-03-01 12:00:00',
  },
]

export const roles: SysRole[] = [
  {
    roleId: 1,
    roleName: '超级管理员',
    roleKey: 'admin',
    roleSort: 1,
    status: '1',
    // 登录后由 menus 填充全部 menuId（见下方 init）
    menuIds: [] as number[],
    remark: '拥有全部权限',
    createTime: '2024-01-01 00:00:00',
  },
  {
    roleId: 2,
    roleName: '普通角色',
    roleKey: 'common',
    roleSort: 2,
    status: '1',
    menuIds: [2, 74, 3, 77, 75, 4, 76, 73, 5, 6, 10, 14, 21, 26, 34, 35, 41, 44],
    remark: '普通业务人员',
    createTime: '2024-01-01 00:00:00',
  },
]

export const menus: SysMenu[] = [
  { menuId: 2, parentId: 0, menuName: '首页', menuType: 'C', orderNum: 1, routeName: 'Index', path: '/index', component: 'index', perms: 'index:home:view', icon: 'HomeOutlined', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 74, parentId: 0, menuName: '示例演示', menuType: 'M', orderNum: 2, path: '/Demo', icon: 'AppstoreOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 3, parentId: 74, menuName: 'Modal 示例', menuType: 'C', orderNum: 1, path: '/Demo/ModalDemo', component: 'Demo/ModalDemo', perms: 'index:modal:view', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 77, parentId: 74, menuName: 'SqlSearch 示例', menuType: 'C', orderNum: 2, path: '/Demo/SqlSearchDemo', component: 'Demo/SqlSearchDemo', perms: 'index:sqlsearch:view', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 75, parentId: 0, menuName: '个人中心', menuType: 'M', orderNum: 3, path: '/Account', icon: 'UserOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 4, parentId: 75, menuName: '个人信息', menuType: 'C', orderNum: 1, path: '/Account/PersonInfo', component: 'Account/PersonInfo', perms: 'index:person:view', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 76, parentId: 0, menuName: 'AI 能力', menuType: 'M', orderNum: 4, path: '/Ai', icon: 'RobotOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 73, parentId: 76, menuName: 'AI 助手', menuType: 'C', orderNum: 1, path: '/Ai/AiChat', component: 'Ai/AiChat', perms: 'index:ai:chat', icon: 'RobotOutlined', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 5, parentId: 0, menuName: '系统管理', menuType: 'M', orderNum: 5, path: '/System', icon: 'SettingOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 6, parentId: 5, menuName: '用户管理', menuType: 'C', orderNum: 1, path: '/System/User', component: 'System/User', perms: 'system:user:list', icon: 'UserOutlined', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 7, parentId: 6, menuName: '用户查询', menuType: 'F', orderNum: 1, perms: 'system:user:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 8, parentId: 6, menuName: '用户新增', menuType: 'F', orderNum: 2, perms: 'system:user:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 9, parentId: 6, menuName: '用户修改', menuType: 'F', orderNum: 3, perms: 'system:user:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 10, parentId: 5, menuName: '角色管理', menuType: 'C', orderNum: 2, path: '/System/Role', component: 'System/Role', perms: 'system:role:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 11, parentId: 10, menuName: '角色查询', menuType: 'F', orderNum: 1, perms: 'system:role:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 12, parentId: 10, menuName: '角色新增', menuType: 'F', orderNum: 2, perms: 'system:role:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 13, parentId: 10, menuName: '角色修改', menuType: 'F', orderNum: 3, perms: 'system:role:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 14, parentId: 5, menuName: '菜单管理', menuType: 'C', orderNum: 3, path: '/System/Menu', component: 'System/Menu', perms: 'system:menu:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 15, parentId: 14, menuName: '菜单查询', menuType: 'F', orderNum: 1, perms: 'system:menu:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 16, parentId: 14, menuName: '菜单新增', menuType: 'F', orderNum: 2, perms: 'system:menu:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 17, parentId: 14, menuName: '菜单修改', menuType: 'F', orderNum: 3, perms: 'system:menu:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 18, parentId: 5, menuName: '部门管理', menuType: 'C', orderNum: 4, path: '/System/Dept', component: 'System/Dept', perms: 'system:dept:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 19, parentId: 18, menuName: '部门查询', menuType: 'F', orderNum: 1, perms: 'system:dept:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 20, parentId: 5, menuName: '内嵌页面', menuType: 'C', orderNum: 9, path: '/System/IFrame', component: 'system/iFrame/index', perms: 'system:menu:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 70, parentId: 5, menuName: '页签示例', menuType: 'C', orderNum: 10, routeName: 'System-TabDemo', path: '/System/TabDemo', component: 'TabView', icon: 'AppstoreOutlined', perms: 'system:menu:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 71, parentId: 70, menuName: '基础信息', menuType: 'P', orderNum: 1, routeName: 'System-TabDemoA', path: '/System/TabDemo/A', component: 'System/TabDemoA', perms: 'system:menu:list', visible: '0', status: '1', isCache: '1', activeMenu: 'System-TabDemo', createTime: '2024-01-01 00:00:00' },
  { menuId: 72, parentId: 70, menuName: '扩展信息', menuType: 'P', orderNum: 2, routeName: 'System-TabDemoB', path: '/System/TabDemo/B', component: 'System/TabDemoB', perms: 'system:menu:list', visible: '0', status: '1', isCache: '1', activeMenu: 'System-TabDemo', createTime: '2024-01-01 00:00:00' },
  { menuId: 21, parentId: 5, menuName: '字典管理', menuType: 'C', orderNum: 5, path: '/System/Dict', component: 'System/Dict', perms: 'system:dict:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 22, parentId: 21, menuName: '字典查询', menuType: 'F', orderNum: 1, perms: 'system:dict:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 23, parentId: 21, menuName: '字典新增', menuType: 'F', orderNum: 2, perms: 'system:dict:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 24, parentId: 21, menuName: '字典修改', menuType: 'F', orderNum: 3, perms: 'system:dict:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 25, parentId: 21, menuName: '字典删除', menuType: 'F', orderNum: 4, perms: 'system:dict:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 60, parentId: 21, menuName: '字典数据', menuType: 'C', orderNum: 5, routeName: 'System-DictData', path: '/System/DictData', component: 'System/DictData', perms: 'system:dict:list', visible: '0', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 26, parentId: 5, menuName: '通知公告', menuType: 'C', orderNum: 6, path: '/System/Notice', component: 'System/Notice', perms: 'system:notice:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 27, parentId: 26, menuName: '公告查询', menuType: 'F', orderNum: 1, perms: 'system:notice:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 28, parentId: 26, menuName: '公告新增', menuType: 'F', orderNum: 2, perms: 'system:notice:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 29, parentId: 26, menuName: '公告修改', menuType: 'F', orderNum: 3, perms: 'system:notice:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 30, parentId: 26, menuName: '公告删除', menuType: 'F', orderNum: 4, perms: 'system:notice:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 31, parentId: 10, menuName: '分配用户', menuType: 'C', orderNum: 5, routeName: 'System-AuthUser', path: '/System/AuthUser', component: 'System/AuthUser', perms: 'system:role:edit', visible: '0', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 32, parentId: 10, menuName: '取消授权', menuType: 'F', orderNum: 6, perms: 'system:role:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 33, parentId: 0, menuName: '系统监控', menuType: 'M', orderNum: 6, path: '/Monitor', icon: 'MonitorOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 34, parentId: 33, menuName: '定时任务', menuType: 'C', orderNum: 2, path: '/Monitor/Job', component: 'System/Job', perms: 'monitor:job:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 35, parentId: 34, menuName: '任务查询', menuType: 'F', orderNum: 1, perms: 'monitor:job:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 36, parentId: 34, menuName: '任务新增', menuType: 'F', orderNum: 2, perms: 'monitor:job:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 37, parentId: 34, menuName: '任务修改', menuType: 'F', orderNum: 3, perms: 'monitor:job:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 38, parentId: 34, menuName: '任务删除', menuType: 'F', orderNum: 4, perms: 'monitor:job:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 39, parentId: 34, menuName: '任务导出', menuType: 'F', orderNum: 5, perms: 'monitor:job:export', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 40, parentId: 34, menuName: '状态修改', menuType: 'F', orderNum: 6, perms: 'monitor:job:changeStatus', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 41, parentId: 33, menuName: '操作日志', menuType: 'C', orderNum: 3, path: '/Monitor/OperLog', component: 'System/OperLog', perms: 'monitor:operlog:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 42, parentId: 41, menuName: '操作查询', menuType: 'F', orderNum: 1, perms: 'monitor:operlog:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 43, parentId: 41, menuName: '操作删除', menuType: 'F', orderNum: 2, perms: 'monitor:operlog:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 44, parentId: 33, menuName: '登录日志', menuType: 'C', orderNum: 4, path: '/Monitor/LoginLog', component: 'System/LoginLog', perms: 'monitor:logininfor:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 45, parentId: 44, menuName: '登录查询', menuType: 'F', orderNum: 1, perms: 'monitor:logininfor:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 46, parentId: 44, menuName: '登录删除', menuType: 'F', orderNum: 2, perms: 'monitor:logininfor:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 47, parentId: 5, menuName: '岗位管理', menuType: 'C', orderNum: 7, path: '/System/Post', component: 'System/Post', perms: 'system:post:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 48, parentId: 47, menuName: '岗位查询', menuType: 'F', orderNum: 1, perms: 'system:post:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 49, parentId: 47, menuName: '岗位新增', menuType: 'F', orderNum: 2, perms: 'system:post:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 50, parentId: 47, menuName: '岗位修改', menuType: 'F', orderNum: 3, perms: 'system:post:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 51, parentId: 47, menuName: '岗位删除', menuType: 'F', orderNum: 4, perms: 'system:post:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 52, parentId: 5, menuName: '参数设置', menuType: 'C', orderNum: 8, path: '/System/Config', component: 'System/Config', perms: 'system:config:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 53, parentId: 52, menuName: '参数查询', menuType: 'F', orderNum: 1, perms: 'system:config:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 54, parentId: 52, menuName: '参数新增', menuType: 'F', orderNum: 2, perms: 'system:config:add', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 55, parentId: 52, menuName: '参数修改', menuType: 'F', orderNum: 3, perms: 'system:config:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 56, parentId: 52, menuName: '参数删除', menuType: 'F', orderNum: 4, perms: 'system:config:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 57, parentId: 33, menuName: '在线用户', menuType: 'C', orderNum: 1, path: '/Monitor/Online', component: 'System/Online', perms: 'monitor:online:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 58, parentId: 57, menuName: '在线查询', menuType: 'F', orderNum: 1, perms: 'monitor:online:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 59, parentId: 57, menuName: '批量强退', menuType: 'F', orderNum: 2, perms: 'monitor:online:forceLogout', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 80, parentId: 33, menuName: '服务监控', menuType: 'C', orderNum: 5, path: '/Monitor/Server', component: 'System/Server', perms: 'monitor:server:list', visible: '1', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 81, parentId: 80, menuName: '服务查询', menuType: 'F', orderNum: 1, perms: 'monitor:server:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 82, parentId: 33, menuName: '缓存管理', menuType: 'C', orderNum: 6, path: '/Monitor/Cache', component: 'System/Cache', perms: 'monitor:cache:list', visible: '1', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 83, parentId: 82, menuName: '缓存查询', menuType: 'F', orderNum: 1, perms: 'monitor:cache:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 84, parentId: 82, menuName: '缓存删除', menuType: 'F', orderNum: 2, perms: 'monitor:cache:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 90, parentId: 0, menuName: '系统工具', menuType: 'M', orderNum: 7, path: '/Tool', icon: 'ToolOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 91, parentId: 90, menuName: '表单设计器', menuType: 'C', orderNum: 1, path: '/Tool/Build', component: 'Tool/Build', perms: 'tool:build:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 92, parentId: 90, menuName: '代码生成', menuType: 'C', orderNum: 2, path: '/Tool/Gen', component: 'Tool/Gen', perms: 'tool:gen:list', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 93, parentId: 92, menuName: '生成查询', menuType: 'F', orderNum: 1, perms: 'tool:gen:query', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 94, parentId: 92, menuName: '生成修改', menuType: 'F', orderNum: 2, perms: 'tool:gen:edit', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 95, parentId: 92, menuName: '生成删除', menuType: 'F', orderNum: 3, perms: 'tool:gen:remove', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 96, parentId: 92, menuName: '导入代码', menuType: 'F', orderNum: 4, perms: 'tool:gen:import', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 97, parentId: 92, menuName: '预览代码', menuType: 'F', orderNum: 5, perms: 'tool:gen:preview', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 98, parentId: 92, menuName: '生成代码', menuType: 'F', orderNum: 6, perms: 'tool:gen:code', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  // —— 工作流 ——
  { menuId: 200, parentId: 0, menuName: '工作流', menuType: 'M', orderNum: 8, path: '/Bpm', icon: 'ApartmentOutlined', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 230, parentId: 200, menuName: '流程模型', menuType: 'C', orderNum: 1, path: '/Bpm/Model', component: 'Bpm/Model', perms: 'bpm:model:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 231, parentId: 230, menuName: '模型新增', menuType: 'F', orderNum: 1, perms: 'bpm:model:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 232, parentId: 230, menuName: '模型修改', menuType: 'F', orderNum: 2, perms: 'bpm:model:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 233, parentId: 230, menuName: '模型删除', menuType: 'F', orderNum: 3, perms: 'bpm:model:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 234, parentId: 230, menuName: '模型发布', menuType: 'F', orderNum: 4, perms: 'bpm:model:deploy', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 235, parentId: 200, menuName: '编辑流程模型', menuType: 'C', orderNum: 2, path: '/Bpm/ModelEditor/:type/:id?', component: 'Bpm/ModelEditor', perms: 'bpm:model:update', visible: '0', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 201, parentId: 200, menuName: '流程分类', menuType: 'C', orderNum: 3, path: '/Bpm/Category', component: 'Bpm/Category', perms: 'bpm:category:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 202, parentId: 201, menuName: '分类新增', menuType: 'F', orderNum: 1, perms: 'bpm:category:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 203, parentId: 201, menuName: '分类修改', menuType: 'F', orderNum: 2, perms: 'bpm:category:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 204, parentId: 201, menuName: '分类删除', menuType: 'F', orderNum: 3, perms: 'bpm:category:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 205, parentId: 200, menuName: '流程表单', menuType: 'C', orderNum: 4, path: '/Bpm/Form', component: 'Bpm/Form', perms: 'bpm:form:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 206, parentId: 205, menuName: '表单新增', menuType: 'F', orderNum: 1, perms: 'bpm:form:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 207, parentId: 205, menuName: '表单修改', menuType: 'F', orderNum: 2, perms: 'bpm:form:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 208, parentId: 205, menuName: '表单删除', menuType: 'F', orderNum: 3, perms: 'bpm:form:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 209, parentId: 200, menuName: '用户分组', menuType: 'C', orderNum: 5, path: '/Bpm/UserGroup', component: 'Bpm/UserGroup', perms: 'bpm:user-group:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 210, parentId: 209, menuName: '分组新增', menuType: 'F', orderNum: 1, perms: 'bpm:user-group:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 211, parentId: 209, menuName: '分组修改', menuType: 'F', orderNum: 2, perms: 'bpm:user-group:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 212, parentId: 209, menuName: '分组删除', menuType: 'F', orderNum: 3, perms: 'bpm:user-group:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 213, parentId: 200, menuName: '流程监听器', menuType: 'C', orderNum: 6, path: '/Bpm/ProcessListener', component: 'Bpm/ProcessListener', perms: 'bpm:process-listener:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 214, parentId: 213, menuName: '监听器新增', menuType: 'F', orderNum: 1, perms: 'bpm:process-listener:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 215, parentId: 213, menuName: '监听器修改', menuType: 'F', orderNum: 2, perms: 'bpm:process-listener:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 216, parentId: 213, menuName: '监听器删除', menuType: 'F', orderNum: 3, perms: 'bpm:process-listener:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 217, parentId: 200, menuName: '流程表达式', menuType: 'C', orderNum: 7, path: '/Bpm/ProcessExpression', component: 'Bpm/ProcessExpression', perms: 'bpm:process-expression:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 218, parentId: 217, menuName: '表达式新增', menuType: 'F', orderNum: 1, perms: 'bpm:process-expression:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 219, parentId: 217, menuName: '表达式修改', menuType: 'F', orderNum: 2, perms: 'bpm:process-expression:update', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 220, parentId: 217, menuName: '表达式删除', menuType: 'F', orderNum: 3, perms: 'bpm:process-expression:delete', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 236, parentId: 200, menuName: '流程实例', menuType: 'C', orderNum: 8, path: '/Bpm/ProcessInstance', component: 'Bpm/ProcessInstance', perms: 'bpm:process-instance:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 238, parentId: 200, menuName: '发起流程', menuType: 'C', orderNum: 7, path: '/Bpm/processInstance/create', component: 'Bpm/processInstance/create/index', perms: 'bpm:process-instance:query', visible: '1', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 239, parentId: 200, menuName: '流程详情', menuType: 'C', orderNum: 8, path: '/Bpm/processInstance/detail', component: 'Bpm/processInstance/detail/index', perms: 'bpm:process-instance:query', visible: '0', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 237, parentId: 200, menuName: '流程任务', menuType: 'C', orderNum: 9, path: '/Bpm/Task', component: 'Bpm/Task', perms: 'bpm:task:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 240, parentId: 200, menuName: '抄送我的', menuType: 'C', orderNum: 9, path: '/Bpm/task/copy', component: 'Bpm/task/copy/index', perms: 'bpm:task:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 241, parentId: 200, menuName: '流程报表', menuType: 'C', orderNum: 8, path: '/Bpm/processInstance/report', component: 'Bpm/processInstance/report/index', perms: 'bpm:process-instance:query', visible: '0', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 221, parentId: 200, menuName: '请假申请', menuType: 'C', orderNum: 10, path: '/Bpm/Leave', component: 'Bpm/Leave', perms: 'bpm:oa-leave:query', visible: '1', status: '1', isCache: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 222, parentId: 221, menuName: '发起请假', menuType: 'F', orderNum: 1, perms: 'bpm:oa-leave:create', visible: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { menuId: 242, parentId: 200, menuName: '发起请假页', menuType: 'C', orderNum: 11, path: '/Bpm/oa/leave/create', component: 'Bpm/oa/leave/create', perms: 'bpm:oa-leave:create', visible: '0', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
  { menuId: 243, parentId: 200, menuName: '请假详情页', menuType: 'C', orderNum: 12, path: '/Bpm/oa/leave/detail', component: 'Bpm/oa/leave/detail', perms: 'bpm:oa-leave:query', visible: '0', status: '1', isCache: '0', createTime: '2024-01-01 00:00:00' },
]

// 超级管理员拥有全部菜单（含 TabView 页面级子菜单 70–72）
roles[0].menuIds = menus.map(m => m.menuId)

export const depts: SysDept[] = [
  { deptId: 1, parentId: 0, deptName: '总公司', orderNum: 1, leader: '张总', phone: '010-88888888', email: 'hq@example.com', status: '1', createTime: '2024-01-01 00:00:00' },
  { deptId: 2, parentId: 1, deptName: '研发部', orderNum: 1, leader: '王工', phone: '010-88888801', email: 'rd@example.com', status: '1', createTime: '2024-01-01 00:00:00' },
  { deptId: 3, parentId: 1, deptName: '市场部', orderNum: 2, leader: '赵经理', phone: '010-88888802', email: 'mkt@example.com', status: '1', createTime: '2024-01-01 00:00:00' },
  { deptId: 4, parentId: 2, deptName: '前端组', orderNum: 1, leader: '小陈', status: '1', createTime: '2024-01-01 00:00:00' },
]

export const dictTypes: SysDictType[] = [
  { dictId: 1, dictName: '用户性别', dictType: 'sys_user_sex', status: '1', remark: '用户性别列表', createTime: '2024-01-01 00:00:00' },
  { dictId: 2, dictName: '系统开关', dictType: 'sys_normal_disable', status: '1', remark: '系统开关列表', createTime: '2024-01-01 00:00:00' },
  { dictId: 3, dictName: '通知类型', dictType: 'sys_notice_type', status: '1', remark: '通知类型列表', createTime: '2024-01-01 00:00:00' },
]

export const dictDatas: SysDictData[] = [
  { dictCode: 1, dictSort: 1, dictLabel: '男', dictValue: '0', dictType: 'sys_user_sex', listClass: 'default', isDefault: 'Y', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 2, dictSort: 2, dictLabel: '女', dictValue: '1', dictType: 'sys_user_sex', listClass: 'default', isDefault: 'N', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 3, dictSort: 3, dictLabel: '未知', dictValue: '2', dictType: 'sys_user_sex', listClass: 'default', isDefault: 'N', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 4, dictSort: 1, dictLabel: '正常', dictValue: '1', dictType: 'sys_normal_disable', listClass: 'primary', isDefault: 'Y', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 5, dictSort: 2, dictLabel: '停用', dictValue: '0', dictType: 'sys_normal_disable', listClass: 'danger', isDefault: 'N', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 6, dictSort: 1, dictLabel: '通知', dictValue: '1', dictType: 'sys_notice_type', listClass: 'warning', isDefault: 'Y', status: '1', createTime: '2024-01-01 00:00:00' },
  { dictCode: 7, dictSort: 2, dictLabel: '公告', dictValue: '2', dictType: 'sys_notice_type', listClass: 'success', isDefault: 'N', status: '1', createTime: '2024-01-01 00:00:00' },
]

export const notices: SysNotice[] = [
  { noticeId: 1, noticeTitle: '系统上线通知', noticeType: '1', noticeContent: '系统已正式上线，欢迎使用。', status: '1', createBy: 'admin', createTime: '2024-01-01 00:00:00' },
  { noticeId: 2, noticeTitle: '维护公告', noticeType: '2', noticeContent: '本周六凌晨 2:00-4:00 进行系统维护。', status: '1', createBy: 'admin', createTime: '2024-02-01 10:00:00' },
  { noticeId: 3, noticeTitle: '功能更新', noticeType: '1', noticeContent: '新增岗位、参数设置、在线用户，以及字典、日志、定时任务等系统管理功能。', status: '1', createBy: 'admin', createTime: '2024-03-01 09:00:00' },
]

export const operLogs: SysOperLog[] = [
  { operId: 1, title: '用户管理', businessType: 1, method: 'com.system.UserController.add()', requestMethod: 'POST', operatorType: 1, operName: 'admin', deptName: '总公司', operUrl: '/system/user', operIp: '127.0.0.1', operLocation: '内网IP', operParam: '{"userName":"zhangsan"}', jsonResult: '{"code":0}', status: '1', operTime: '2024-02-01 10:00:00', costTime: 56 },
  { operId: 2, title: '角色管理', businessType: 2, method: 'com.system.RoleController.edit()', requestMethod: 'PUT', operatorType: 1, operName: 'admin', deptName: '总公司', operUrl: '/system/role', operIp: '127.0.0.1', operLocation: '内网IP', status: '1', operTime: '2024-02-02 11:00:00', costTime: 32 },
  { operId: 3, title: '菜单管理', businessType: 3, method: 'com.system.MenuController.remove()', requestMethod: 'DELETE', operatorType: 1, operName: 'admin', deptName: '总公司', operUrl: '/system/menu/99', operIp: '127.0.0.1', operLocation: '内网IP', status: '0', errorMsg: '菜单不存在', operTime: '2024-02-03 12:00:00', costTime: 12 },
  { operId: 4, title: '角色管理', businessType: 4, method: 'com.system.RoleController.authMenu()', requestMethod: 'PUT', operatorType: 1, operName: 'admin', deptName: '总公司', operUrl: '/system/role/authMenu', operIp: '127.0.0.1', operLocation: '内网IP', status: '1', operTime: '2024-02-04 13:00:00', costTime: 45 },
  { operId: 5, title: '部门管理', businessType: 1, method: 'com.system.DeptController.add()', requestMethod: 'POST', operatorType: 1, operName: 'zhangsan', deptName: '研发部', operUrl: '/system/dept', operIp: '192.168.1.10', operLocation: '内网IP', status: '1', operTime: '2024-02-05 14:00:00', costTime: 28 },
]

export const logininfors: SysLogininfor[] = [
  { infoId: 1, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome', os: 'Windows 10', status: '1', msg: '登录成功', loginTime: '2024-03-01 09:00:00' },
  { infoId: 2, userName: 'zhangsan', ipaddr: '192.168.1.10', loginLocation: '内网IP', browser: 'Edge', os: 'Windows 11', status: '1', msg: '登录成功', loginTime: '2024-03-01 09:30:00' },
  { infoId: 3, userName: 'lisi', ipaddr: '192.168.1.20', loginLocation: '内网IP', browser: 'Firefox', os: 'macOS', status: '0', msg: '密码错误', loginTime: '2024-03-01 10:00:00' },
  { infoId: 4, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome', os: 'Windows 10', status: '1', msg: '登录成功', loginTime: '2024-03-02 08:00:00' },
]

export const jobs: SysJob[] = [
  { jobId: 1, jobName: '系统默认（无参）', jobGroup: 'DEFAULT', invokeTarget: 'ryTask.ryNoParams', cronExpression: '0/10 * * * * ?', misfirePolicy: '1', concurrent: '1', status: '1', remark: '演示任务', createTime: '2024-01-01 00:00:00' },
  { jobId: 2, jobName: '系统默认（有参）', jobGroup: 'DEFAULT', invokeTarget: "ryTask.ryParams('ry')", cronExpression: '0/15 * * * * ?', misfirePolicy: '1', concurrent: '1', status: '1', createTime: '2024-01-01 00:00:00' },
  { jobId: 3, jobName: '系统默认（多参）', jobGroup: 'DEFAULT', invokeTarget: "ryTask.ryMultipleParams('ry', true, 2000L, 316.50D, 100)", cronExpression: '0/20 * * * * ?', misfirePolicy: '1', concurrent: '1', status: '1', createTime: '2024-01-01 00:00:00' },
]

export const jobLogs: SysJobLog[] = [
  { jobLogId: 1, jobName: '系统默认（无参）', jobGroup: 'DEFAULT', invokeTarget: 'ryTask.ryNoParams', jobMessage: '系统默认（无参） 总共耗时：2毫秒', status: '1', createTime: '2024-03-01 00:00:10' },
  { jobLogId: 2, jobName: '系统默认（有参）', jobGroup: 'DEFAULT', invokeTarget: "ryTask.ryParams('ry')", jobMessage: '系统默认（有参） 总共耗时：3毫秒', status: '1', createTime: '2024-03-01 00:00:15' },
  { jobLogId: 3, jobName: '系统默认（多参）', jobGroup: 'DEFAULT', invokeTarget: "ryTask.ryMultipleParams('ry', true, 2000L, 316.50D, 100)", jobMessage: '执行失败', status: '0', exceptionInfo: '演示异常', createTime: '2024-03-01 00:00:20' },
  { jobLogId: 4, jobName: '系统默认（无参）', jobGroup: 'DEFAULT', invokeTarget: 'ryTask.ryNoParams', jobMessage: '系统默认（无参） 总共耗时：1毫秒', status: '1', createTime: '2024-03-01 00:00:30' },
]

export const posts: SysPost[] = [
  { postId: 1, postCode: 'ceo', postName: '董事长', postSort: 1, status: '1', remark: '公司最高管理者', createTime: '2024-01-01 00:00:00' },
  { postId: 2, postCode: 'se', postName: '项目经理', postSort: 2, status: '1', createTime: '2024-01-01 00:00:00' },
  { postId: 3, postCode: 'hr', postName: '人力资源', postSort: 3, status: '1', createTime: '2024-01-01 00:00:00' },
]

export const configs: SysConfig[] = [
  { configId: 1, configName: '主框架页-默认皮肤', configKey: 'sys.index.skinName', configValue: 'skin-blue', configType: 'Y', remark: '蓝色 skin-blue、绿色 skin-green', createTime: '2024-01-01 00:00:00' },
  { configId: 2, configName: '用户管理-账号初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: '初始化密码', createTime: '2024-01-01 00:00:00' },
  { configId: 3, configName: '主框架页-侧边栏主题', configKey: 'sys.index.sideTheme', configValue: 'theme-dark', configType: 'Y', remark: '深色 theme-dark、浅色 theme-light', createTime: '2024-01-01 00:00:00' },
  { configId: 4, configName: '账号自助-验证码开关', configKey: 'sys.account.captchaEnabled', configValue: 'true', configType: 'Y', remark: '是否开启验证码功能', createTime: '2024-01-01 00:00:00' },
]

export const onlines: SysUserOnline[] = [
  { tokenId: 'token-admin-001', userName: 'admin', deptName: '总公司', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome', os: 'Windows 10', loginTime: '2024-03-02 08:00:00' },
  { tokenId: 'token-zhangsan-001', userName: 'zhangsan', deptName: '研发部', ipaddr: '192.168.1.10', loginLocation: '内网IP', browser: 'Edge', os: 'Windows 11', loginTime: '2024-03-02 09:00:00' },
  { tokenId: 'token-lisi-001', userName: 'lisi', deptName: '市场部', ipaddr: '192.168.1.20', loginLocation: '内网IP', browser: 'Firefox', os: 'macOS', loginTime: '2024-03-02 09:30:00' },
]

/**
 * 动态路由菜单（对接 getRouters / MenuItem）
 * 对齐 guanweb：目录用 ParentView + alwaysShow，注册时扁平到 Layout 下
 */
export const routerMenus: MenuItem[] = [
  {
    id: 2,
    parentId: 0,
    name: 'Index',
    path: '/index',
    component: 'index',
    type: 2,
    isCache: '1',
    orderNum: 1,
    meta: { title: '首页', icon: 'HomeOutlined', affix: true, permissions: ['index:home:view'] },
  },
  {
    id: 74,
    parentId: 0,
    name: 'Demo',
    path: '/Demo',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 2,
    meta: { title: '示例演示', icon: 'AppstoreOutlined' },
    children: [
      {
        id: 3,
        parentId: 74,
        name: 'Demo-ModalDemo',
        path: '/Demo/ModalDemo',
        component: 'Demo/ModalDemo',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: 'Modal 示例', permissions: ['index:modal:view'] },
      },
      {
        id: 77,
        parentId: 74,
        name: 'Demo-SqlSearchDemo',
        path: '/Demo/SqlSearchDemo',
        component: 'Demo/SqlSearchDemo',
        type: 2,
        isCache: '1',
        orderNum: 2,
        meta: { title: 'SqlSearch 示例', permissions: ['index:sqlsearch:view'] },
      },
    ],
  },
  {
    id: 75,
    parentId: 0,
    name: 'Account',
    path: '/Account',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 3,
    meta: { title: '个人中心', icon: 'UserOutlined' },
    children: [
      {
        id: 4,
        parentId: 75,
        name: 'Account-PersonInfo',
        path: '/Account/PersonInfo',
        component: 'Account/PersonInfo',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: '个人信息', permissions: ['index:person:view'] },
      },
    ],
  },
  {
    id: 76,
    parentId: 0,
    name: 'Ai',
    path: '/Ai',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 4,
    meta: { title: 'AI 能力', icon: 'RobotOutlined' },
    children: [
      {
        id: 73,
        parentId: 76,
        name: 'Ai-AiChat',
        path: '/Ai/AiChat',
        component: 'Ai/AiChat',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: 'AI 助手', icon: 'RobotOutlined', permissions: ['index:ai:chat'] },
      },
    ],
  },
  {
    id: 5,
    parentId: 0,
    name: 'System',
    path: '/System',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 5,
    meta: { title: '系统管理', icon: 'SettingOutlined' },
    children: [
      {
        id: 6,
        parentId: 5,
        name: 'System-User',
        path: '/System/User',
        component: 'System/User',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: '用户管理', icon: 'UserOutlined', permissions: ['system:user:list'] },
      },
      {
        id: 10,
        parentId: 5,
        name: 'System-Role',
        path: '/System/Role',
        component: 'System/Role',
        type: 2,
        isCache: '1',
        orderNum: 2,
        meta: { title: '角色管理', permissions: ['system:role:list'] },
      },
      {
        id: 31,
        parentId: 5,
        name: 'System-AuthUser',
        path: '/System/AuthUser',
        component: 'System/AuthUser',
        type: 2,
        isCache: '1',
        hidden: true,
        orderNum: 2,
        meta: { title: '分配用户', activeMenu: 'System-Role', permissions: ['system:role:edit'] },
      },
      {
        id: 14,
        parentId: 5,
        name: 'System-Menu',
        path: '/System/Menu',
        component: 'System/Menu',
        type: 2,
        isCache: '1',
        orderNum: 3,
        meta: { title: '菜单管理', permissions: ['system:menu:list'] },
      },
      {
        id: 18,
        parentId: 5,
        name: 'System-Dept',
        path: '/System/Dept',
        component: 'System/Dept',
        type: 2,
        isCache: '1',
        orderNum: 4,
        meta: { title: '部门管理', permissions: ['system:dept:list'] },
      },
      {
        id: 21,
        parentId: 5,
        name: 'System-Dict',
        path: '/System/Dict',
        component: 'System/Dict',
        type: 2,
        isCache: '1',
        orderNum: 5,
        meta: { title: '字典管理', permissions: ['system:dict:list'] },
      },
      {
        id: 60,
        parentId: 5,
        name: 'System-DictData',
        path: '/System/DictData',
        component: 'System/DictData',
        type: 2,
        isCache: '1',
        hidden: true,
        orderNum: 5,
        meta: { title: '字典数据', activeMenu: 'System-Dict', permissions: ['system:dict:list'] },
      },
      {
        id: 26,
        parentId: 5,
        name: 'System-Notice',
        path: '/System/Notice',
        component: 'System/Notice',
        type: 2,
        isCache: '1',
        orderNum: 6,
        meta: { title: '通知公告', permissions: ['system:notice:list'] },
      },
      {
        id: 47,
        parentId: 5,
        name: 'System-Post',
        path: '/System/Post',
        component: 'System/Post',
        type: 2,
        isCache: '1',
        orderNum: 7,
        meta: { title: '岗位管理', permissions: ['system:post:list'] },
      },
      {
        id: 52,
        parentId: 5,
        name: 'System-Config',
        path: '/System/Config',
        component: 'System/Config',
        type: 2,
        isCache: '1',
        orderNum: 8,
        meta: { title: '参数设置', permissions: ['system:config:list'] },
      },
      {
        id: 20,
        parentId: 5,
        name: 'System-IFrame',
        path: '/System/IFrame',
        component: 'system/iFrame/index',
        type: 2,
        isCache: '1',
        orderNum: 9,
        redirect: 'https://naiveui.com',
        meta: {
          title: '内嵌页面',
          iFrameUrl: 'https://naiveui.com',
          permissions: ['system:menu:list'],
        },
      },
      {
        id: 70,
        parentId: 5,
        name: 'System-TabDemo',
        path: '/System/TabDemo',
        component: 'TabView',
        type: 2,
        isCache: '1',
        orderNum: 10,
        meta: { title: '页签示例', icon: 'AppstoreOutlined', permissions: ['system:menu:list'] },
        children: [
          {
            id: 71,
            parentId: 70,
            name: 'System-TabDemoA',
            path: '/System/TabDemo/A',
            component: 'System/TabDemoA',
            type: 4,
            isCache: '1',
            hidden: true,
            orderNum: 1,
            meta: {
              title: '基础信息',
              activeMenu: 'System-TabDemo',
              permissions: ['system:menu:list'],
            },
          },
          {
            id: 72,
            parentId: 70,
            name: 'System-TabDemoB',
            path: '/System/TabDemo/B',
            component: 'System/TabDemoB',
            type: 4,
            isCache: '1',
            hidden: true,
            orderNum: 2,
            meta: {
              title: '扩展信息',
              activeMenu: 'System-TabDemo',
              permissions: ['system:menu:list'],
            },
          },
        ],
      },
    ],
  },
  {
    id: 33,
    parentId: 0,
    name: 'Monitor',
    path: '/Monitor',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 6,
    meta: { title: '系统监控', icon: 'MonitorOutlined' },
    children: [
      {
        id: 57,
        parentId: 33,
        name: 'Monitor-Online',
        path: '/Monitor/Online',
        component: 'System/Online',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: '在线用户', permissions: ['monitor:online:list'] },
      },
      {
        id: 34,
        parentId: 33,
        name: 'Monitor-Job',
        path: '/Monitor/Job',
        component: 'System/Job',
        type: 2,
        isCache: '1',
        orderNum: 2,
        meta: { title: '定时任务', permissions: ['monitor:job:list'] },
      },
      {
        id: 41,
        parentId: 33,
        name: 'Monitor-OperLog',
        path: '/Monitor/OperLog',
        component: 'System/OperLog',
        type: 2,
        isCache: '1',
        orderNum: 3,
        meta: { title: '操作日志', permissions: ['monitor:operlog:list'] },
      },
      {
        id: 44,
        parentId: 33,
        name: 'Monitor-LoginLog',
        path: '/Monitor/LoginLog',
        component: 'System/LoginLog',
        type: 2,
        isCache: '1',
        orderNum: 4,
        meta: { title: '登录日志', permissions: ['monitor:logininfor:list'] },
      },
      {
        id: 80,
        parentId: 33,
        name: 'Monitor-Server',
        path: '/Monitor/Server',
        component: 'System/Server',
        type: 2,
        isCache: '0',
        orderNum: 5,
        meta: { title: '服务监控', permissions: ['monitor:server:list'] },
      },
      {
        id: 82,
        parentId: 33,
        name: 'Monitor-Cache',
        path: '/Monitor/Cache',
        component: 'System/Cache',
        type: 2,
        isCache: '0',
        orderNum: 6,
        meta: { title: '缓存管理', permissions: ['monitor:cache:list'] },
      },
    ],
  },
  {
    id: 90,
    parentId: 0,
    name: 'Tool',
    path: '/Tool',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 7,
    meta: { title: '系统工具', icon: 'ToolOutlined' },
    children: [
      {
        id: 91,
        parentId: 90,
        name: 'Tool-Build',
        path: '/Tool/Build',
        component: 'Tool/Build',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: '表单设计器', permissions: ['tool:build:list'] },
      },
      {
        id: 92,
        parentId: 90,
        name: 'Tool-Gen',
        path: '/Tool/Gen',
        component: 'Tool/Gen',
        type: 2,
        isCache: '1',
        orderNum: 2,
        meta: { title: '代码生成', permissions: ['tool:gen:list'] },
      },
    ],
  },
  {
    id: 200,
    parentId: 0,
    name: 'Bpm',
    path: '/Bpm',
    component: 'ParentView',
    type: 1,
    alwaysShow: true,
    orderNum: 8,
    meta: { title: '工作流', icon: 'ApartmentOutlined' },
    children: [
      {
        id: 230,
        parentId: 200,
        name: 'Bpm-Model',
        path: '/Bpm/Model',
        component: 'Bpm/Model',
        type: 2,
        isCache: '1',
        orderNum: 1,
        meta: { title: '流程模型', permissions: ['bpm:model:query'] },
      },
      {
        id: 235,
        parentId: 200,
        name: 'Bpm-ModelEditor',
        path: '/Bpm/ModelEditor/:type/:id?',
        component: 'Bpm/ModelEditor',
        type: 2,
        isCache: '0',
        orderNum: 2,
        hidden: true,
        meta: {
          title: '编辑流程模型',
          permissions: ['bpm:model:update'],
          activeMenu: 'Bpm-Model',
          hideMenu: true,
        },
      },
      {
        id: 201,
        parentId: 200,
        name: 'Bpm-Category',
        path: '/Bpm/Category',
        component: 'Bpm/Category',
        type: 2,
        isCache: '1',
        orderNum: 3,
        meta: { title: '流程分类', permissions: ['bpm:category:query'] },
      },
      {
        id: 205,
        parentId: 200,
        name: 'Bpm-Form',
        path: '/Bpm/Form',
        component: 'Bpm/Form',
        type: 2,
        isCache: '1',
        orderNum: 4,
        meta: { title: '流程表单', permissions: ['bpm:form:query'] },
      },
      {
        id: 209,
        parentId: 200,
        name: 'Bpm-UserGroup',
        path: '/Bpm/UserGroup',
        component: 'Bpm/UserGroup',
        type: 2,
        isCache: '1',
        orderNum: 5,
        meta: { title: '用户分组', permissions: ['bpm:user-group:query'] },
      },
      {
        id: 213,
        parentId: 200,
        name: 'Bpm-ProcessListener',
        path: '/Bpm/ProcessListener',
        component: 'Bpm/ProcessListener',
        type: 2,
        isCache: '1',
        orderNum: 6,
        meta: { title: '流程监听器', permissions: ['bpm:process-listener:query'] },
      },
      {
        id: 217,
        parentId: 200,
        name: 'Bpm-ProcessExpression',
        path: '/Bpm/ProcessExpression',
        component: 'Bpm/ProcessExpression',
        type: 2,
        isCache: '1',
        orderNum: 7,
        meta: { title: '流程表达式', permissions: ['bpm:process-expression:query'] },
      },
      {
        id: 236,
        parentId: 200,
        name: 'Bpm-ProcessInstance',
        path: '/Bpm/ProcessInstance',
        component: 'Bpm/ProcessInstance',
        type: 2,
        isCache: '1',
        orderNum: 8,
        meta: { title: '流程实例', permissions: ['bpm:process-instance:query'] },
      },
      {
        id: 238,
        parentId: 200,
        name: 'Bpm-ProcessInstanceCreate',
        path: '/Bpm/processInstance/create',
        component: 'Bpm/processInstance/create/index',
        type: 2,
        isCache: '0',
        orderNum: 7,
        meta: { title: '发起流程', permissions: ['bpm:process-instance:query'] },
      },
      {
        id: 239,
        parentId: 200,
        name: 'Bpm-ProcessInstanceDetail',
        path: '/Bpm/processInstance/detail',
        component: 'Bpm/processInstance/detail/index',
        type: 2,
        isCache: '0',
        orderNum: 8,
        hidden: true,
        meta: {
          title: '流程详情',
          permissions: ['bpm:process-instance:query'],
          activeMenu: 'Bpm-ProcessInstance',
          hideMenu: true,
        },
      },
      {
        id: 237,
        parentId: 200,
        name: 'Bpm-Task',
        path: '/Bpm/Task',
        component: 'Bpm/Task',
        type: 2,
        isCache: '1',
        orderNum: 9,
        meta: { title: '流程任务', permissions: ['bpm:task:query'] },
      },
      {
        id: 240,
        parentId: 200,
        name: 'Bpm-TaskCopy',
        path: '/Bpm/task/copy',
        component: 'Bpm/task/copy/index',
        type: 2,
        isCache: '1',
        orderNum: 9,
        meta: { title: '抄送我的', permissions: ['bpm:task:query'] },
      },
      {
        id: 241,
        parentId: 200,
        name: 'Bpm-ProcessInstanceReport',
        path: '/Bpm/processInstance/report',
        component: 'Bpm/processInstance/report/index',
        type: 2,
        isCache: '0',
        orderNum: 8,
        meta: {
          title: '流程报表',
          permissions: ['bpm:process-instance:query'],
          hideMenu: true,
          activeMenu: 'Bpm-Model',
        },
      },
      {
        id: 221,
        parentId: 200,
        name: 'Bpm-Leave',
        path: '/Bpm/Leave',
        component: 'Bpm/Leave',
        type: 2,
        isCache: '1',
        orderNum: 10,
        meta: { title: '请假申请', permissions: ['bpm:oa-leave:query'] },
      },
      {
        id: 242,
        parentId: 200,
        name: 'Bpm-LeaveCreate',
        path: '/Bpm/oa/leave/create',
        component: 'Bpm/oa/leave/create',
        type: 2,
        isCache: '0',
        orderNum: 11,
        meta: {
          title: '发起请假',
          permissions: ['bpm:oa-leave:create'],
          hideMenu: true,
          activeMenu: 'Bpm-Leave',
        },
      },
      {
        id: 243,
        parentId: 200,
        name: 'Bpm-LeaveDetail',
        path: '/Bpm/oa/leave/detail',
        component: 'Bpm/oa/leave/detail',
        type: 2,
        isCache: '0',
        orderNum: 12,
        meta: {
          title: '请假详情',
          permissions: ['bpm:oa-leave:query'],
          hideMenu: true,
          activeMenu: 'Bpm-Leave',
        },
      },
    ],
  },
]

export function genUserId() {
  return nextUserId++
}

export function genRoleId() {
  return nextRoleId++
}

export function genMenuId() {
  return nextMenuId++
}

export function genDeptId() {
  return nextDeptId++
}

export function genDictTypeId() {
  return nextDictTypeId++
}

export function genDictDataId() {
  return nextDictDataId++
}

export function genNoticeId() {
  return nextNoticeId++
}

export function genOperId() {
  return nextOperId++
}

export function genLoginId() {
  return nextLoginId++
}

export function genJobId() {
  return nextJobId++
}

export function genJobLogId() {
  return nextJobLogId++
}

export function genPostId() {
  return nextPostId++
}

export function genConfigId() {
  return nextConfigId++
}

/** BPM Mock 数据 */
export const bpmCategories: any[] = [
  { id: 1, name: '默认', code: 'default', status: 0, sort: 1, createTime: '2024-01-01 00:00:00' },
  { id: 2, name: 'OA 办公', code: 'oa', status: 0, sort: 2, createTime: '2024-01-01 00:00:00' },
]

const leaveFormFields = [
  JSON.stringify({
    key: 'reason',
    label: '请假原因',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: false,
    bind: { type: 'textarea', rows: 3, placeholder: '请输入请假原因' },
  }),
  JSON.stringify({
    key: 'type',
    label: '请假类型',
    component: 'NSelect',
    form: { required: true, span: 1 },
    search: false,
    table: false,
    options: [
      { label: '事假', value: 1 },
      { label: '病假', value: 2 },
      { label: '年假', value: 3 },
    ],
  }),
  JSON.stringify({
    key: 'startTime',
    label: '开始时间',
    component: 'NDatePicker',
    form: { required: true, span: 1 },
    search: false,
    table: false,
    bind: { type: 'datetime', clearable: true },
  }),
  JSON.stringify({
    key: 'endTime',
    label: '结束时间',
    component: 'NDatePicker',
    form: { required: true, span: 1 },
    search: false,
    table: false,
    bind: { type: 'datetime', clearable: true },
  }),
]

const expenseFormFields = [
  JSON.stringify({
    key: 'title',
    label: '报销标题',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: false,
  }),
  JSON.stringify({
    key: 'amount',
    label: '报销金额',
    component: 'NInputNumber',
    form: { required: true, span: 1 },
    search: false,
    table: false,
    bind: { min: 0, precision: 2 },
  }),
  JSON.stringify({
    key: 'remark',
    label: '备注',
    component: 'NInput',
    form: { span: 2 },
    search: false,
    table: false,
    bind: { type: 'textarea', rows: 2 },
  }),
]

/** 审批节点办理子表单 */
const approveNodeFormFields = [
  JSON.stringify({
    key: 'approveNote',
    label: '办理说明',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: false,
    bind: { type: 'textarea', rows: 3, placeholder: '请填写办理说明' },
  }),
  JSON.stringify({
    key: 'actualDays',
    label: '核定天数',
    component: 'NInputNumber',
    form: { required: true, span: 1 },
    search: false,
    table: false,
    bind: { min: 0.5, step: 0.5, precision: 1 },
  }),
]

const formBuilderConf = JSON.stringify({ engine: 'formBuilder', version: 1, formCols: 2 })

const leaveSimpleModel = {
  id: 'StartUserNode',
  name: '发起人',
  type: 10,
  childNode: {
    id: 'UserTask_1',
    name: '部门审批',
    type: 11,
    showText: '部门负责人',
    candidateStrategy: 20,
    childNode: {
      id: 'UserTask_2',
      name: '人事审批',
      type: 11,
      showText: '人事专员',
      candidateStrategy: 30,
      childNode: {
        id: 'EndEvent',
        name: '结束',
        type: 1,
      },
    },
  },
}

const expenseBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn" targetNamespace="http://flowable.org/processdef">
  <process id="oa_expense" name="报销审批" isExecutable="true">
    <startEvent id="startEvent" name="开始"/>
    <userTask id="approveTask" name="财务审批" flowable:assignee="\${assignee}"/>
    <endEvent id="endEvent" name="结束"/>
    <sequenceFlow id="flow1" sourceRef="startEvent" targetRef="approveTask"/>
    <sequenceFlow id="flow2" sourceRef="approveTask" targetRef="endEvent"/>
  </process>
</definitions>`

export const bpmForms: any[] = (() => {
  const g = globalThis as any
  const approveForm = {
    id: 3,
    name: '审批办理表单',
    conf: formBuilderConf,
    fields: approveNodeFormFields,
    status: 0,
    remark: '节点办理子表单',
    createTime: '2024-03-01 00:00:00',
  }
  if (Array.isArray(g.__mockBpmForms) && g.__mockBpmForms.length) {
    if (!g.__mockBpmForms.some((f: any) => f.id === 3))
      g.__mockBpmForms.push(approveForm)
    return g.__mockBpmForms
  }
  const seed = [
    { id: 1, name: '请假表单', conf: formBuilderConf, fields: leaveFormFields, status: 0, remark: '示例表单', createTime: '2024-01-01 00:00:00' },
    { id: 2, name: '报销表单', conf: formBuilderConf, fields: expenseFormFields, status: 0, remark: '', createTime: '2024-02-01 00:00:00' },
    approveForm,
  ]
  g.__mockBpmForms = seed
  if (typeof g.__mockNextBpmFormId !== 'number')
    g.__mockNextBpmFormId = 4
  return seed
})()

export const bpmUserGroups: any[] = [
  { id: 1, name: '研发审批组', description: '研发部审批人员', userIds: [1, 2], status: 0, remark: '', createTime: '2024-01-01 00:00:00' },
  { id: 2, name: '人事组', description: '人事相关', userIds: [1], status: 0, remark: '', createTime: '2024-01-01 00:00:00' },
]

export const bpmProcessListeners = [
  { id: 1, name: '流程启动日志', type: 'execution', status: 0, event: 'start', valueType: 'class', value: 'com.example.StartListener' },
  { id: 2, name: '任务完成通知', type: 'task', status: 0, event: 'complete', valueType: 'delegateExpression', value: '${taskCompleteListener}' },
]

export const bpmProcessExpressions = [
  { id: 1, name: '发起人', status: 0, expression: '${startUserId}' },
  { id: 2, name: '部门负责人', status: 0, expression: '${deptLeader}' },
]

export const bpmLeaves: any[] = [
  { id: 1, status: 2, type: 1, reason: '感冒休息', processInstanceId: 'pi-1001', startTime: '2024-03-01 09:00:00', endTime: '2024-03-02 18:00:00', createTime: '2024-03-01 08:30:00' },
  { id: 2, status: 1, type: 2, reason: '家中有事', processInstanceId: 'pi-1003', startTime: '2024-04-10 09:00:00', endTime: '2024-04-11 18:00:00', createTime: '2024-04-09 17:00:00' },
]

/** 抄送记录 */
export const bpmProcessCopies: any[] = [
  {
    id: 1,
    processInstanceId: 'pi-1002',
    processInstanceName: '张三的报销',
    processInstanceStartTime: '2024-03-02 10:00:00',
    startUser: { id: 2, nickname: '张三', deptName: '研发部' },
    startUserNickname: '张三',
    activityId: 'approveTask',
    activityName: '财务审批',
    createUser: { id: 1, nickname: '超级管理员' },
    createUserNickname: '超级管理员',
    createTime: '2024-03-02 16:05:00',
    reason: '知会财务',
    summary: [
      { key: '标题', value: '出差交通费' },
      { key: '金额', value: '1280' },
    ],
  },
]

/** 流转评论 */
export const bpmProcessComments: any[] = [
  {
    id: 1,
    processInstanceId: 'pi-1003',
    userId: 1,
    userNickname: '超级管理员',
    content: '请尽快处理，家里有急事。',
    createTime: '2024-04-10 09:20:00',
  },
  {
    id: 2,
    processInstanceId: 'pi-1003',
    userId: 3,
    userNickname: '李四',
    content: '收到，今天内审批。',
    createTime: '2024-04-10 10:05:00',
  },
]

let nextBpmCommentId = 3
let nextBpmCopyId = 2

export function genBpmCommentId() {
  return nextBpmCommentId++
}

export function genBpmCopyId() {
  return nextBpmCopyId++
}

export const bpmProcessDefinitions: any[] = [
  {
    id: 'pd-oa_leave:1:1001',
    key: 'oa_leave',
    name: '请假审批',
    version: 1,
    category: 'oa',
    modelId: 1,
    modelType: 20,
    formType: 10,
    formId: 1,
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#3473ff"/><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif">假</text></svg>'),
    suspensionState: 1,
    deploymentTime: '2024-01-05 10:00:00',
    deploymentTIme: '2024-01-05 10:00:00',
    simpleModel: JSON.stringify(leaveSimpleModel),
    bpmnXml: '',
    description: '示例请假流程 v1',
    managerUserIds: [1],
    startUserIds: [2, 3],
    startDeptIds: [],
    allowCancelRunningProcess: true,
    allowWithdrawTask: false,
  },
  {
    id: 'pd-oa_expense:1:1002',
    key: 'oa_expense',
    name: '报销审批',
    version: 1,
    category: 'oa',
    modelId: 2,
    modelType: 10,
    formType: 10,
    formId: 2,
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#10b981"/><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif">报</text></svg>'),
    suspensionState: 1,
    deploymentTime: '2024-02-05 11:00:00',
    deploymentTIme: '2024-02-05 11:00:00',
    simpleModel: '',
    bpmnXml: expenseBpmnXml,
    description: '示例报销流程 v1',
    managerUserIds: [1],
    startUserIds: [],
    startDeptIds: [2, 3],
    allowCancelRunningProcess: true,
    allowWithdrawTask: false,
  },
]

export const bpmModels: any[] = [
  {
    id: 1,
    name: '请假审批',
    key: 'oa_leave',
    category: 'oa',
    type: 20,
    formType: 10,
    formId: 1,
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#3473ff"/><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif">假</text></svg>'),
    visible: true,
    status: 0,
    description: '示例请假流程',
    managerUserIds: [1],
    startUserIds: [2, 3],
    startDeptIds: [],
    simpleModel: leaveSimpleModel,
    bpmnXml: '',
    allowCancelRunningProcess: true,
    allowWithdrawTask: false,
    printTemplateSetting: {
      enable: true,
      template: '<h2>请假审批单</h2><p>申请人：{{startUser}}</p><p>原因：{{reason}}</p>',
    },
    processDefinition: {
      id: 'pd-oa_leave:1:1001',
      version: 1,
      suspensionState: 1,
      deploymentTime: '2024-01-05 10:00:00',
      deploymentTIme: '2024-01-05 10:00:00',
      formType: 10,
    },
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    name: '报销审批',
    key: 'oa_expense',
    category: 'oa',
    type: 10,
    formType: 10,
    formId: 2,
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#10b981"/><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif">报</text></svg>'),
    visible: true,
    status: 0,
    description: '示例报销流程',
    managerUserIds: [1],
    startUserIds: [],
    startDeptIds: [2, 3],
    bpmnXml: expenseBpmnXml,
    simpleModel: null,
    allowCancelRunningProcess: true,
    allowWithdrawTask: false,
    processDefinition: {
      id: 'pd-oa_expense:1:1002',
      version: 1,
      suspensionState: 1,
      deploymentTime: '2024-02-05 11:00:00',
      deploymentTIme: '2024-02-05 11:00:00',
      formType: 10,
    },
    createTime: '2024-02-01 00:00:00',
  },
]

const mockAdminUser = { id: 1, nickname: '超级管理员', avatar: '', deptName: '总公司' }
const mockZhangSan = { id: 2, nickname: '张三', avatar: '', deptName: '研发部' }
const mockLiSi = { id: 3, nickname: '李四', avatar: '', deptName: '市场部' }

export const bpmProcessInstances: any[] = [
  {
    id: 'pi-1001',
    name: '王五的请假',
    category: 'oa',
    status: 2,
    processDefinitionId: 'pd-oa_leave:1:1001',
    processDefinitionKey: 'oa_leave',
    businessKey: '1',
    startUser: mockAdminUser,
    startUserNickname: '超级管理员',
    startTime: '2024-03-01 09:00:00',
    createTime: '2024-03-01 09:00:00',
    endTime: '2024-03-01 18:00:00',
    durationInMillis: 9 * 60 * 60 * 1000,
    formVariables: {
      reason: '感冒休息',
      type: 1,
      startTime: '2024-03-01 09:00:00',
      endTime: '2024-03-02 18:00:00',
      approveNote: '情况属实，准假',
      actualDays: 2,
    },
  },
  {
    id: 'pi-1002',
    name: '张三的报销',
    category: 'oa',
    status: 2,
    processDefinitionId: 'pd-oa_expense:1:1002',
    processDefinitionKey: 'oa_expense',
    businessKey: '',
    startUser: mockZhangSan,
    startUserNickname: '张三',
    startTime: '2024-03-02 10:00:00',
    createTime: '2024-03-02 10:00:00',
    endTime: '2024-03-02 18:00:00',
    durationInMillis: 8 * 60 * 60 * 1000,
    formVariables: {
      title: '出差交通费',
      amount: 1280,
      remark: '北京出差高铁+打车',
    },
  },
  {
    id: 'pi-1003',
    name: '超级管理员的请假',
    category: 'oa',
    status: 1,
    processDefinitionId: 'pd-oa_leave:1:1001',
    processDefinitionKey: 'oa_leave',
    businessKey: '2',
    startUser: mockAdminUser,
    startUserNickname: '超级管理员',
    startTime: '2024-04-10 09:00:00',
    createTime: '2024-04-10 09:00:00',
    endTime: '',
    durationInMillis: 0,
    formVariables: {
      reason: '家中有事',
      type: 2,
      startTime: '2024-04-10 09:00:00',
      endTime: '2024-04-11 18:00:00',
    },
  },
]

export const bpmTasks: any[] = [
  {
    id: 'task-1001',
    name: '部门审批',
    processInstanceId: 'pi-1001',
    processInstanceName: '王五的请假',
    taskDefinitionKey: 'UserTask_1',
    assigneeUser: mockAdminUser,
    assigneeUserNickname: '超级管理员',
    ownerUser: mockAdminUser,
    createTime: '2024-03-01 09:05:00',
    endTime: '2024-03-01 18:00:00',
    durationInMillis: (18 - 9) * 60 * 60 * 1000 - 5 * 60 * 1000,
    status: 2,
    reason: '同意',
    formId: 3,
    formName: '审批办理表单',
    formVariables: {
      approveNote: '情况属实，准假',
      actualDays: 2,
    },
  },
  {
    id: 'task-1002',
    name: '财务审批',
    processInstanceId: 'pi-1002',
    processInstanceName: '张三的报销',
    taskDefinitionKey: 'approveTask',
    assigneeUser: mockLiSi,
    assigneeUserNickname: '李四',
    ownerUser: mockLiSi,
    createTime: '2024-03-02 10:10:00',
    endTime: '2024-03-02 16:00:00',
    durationInMillis: (16 - 10) * 60 * 60 * 1000 - 10 * 60 * 1000,
    status: 2,
    reason: '票据齐全，同意报销',
  },
  {
    id: 'task-1003',
    name: '部门审批',
    processInstanceId: 'pi-1003',
    processInstanceName: '超级管理员的请假',
    taskDefinitionKey: 'UserTask_1',
    assigneeUser: mockAdminUser,
    assigneeUserNickname: '超级管理员',
    ownerUser: mockAdminUser,
    createTime: '2024-04-10 09:05:00',
    endTime: '',
    durationInMillis: 0,
    status: 1,
    reason: '',
    formId: 3,
    formName: '审批办理表单',
    formVariables: {},
  },
]

export function genBpmCategoryId() {
  return nextBpmCategoryId++
}

export function genBpmFormId() {
  const g = globalThis as any
  if (typeof g.__mockNextBpmFormId !== 'number')
    g.__mockNextBpmFormId = nextBpmFormId
  const id = g.__mockNextBpmFormId++
  nextBpmFormId = g.__mockNextBpmFormId
  return id
}

export function genBpmUserGroupId() {
  return nextBpmUserGroupId++
}

export function genBpmProcessListenerId() {
  return nextBpmProcessListenerId++
}

export function genBpmProcessExpressionId() {
  return nextBpmProcessExpressionId++
}

export function genBpmLeaveId() {
  return nextBpmLeaveId++
}

export function genBpmModelId() {
  return nextBpmModelId++
}

export function genBpmProcessDefinitionId(key: string, version: number) {
  return `pd-${key}:${version}:${nextBpmProcessDefinitionSeq++}`
}

export function genBpmProcessInstanceId() {
  return `pi-${nextBpmProcessInstanceId++}`
}

export function genBpmTaskId() {
  return `task-${nextBpmTaskId++}`
}

export function stampCreateTime(row: any): any {
  if (!row.createTime)
    row.createTime = now()
  return row
}

export function resolveDeptName(deptId?: number) {
  return depts.find(d => d.deptId === deptId)?.deptName
}

export function resolveRoleNames(roleIds?: number[]) {
  if (!roleIds?.length)
    return ''
  return roles.filter(r => roleIds.includes(r.roleId)).map(r => r.roleName).join(',')
}
