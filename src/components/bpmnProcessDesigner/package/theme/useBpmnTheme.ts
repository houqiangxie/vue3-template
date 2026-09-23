import { computed } from 'vue'
import { useThemeVars } from 'naive-ui'

/**
 * 将 Naive / web 主题 token 映射为 BPMN 设计器 CSS 变量，
 * 挂在设计器 / 属性面板 / 预览根节点上，使画布与侧栏跟随深浅色与主色。
 */
export function useBpmnTheme() {
  const themeVars = useThemeVars()

  const bpmnThemeStyle = computed(() => {
    const t = themeVars.value
    return {
      '--bpmn-bg': t.bodyColor || t.cardColor,
      '--bpmn-card': t.cardColor,
      '--bpmn-modal': t.modalColor || t.cardColor,
      '--bpmn-border': t.borderColor,
      '--bpmn-divider': t.dividerColor || t.borderColor,
      '--bpmn-text': t.textColor1,
      '--bpmn-text-2': t.textColor2,
      '--bpmn-text-3': t.textColor3,
      '--bpmn-primary': t.primaryColor,
      '--bpmn-primary-hover': t.primaryColorHover || t.primaryColor,
      '--bpmn-success': t.successColor,
      '--bpmn-warning': t.warningColor,
      '--bpmn-error': t.errorColor,
      '--bpmn-hover': t.hoverColor,
      '--bpmn-shadow': t.boxShadow2 || '0 0 8px rgba(0, 0, 0, 0.12)',
      '--palette-background-color': t.cardColor,
      '--palette-border-color': t.borderColor,
      color: t.textColor1,
      backgroundColor: t.cardColor,
    } as Record<string, string>
  })

  return { bpmnThemeStyle, themeVars }
}
