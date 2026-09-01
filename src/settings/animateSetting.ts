export const animates = [
  { value: 'zoom-fade', label: '渐变', i18nKey: 'layout.animateZoomFade' },
  { value: 'zoom-out', label: '闪现', i18nKey: 'layout.animateZoomOut' },
  { value: 'fade-slide', label: '滑动', i18nKey: 'layout.animateFadeSlide' },
  { value: 'fade', label: '消退', i18nKey: 'layout.animateFade' },
  { value: 'fade-bottom', label: '底部消退', i18nKey: 'layout.animateFadeBottom' },
  { value: 'fade-scale', label: '缩放消退', i18nKey: 'layout.animateFadeScale' },
] as const;

export type PageAnimateType = (typeof animates)[number]['value'];

export const animateValues: PageAnimateType[] = animates.map(item => item.value);
