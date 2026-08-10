/**
 * 静态侧栏兜底配置（开发参考）
 * 运行时侧栏由 permissionStore + menusToMenuOptions 根据后台菜单生成
 */
import type { MenuOption } from 'naive-ui';
import { HomeOutlined, MonitorOutlined, SettingOutlined } from '@vicons/antd';
import { renderIcon } from './renderIcon';

export const webMenuOptions: MenuOption[] = [
  {
    label: '系统首页',
    key: 'Index',
    icon: renderIcon(HomeOutlined),
    children: [
      { label: '首页', key: 'Index-HomeIndex' },
      { label: 'Modal 示例', key: 'Index-ModalDemo' },
      { label: '个人信息', key: 'Index-PersonInfo' },
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
    ],
  },
];
