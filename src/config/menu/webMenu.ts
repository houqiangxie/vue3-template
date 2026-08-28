/**
 * 静态侧栏兜底配置（开发参考）
 * 运行时侧栏由 permissionStore + menusToMenuOptions 根据后台菜单生成
 */
import type { MenuOption } from 'naive-ui';
import { AppstoreOutlined, HomeOutlined, MonitorOutlined, RobotOutlined, SettingOutlined, ToolOutlined, UserOutlined } from '@vicons/antd';
import { renderIcon } from './renderIcon';

export const webMenuOptions: MenuOption[] = [
  {
    label: '首页',
    key: 'Index',
    icon: renderIcon(HomeOutlined),
  },
  {
    label: '示例演示',
    key: 'Demo',
    icon: renderIcon(AppstoreOutlined),
    children: [
      { label: 'Modal 示例', key: 'Demo-ModalDemo' },
      { label: 'SqlSearch 示例', key: 'Demo-SqlSearchDemo' },
    ],
  },
  {
    label: '个人中心',
    key: 'Account',
    icon: renderIcon(UserOutlined),
    children: [
      { label: '个人信息', key: 'Account-PersonInfo' },
    ],
  },
  {
    label: 'AI 能力',
    key: 'Ai',
    icon: renderIcon(RobotOutlined),
    children: [
      { label: 'AI 助手', key: 'Ai-AiChat' },
    ],
  },
  {
    label: '系统管理',
    key: 'System',
    icon: renderIcon(SettingOutlined),
    children: [
      { label: '用户管理', key: 'System-User' },
      { label: '角色管理', key: 'System-Role' },
      { label: '菜单管理', key: 'System-Menu' },
      { label: '部门管理', key: 'System-Dept' },
      { label: '字典管理', key: 'System-Dict' },
      { label: '通知公告', key: 'System-Notice' },
      { label: '岗位管理', key: 'System-Post' },
      { label: '参数设置', key: 'System-Config' },
    ],
  },
  {
    label: '系统监控',
    key: 'Monitor',
    icon: renderIcon(MonitorOutlined),
    children: [
      { label: '在线用户', key: 'Monitor-Online' },
      { label: '定时任务', key: 'Monitor-Job' },
      { label: '操作日志', key: 'Monitor-OperLog' },
      { label: '登录日志', key: 'Monitor-LoginLog' },
      { label: '服务监控', key: 'Monitor-Server' },
      { label: '缓存管理', key: 'Monitor-Cache' },
    ],
  },
  {
    label: '系统工具',
    key: 'Tool',
    icon: renderIcon(ToolOutlined),
    children: [
      { label: '表单设计器', key: 'Tool-Build' },
      { label: '代码生成', key: 'Tool-Gen' },
    ],
  },
];
