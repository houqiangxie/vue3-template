import fs from 'fs'
import { execSync } from 'child_process'

const files = execSync('rg -l "useMessage\\(" -g "*.{vue,ts}" src', { encoding: 'utf8' })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)

for (const f of files) {
  if (f.includes('hooks/web/useMessage')) continue
  const s = fs.readFileSync(f, 'utf8')
  const fromNaive = /import\s*\{[^}]*useMessage[^}]*\}\s*from\s*['"]naive-ui['"]/.test(s)
  const fromHooks = /from\s*['"]@\/hooks\/web\/useMessage['"]/.test(s)
  const usesConfirm = /message\.confirm\(|message\.delConfirm\(|message\.prompt\(/.test(s)
  let status = fromNaive ? 'naive' : fromHooks ? 'hooks' : 'auto'
  if (status !== 'naive' || usesConfirm) {
    console.log(`${status}${usesConfirm ? '+confirm' : ''}\t${f}`)
  }
}
