import { defineStore } from 'pinia';
import { RouteLocationNormalized } from 'vue-router';

// 不需要出现在标签页中的路由
const whiteList = ['Login', 'Redirect', 'ErrorPage'];

export type RouteItem = Partial<RouteLocationNormalized> & {
  fullPath: string;
  path: string;
  name: string;
  hash: string;
  meta: object;
  params: object;
  query: object;
};

export type ITabsViewState = {
  tabsList: RouteItem[];
};

function retainAffixRoute(list: any[]) {
  return list.filter((item) => item?.meta?.affix ?? false);
}

export const useTabsViewStore = defineStore('app-tabs-view', {
  state: (): ITabsViewState => ({
    tabsList: [],
  }),
  getters: {},
  actions: {
    initTabs(routes: RouteItem[]) {
      // 初始化时进行去重
      const uniqueTabs: RouteItem[] = [];
      const seen = new Set<string>();
      
      routes.forEach(route => {
        if (!route.name || whiteList.includes(route.name)) return;
        
        const isSingleton = ['控制台', '首页', '主页'].includes(route.meta?.title as string);
        const key = isSingleton ? `title:${route.meta?.title}` : `name:${route.name}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTabs.push(route);
        }
      });
      
      this.tabsList = uniqueTabs;
    },
    addTab(route: RouteItem): boolean {
      if (!route.name || whiteList.includes(route.name) || !route.meta?.title) return false;
      
      // 检查是否已存在（通过 name 或 fullPath 或 title）
      // 特殊处理：如果是“控制台”或“首页”，通过 title 去重
      const isSingleton = ['控制台', '首页', '主页'].includes(route.meta.title);
      
      const isExists = this.tabsList.some((item) => {
        if (isSingleton && item.meta?.title === route.meta.title) return true;
        // 额外检查 name，防止不同路径但同名的路由重复
        return item.name === route.name;
      });
      
      if (!isExists) {
        this.tabsList.push(route);
      } else {
        // 如果已存在但信息有变化（例如 fullPath 不同），更新现有标签
        const index = this.tabsList.findIndex((item) => {
          if (isSingleton && item.meta?.title === route.meta.title) return true;
          return item.name === route.name;
        });
        if (index !== -1) {
          // 保留原有的一些元数据，但更新路径等信息
          this.tabsList[index] = { ...this.tabsList[index], ...route };
        }
      }
      return true;
    },
    closeLeftTabs(route: RouteItem) {
      const index = this.tabsList.findIndex((item) => item.fullPath === route.fullPath);
      this.tabsList = this.tabsList.filter(
        (item, i) => i >= index || (item?.meta as any)?.affix,
      );
    },
    closeRightTabs(route: RouteItem) {
      const index = this.tabsList.findIndex((item) => item.fullPath === route.fullPath);
      this.tabsList = this.tabsList.filter(
        (item, i) => i <= index || (item?.meta as any)?.affix,
      );
    },
    closeOtherTabs(route: RouteItem) {
      this.tabsList = this.tabsList.filter(
        (item) => item.fullPath === route.fullPath || (item?.meta as any)?.affix,
      );
    },
    closeCurrentTab(route: RouteItem) {
      const index = this.tabsList.findIndex((item) => item.fullPath === route.fullPath);
      if (index !== -1) this.tabsList.splice(index, 1);
    },
    closeAllTabs() {
      this.tabsList = retainAffixRoute(this.tabsList);
    },
  },
});
