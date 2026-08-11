<template>
  <n-radio-group v-model:value="radioValue" class="cron-radio-group">
    <div class="cron-option">
      <n-radio :value="1">不填，允许的通配符[, - * /]</n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="2">每年</n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="3">
        周期从
        <n-input-number
          v-model:value="cycle01"
          class="cron-input-number"
          size="small"
          :min="fullYear"
          :max="maxFullYear - 1"
        />
        -
        <n-input-number
          v-model:value="cycle02"
          class="cron-input-number"
          size="small"
          :min="cycle01 + 1"
          :max="maxFullYear"
        />
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="4">
        从
        <n-input-number
          v-model:value="average01"
          class="cron-input-number"
          size="small"
          :min="fullYear"
          :max="maxFullYear - 1"
        />
        年开始，每
        <n-input-number v-model:value="average02" class="cron-input-number" size="small" :min="1" :max="10" />
        年执行一次
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="5">
        指定
        <n-select
          v-model:value="checkboxList"
          class="cron-select"
          size="small"
          clearable
          multiple
          :max-tag-count="3"
          placeholder="可多选"
          :options="yearOptions"
        />
      </n-radio>
    </div>
  </n-radio-group>
</template>

<!-- eslint-disable vue/no-side-effects-in-computed-properties -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
const fullYear = ref(0)
const maxFullYear = ref(1)
const radioValue = ref(1)
const cycle01 = ref(0)
const cycle02 = ref(0)
const average01 = ref(0)
const average02 = ref(1)
const checkboxList = ref<number[]>([])
const checkCopy = ref<number[]>([])
const yearOptions = computed(() =>
  Array.from({ length: 9 }, (_, i) => {
    const year = i + fullYear.value
    return {
      label: String(year),
      value: year,
    }
  })
)
const cycleTotal = computed(() => {
  cycle01.value = props.check(cycle01.value, fullYear.value, maxFullYear.value - 1)
  cycle02.value = props.check(cycle02.value, cycle01.value + 1, maxFullYear.value)
  return cycle01.value + '-' + cycle02.value
})
const averageTotal = computed(() => {
  average01.value = props.check(average01.value, fullYear.value, maxFullYear.value - 1)
  average02.value = props.check(average02.value, 1, 10)
  return average01.value + '/' + average02.value
})
const checkboxString = computed(() => {
  return checkboxList.value.join(',')
})
watch(
  () => props.cron.year,
  value => changeRadioValue(value)
)
watch([radioValue, cycleTotal, averageTotal, checkboxString], () => onRadioChange())
function changeRadioValue(value: string) {
  if (value === '') {
    radioValue.value = 1
  } else if (value === '*') {
    radioValue.value = 2
  } else if (value.indexOf('-') > -1) {
    const indexArr = value.split('-')
    cycle01.value = Number(indexArr[0])
    cycle02.value = Number(indexArr[1])
    radioValue.value = 3
  } else if (value.indexOf('/') > -1) {
    const indexArr = value.split('/')
    average01.value = Number(indexArr[0])
    average02.value = Number(indexArr[1])
    radioValue.value = 4
  } else {
    checkboxList.value = [...new Set(value.split(',').map(item => Number(item)))]
    radioValue.value = 5
  }
}
function onRadioChange() {
  switch (radioValue.value) {
    case 1:
      emit('update', 'year', '', 'year')
      break
    case 2:
      emit('update', 'year', '*', 'year')
      break
    case 3:
      emit('update', 'year', cycleTotal.value, 'year')
      break
    case 4:
      emit('update', 'year', averageTotal.value, 'year')
      break
    case 5:
      if (checkboxList.value.length === 0) {
        checkboxList.value.push(checkCopy.value[0])
      } else {
        checkCopy.value = checkboxList.value
      }
      emit('update', 'year', checkboxString.value, 'year')
      break
  }
}
onMounted(() => {
  fullYear.value = Number(new Date().getFullYear())
  maxFullYear.value = fullYear.value + 10
  cycle01.value = fullYear.value
  cycle02.value = cycle01.value + 1
  average01.value = fullYear.value
  checkCopy.value = [fullYear.value]
})
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
  width: 120px;
  margin: 0 0.2rem;
  vertical-align: middle;
}
.cron-select {
  display: inline-flex;
  width: 18.8rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}
</style>
