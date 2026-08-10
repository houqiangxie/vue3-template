import type { MenuOption } from 'naive-ui';
import { HomeOutlined } from '@vicons/antd';
import { renderIcon } from './renderIcon';

export const appMenuOptions: MenuOption[] = [
  {
    label: '系统首页',
    key: 'Index',
    icon: renderIcon(HomeOutlined),
    children: [
      { label: '首页', key: 'Index-HomeIndex' },
      { label: '个人信息', key: 'Index-PersonInfo' },
    ],
  },
];
