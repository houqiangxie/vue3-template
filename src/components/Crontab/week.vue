<template>
  <n-radio-group v-model:value="radioValue" class="cron-radio-group">
    <div class="cron-option">
      <n-radio :value="1">周，允许的通配符[, - * ? / L #]</n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="2">不指定</n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="3">
        周期从
        <n-select
          v-model:value="cycle01"
          class="cron-select"
          size="small"
          clearable
          :options="cycle01Options"
        />
        -
        <n-select
          v-model:value="cycle02"
          class="cron-select"
          size="small"
          clearable
          :options="cycle02Options"
        />
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="4">
        第
        <n-input-number v-model:value="average01" class="cron-input-number" size="small" :min="1" :max="4" />
        周的
        <n-select
          v-model:value="average02"
          class="cron-select"
          size="small"
          clearable
          :options="weekOptions"
        />
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="5">
        本月最后一个
        <n-select
          v-model:value="weekday"
          class="cron-select"
          size="small"
          clearable
          :options="weekOptions"
        />
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="6">
        指定
        <n-select
          v-model:value="checkboxList"
          class="cron-select cron-select--multi"
          size="small"
          clearable
          multiple
          :max-tag-count="3"
          placeholder="可多选"
          :options="weekOptions"
        />
      </n-radio>
    </div>
  </n-radio-group>
</template>
<!-- eslint-disable vue/no-side-effects-in-computed-properties -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NInputNumber, NRadio, NRadioGroup, NSelect } from 'naive-ui'

const emit = defineEmits(['update'])
const props = defineProps({
  cron: {
    type: Object,
    default: () => ({
      second: '*',
      min: '*',
      hour: '*',
      day: '*',
      month: '*',
      week: '?',
      year: '',
    }),
  },
  check: {
    type: Function,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    default: () => {},
  },
})
const radioValue = ref(2)
const cycle01 = ref(2)
const cycle02 = ref(3)
const average01 = ref(1)
const average02 = ref(2)
const weekday = ref(2)
const checkboxList = ref<number[]>([])
const checkCopy = ref([2])
const weekList = ref([
  { key: 1, value: '星期日' },
  { key: 2, value: '星期一' },
  { key: 3, value: '星期二' },
  { key: 4, value: '星期三' },
  { key: 5, value: '星期四' },
  { key: 6, value: '星期五' },
  { key: 7, value: '星期六' },
])
const weekOptions = computed(() =>
  weekList.value.map(item => ({
    label: item.value,
    value: item.key,
  }))
)
const cycle01Options = computed(() =>
  weekList.value.map(item => ({
    label: item.value,
    value: item.key,
    disabled: item.key === 7,
  }))
)
const cycle02Options = computed(() =>
  weekList.value.map(item => ({
    label: item.value,
    value: item.key,
    disabled: item.key <= cycle01.value,
  }))
)
const cycleTotal = computed(() => {
  cycle01.value = props.check(cycle01.value, 1, 6)
  cycle02.value = props.check(cycle02.value, cycle01.value + 1, 7)
  return cycle01.value + '-' + cycle02.value
})
const averageTotal = computed(() => {
  average01.value = props.check(average01.value, 1, 4)
  average02.value = props.check(average02.value, 1, 7)
  return average02.value + '#' + average01.value
})
const weekdayTotal = computed(() => {
  weekday.value = props.check(weekday.value, 1, 7)
  return weekday.value + 'L'
})
const checkboxString = computed(() => {
  return checkboxList.value.join(',')
})
watch(
  () => props.cron.week,
  value => changeRadioValue(value)
)
watch([radioValue, cycleTotal, averageTotal, weekdayTotal, checkboxString], () => onRadioChange())
function changeRadioValue(value: string) {
  if (value === '*') {
    radioValue.value = 1
  } else if (value === '?') {
    radioValue.value = 2
  } else if (value.indexOf('-') > -1) {
    const indexArr = value.split('-')
    cycle01.value = Number(indexArr[0])
    cycle02.value = Number(indexArr[1])
    radioValue.value = 3
  } else if (value.indexOf('#') > -1) {
    const indexArr = value.split('#')
    average01.value = Number(indexArr[1])
    average02.value = Number(indexArr[0])
    radioValue.value = 4
  } else if (value.indexOf('L') > -1) {
    const indexArr = value.split('L')
    weekday.value = Number(indexArr[0])
    radioValue.value = 5
  } else {
    checkboxList.value = [...new Set(value.split(',').map(item => Number(item)))]
    radioValue.value = 6
  }
}
function onRadioChange() {
  if (radioValue.value === 2 && props.cron.day === '?') {
    emit('update', 'day', '*', 'week')
  }
  if (radioValue.value !== 2 && props.cron.day !== '?') {
    emit('update', 'day', '?', 'week')
  }
  switch (radioValue.value) {
    case 1:
      emit('update', 'week', '*', 'week')
      break
    case 2:
      emit('update', 'week', '?', 'week')
      break
    case 3:
      emit('update', 'week', cycleTotal.value, 'week')
      break
    case 4:
      emit('update', 'week', averageTotal.value, 'week')
      break
    case 5:
      emit('update', 'week', weekdayTotal.value, 'week')
      break
    case 6:
      if (checkboxList.value.length === 0) {
        checkboxList.value.push(checkCopy.value[0])
      } else {
        checkCopy.value = checkboxList.value
      }
      emit('update', 'week', checkboxString.value, 'week')
      break
  }
}
</script>

<style scoped>
.cron-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.cron-option {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.cron-input-number {
  display: inline-flex;
  width: 110px;
  margin: 0 0.2rem;
  vertical-align: middle;
}
.cron-select {
  display: inline-flex;
  width: 8rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}
.cron-select--multi {
  width: 17.8rem;
}
</style>
