/** 对齐芋道 useDesign（BPM ContentWrap / Icon 等） */
export function useDesign(scope?: string) {
  const prefixCls = scope ? `v-${scope}` : 'v'
  return {
    prefixCls,
    prefixVar: 'v',
    getPrefixCls: (suffix?: string) => {
      if (!suffix)
        return prefixCls
      return `${prefixCls}-${suffix}`
    },
  }
}
