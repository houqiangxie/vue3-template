import type { Directive } from 'vue'

/** v-loading → 简易遮罩（Naive 无同名指令） */
export const loadingDirective: Directive<HTMLElement, boolean> = {
  mounted(el, binding) {
    el.style.position = el.style.position || 'relative'
    toggle(el, binding.value)
  },
  updated(el, binding) {
    toggle(el, binding.value)
  },
  unmounted(el) {
    el.querySelector('.bpm-v-loading')?.remove()
  },
}

function toggle(el: HTMLElement, on: boolean) {
  let mask = el.querySelector('.bpm-v-loading') as HTMLElement | null
  if (on) {
    if (!mask) {
      mask = document.createElement('div')
      mask.className = 'bpm-v-loading'
      mask.innerHTML = '<div class="bpm-v-loading__spinner"></div>'
      Object.assign(mask.style, {
        position: 'absolute',
        inset: '0',
        background: 'rgba(255,255,255,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '20',
      } as CSSStyleDeclaration)
      const spinner = mask.firstElementChild as HTMLElement
      Object.assign(spinner.style, {
        width: '28px',
        height: '28px',
        border: '3px solid #d1d5db',
        borderTopColor: '#2080f0',
        borderRadius: '50%',
        animation: 'bpm-spin 0.8s linear infinite',
      } as CSSStyleDeclaration)
      if (!document.getElementById('bpm-spin-style')) {
        const style = document.createElement('style')
        style.id = 'bpm-spin-style'
        style.textContent = '@keyframes bpm-spin{to{transform:rotate(360deg)}}'
        document.head.appendChild(style)
      }
      el.appendChild(mask)
    }
  }
  else {
    mask?.remove()
  }
}
