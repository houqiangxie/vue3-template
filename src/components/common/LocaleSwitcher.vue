<script setup lang="ts">
import { computed } from 'vue'
import { LanguageOutline } from '@vicons/ionicons5'
import { I18N_ENABLED } from '@/i18n/config'
import type { AppLocale } from '@/i18n/types'
import { useLocaleSwitch } from '@/hooks/useLocaleSwitch'

const props = withDefaults(defineProps<{
  /** icon：顶栏图标下拉；compact：文字缩写；select：下拉选择器 */
  mode?: 'icon' | 'compact' | 'select'
  size?: 'small' | 'medium' | 'large'
}>(), {
  mode: 'icon',
  size: 'medium',
})

const {
  localeOptions,
  currentLocale,
  currentShortLabel,
  setLocale,
  t,
} = useLocaleSwitch()

const dropdownOptions = computed(() =>
  localeOptions.value.map(opt => ({
    label: opt.label,
    key: opt.value,
    disabled: currentLocale.value === opt.value,
  })),
)

function onDropdownSelect(key: string | number) {
  setLocale(String(key) as AppLocale)
}
</script>

<template>
  <template v-if="I18N_ENABLED">
    <n-dropdown
      v-if="mode === 'icon' || mode === 'compact'"
      trigger="click"
      placement="bottom-end"
      :options="dropdownOptions"
      @select="onDropdownSelect"
    >
      <div
        class="locale-switcher"
        :class="[`locale-switcher--${mode}`, `locale-switcher--${size}`]"
        role="button"
        tabindex="0"
        :aria-label="t('layout.switchLocale', '切换语言')"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <span class="locale-switcher__trigger">
              <n-icon :size="mode === 'compact' ? 16 : 18">
                <LanguageOutline />
              </n-icon>
              <span v-if="mode === 'compact'" class="locale-switcher__text">
                {{ currentShortLabel }}
              </span>
            </span>
          </template>
          <span>{{ t('layout.switchLocale', '切换语言') }}</span>
        </n-tooltip>
      </div>
    </n-dropdown>

    <n-select
      v-else
      class="locale-switcher__select"
      :value="currentLocale"
      :options="localeOptions"
      :size="size"
      :consistent-menu-width="false"
      :aria-label="t('layout.switchLocale', '切换语言')"
      @update:value="setLocale"
    />
  </template>
</template>

<style scoped lang="scss">
.locale-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__text {
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
  }

  &--icon {
    min-width: 40px;
  }

  &--compact {
    padding: 0 4px;
  }

  &__select {
    width: 120px;
  }
}
</style>
