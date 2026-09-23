import { createRouter, createWebHistory } from 'vue-router'
import { setupBpmPermission } from './bpmPermission'

const routerBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/bpm/`

const router = createRouter({
  history: createWebHistory(routerBase),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/bpm/BpmLayout.vue'),
      children: [
        {
          path: '',
          name: 'BpmHome',
          component: () => import('@/views/bpm/Home.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'model',
          name: 'BpmModel',
          component: () => import('@/views/bpm/model/ModelList.vue'),
          meta: { title: '流程模型' },
        },
        {
          path: 'model/:type/:id?',
          name: 'BpmModelEditor',
          component: () => import('@/views/bpm/model/index.vue'),
          meta: {
            title: '编辑流程模型',
            hideMenu: true,
            activeMenu: 'BpmModel',
          },
        },
        {
          path: 'category',
          name: 'BpmCategory',
          component: () => import('@/views/web/Bpm/Category.vue'),
          meta: { title: '流程分类' },
        },
        {
          path: 'form',
          name: 'BpmForm',
          component: () => import('@/views/web/Bpm/Form.vue'),
          meta: { title: '流程表单' },
        },
        {
          path: 'form/design/:id',
          name: 'BpmFormDesign',
          component: () => import('@/views/web/Tool/Build.vue'),
          meta: {
            title: '设计流程表单',
            hideMenu: true,
            activeMenu: 'BpmForm',
          },
        },
        {
          path: 'user-group',
          name: 'BpmUserGroup',
          component: () => import('@/views/web/Bpm/UserGroup.vue'),
          meta: { title: '用户分组' },
        },
        {
          path: 'process-listener',
          name: 'BpmProcessListener',
          component: () => import('@/views/web/Bpm/ProcessListener.vue'),
          meta: { title: '流程监听器' },
        },
        {
          path: 'process-expression',
          name: 'BpmProcessExpression',
          component: () => import('@/views/web/Bpm/ProcessExpression.vue'),
          meta: { title: '流程表达式' },
        },
        {
          path: 'process-instance',
          name: 'BpmProcessInstance',
          component: () => import('@/views/web/Bpm/ProcessInstance.vue'),
          meta: { title: '流程实例' },
        },
        {
          path: 'process-instance/create',
          name: 'BpmProcessInstanceCreate',
          component: () => import('@/views/web/Bpm/processInstance/create/index.vue'),
          meta: { title: '发起流程' },
        },
        {
          path: 'process-instance/report',
          name: 'BpmProcessInstanceReport',
          component: () => import('@/views/web/Bpm/processInstance/report/index.vue'),
          meta: {
            title: '流程报表',
            hideMenu: true,
            activeMenu: 'BpmModel',
          },
        },
        {
          path: 'process-instance/detail',
          name: 'BpmProcessInstanceDetail',
          component: () => import('@/views/web/Bpm/processInstance/detail/index.vue'),
          meta: {
            title: '流程详情',
            hideMenu: true,
            activeMenu: 'BpmProcessInstance',
          },
        },
        {
          path: 'task',
          name: 'BpmTask',
          component: () => import('@/views/web/Bpm/Task.vue'),
          meta: { title: '流程任务' },
        },
        {
          path: 'task/copy',
          name: 'BpmTaskCopy',
          component: () => import('@/views/web/Bpm/task/copy/index.vue'),
          meta: { title: '抄送我的' },
        },
        {
          path: 'leave',
          name: 'BpmLeave',
          component: () => import('@/views/web/Bpm/Leave.vue'),
          meta: { title: '请假申请' },
        },
        {
          path: 'oa/leave/create',
          name: 'BpmLeaveCreate',
          component: () => import('@/views/web/Bpm/oa/leave/create.vue'),
          meta: {
            title: '发起请假',
            hideMenu: true,
            activeMenu: 'BpmLeave',
          },
        },
        {
          path: 'oa/leave/detail',
          name: 'BpmLeaveDetail',
          component: () => import('@/views/web/Bpm/oa/leave/detail.vue'),
          meta: {
            title: '请假详情',
            hideMenu: true,
            activeMenu: 'BpmLeave',
          },
        },
        {
          path: 'simple',
          name: 'BpmSimpleDesign',
          component: () => import('@/views/bpm/SimpleDesign.vue'),
          meta: { title: '简易流程设计器' },
        },
        {
          path: 'bpmn',
          name: 'BpmnDesign',
          component: () => import('@/views/bpm/BpmnDesign.vue'),
          meta: { title: 'BPMN 设计器' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

setupBpmPermission(router)

router.afterEach((to) => {
  const title = (to.meta?.title as string) || 'BPM'
  document.title = `${title} · 流程设计`
})

export default router
