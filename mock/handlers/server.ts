import type { MockRoute } from '../utils'
import { ok } from '../utils'

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export const serverRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/monitor/server',
    handler: () => {
      const memTotal = 16
      const memUsed = rand(4, 12)
      const jvmMax = 4
      const jvmTotal = rand(1.2, 2.8)
      const jvmUsed = rand(0.6, jvmTotal)
      return ok({
        cpu: {
          cpuNum: 8,
          used: rand(8, 45),
          sys: rand(5, 25),
          free: rand(40, 80),
        },
        mem: {
          total: memTotal,
          used: memUsed,
          free: Math.round((memTotal - memUsed) * 100) / 100,
          usage: Math.round((memUsed / memTotal) * 10000) / 100,
        },
        jvm: {
          total: Math.round(jvmTotal * 100) / 100,
          max: jvmMax,
          free: Math.round((jvmTotal - jvmUsed) * 100) / 100,
          used: Math.round(jvmUsed * 100) / 100,
          usage: Math.round((jvmUsed / jvmMax) * 10000) / 100,
          version: '17.0.12',
          home: '/usr/lib/jvm/java-17',
          name: 'OpenJDK 64-Bit Server VM',
          startTime: '2026-08-26 08:00:00',
          runTime: '9小时15分钟',
        },
        sys: {
          computerName: 'vue3-template-dev',
          computerIp: '127.0.0.1',
          userDir: '/opt/vue3-template',
          osName: 'Linux',
          osArch: 'amd64',
        },
        sysFiles: [
          {
            dirName: '/',
            sysTypeName: 'ext4',
            typeName: '本地磁盘',
            total: '100 GB',
            free: '42.5 GB',
            used: '57.5 GB',
            usage: 57.5,
          },
          {
            dirName: '/data',
            sysTypeName: 'xfs',
            typeName: '本地磁盘',
            total: '200 GB',
            free: '128 GB',
            used: '72 GB',
            usage: 36,
          },
        ],
      })
    },
  },
]
