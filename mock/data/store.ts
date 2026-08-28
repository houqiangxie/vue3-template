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

export function stampCreateTime<T extends { createTime?: string }>(row: T): T {
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
