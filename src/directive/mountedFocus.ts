import type { Directive } from 'vue'
import { nextTick } from 'vue'

/** 挂载后自动聚焦（BPM 节点标题编辑用） */
export const mountedFocusDirective: Directive<HTMLElement> = {
  mounted(el) {
    nextTick(() => {
      el.focus?.()
    })
  },
}
