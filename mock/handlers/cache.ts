import type { CacheKV, CacheName } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok } from '../utils'

const cacheNames: CacheName[] = [
  { cacheName: 'login_tokens', remark: '用户登录 token' },
  { cacheName: 'sys_config', remark: '参数配置' },
  { cacheName: 'sys_dict', remark: '数据字典' },
  { cacheName: 'captcha_codes', remark: '验证码' },
  { cacheName: 'repeat_submit', remark: '防重复提交' },
]

const cacheStore = new Map<string, Map<string, string>>([
  ['login_tokens', new Map([
    ['admin:token-a1b2', JSON.stringify({ userId: 1, userName: 'admin', expire: 7200 })],
    ['zhangsan:token-c3d4', JSON.stringify({ userId: 2, userName: 'zhangsan', expire: 3600 })],
  ])],
  ['sys_config', new Map([
    ['sys.user.initPassword', '123456'],
    ['sys.account.captchaEnabled', 'true'],
  ])],
  ['sys_dict', new Map([
    ['sys_user_sex', JSON.stringify([{ label: '男', value: '0' }, { label: '女', value: '1' }])],
    ['sys_normal_disable', JSON.stringify([{ label: '正常', value: '1' }, { label: '停用', value: '0' }])],
  ])],
  ['captcha_codes', new Map([
    ['uuid-001', 'AB12'],
    ['uuid-002', 'XY89'],
  ])],
  ['repeat_submit', new Map([
    ['POST:/system/user', '1'],
  ])],
])

export const cacheRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/monitor/cache',
    handler: () => ok({
      info: {
        redis_version: '7.2.4',
        redis_mode: 'standalone',
        tcp_port: '6379',
        connected_clients: '12',
        uptime_in_days: '15',
        used_memory_human: '8.42M',
        used_memory_peak_human: '12.10M',
        maxmemory_human: '256.00M',
        aof_enabled: '0',
        rdb_last_bgsave_status: 'ok',
        instantaneous_ops_per_sec: '86',
        keyspace_hits: '10240',
        keyspace_misses: '312',
      },
      dbSize: [...cacheStore.values()].reduce((n, m) => n + m.size, 0),
      commandStats: [
        { name: 'get', value: '4200' },
        { name: 'set', value: '1800' },
        { name: 'del', value: '320' },
        { name: 'hget', value: '960' },
        { name: 'hset', value: '410' },
        { name: 'exists', value: '780' },
      ],
    }),
  },
  {
    method: 'GET',
    path: '/monitor/cache/getNames',
    handler: () => ok(cacheNames),
  },
  {
    method: 'GET',
    path: '/monitor/cache/getKeys/:cacheName',
    handler: (req) => {
      const map = cacheStore.get(req.params.cacheName)
      return ok(map ? [...map.keys()] : [])
    },
  },
  {
    method: 'GET',
    path: '/monitor/cache/getValue/:cacheName/:cacheKey',
    handler: (req) => {
      const { cacheName, cacheKey } = req.params
      const map = cacheStore.get(cacheName)
      if (!map || !map.has(cacheKey))
        return fail('缓存不存在')
      const data: CacheKV = {
        cacheName,
        cacheKey,
        cacheValue: map.get(cacheKey) || '',
      }
      return ok(data)
    },
  },
  {
    method: 'DELETE',
    path: '/monitor/cache/clearCacheName/:cacheName',
    handler: (req) => {
      const map = cacheStore.get(req.params.cacheName)
      if (map)
        map.clear()
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/monitor/cache/clearCacheKey/:cacheKey',
    handler: (req) => {
      const key = req.params.cacheKey
      for (const map of cacheStore.values()) {
        if (map.has(key)) {
          map.delete(key)
          break
        }
      }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/monitor/cache/clearCacheAll',
    handler: () => {
      for (const map of cacheStore.values())
        map.clear()
      return ok(null)
    },
  },
]
