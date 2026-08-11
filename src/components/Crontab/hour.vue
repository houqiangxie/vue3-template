<template>
  <n-radio-group v-model:value="radioValue" class="cron-radio-group">
    <div class="cron-option">
      <n-radio :value="1">小时，允许的通配符[, - * /]</n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="2">
        周期从
        <n-input-number v-model:value="cycle01" class="cron-input-number" size="small" :min="0" :max="22" />
        -
        <n-input-number v-model:value="cycle02" class="cron-input-number" size="small" :min="cycle01 + 1" :max="23" />
        时
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="3">
        从
        <n-input-number v-model:value="average01" class="cron-input-number" size="small" :min="0" :max="22" />
        时开始，每
        <n-input-number
          v-model:value="average02"
          class="cron-input-number"
          size="small"
          :min="1"
          :max="23 - average01"
        />
        小时执行一次
      </n-radio>
    </div>

    <div class="cron-option">
      <n-radio :value="4">
        指定
        <n-select
          v-model:value="checkboxList"
          class="cron-select"
          size="small"
          clearable
          multiple
          :max-tag-count="3"
          placeholder="可多选"
          :options="hourOptions"
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
const radioValue = ref(1)
const cycle01 = ref(0)
const cycle02 = ref(1)
const average01 = ref(0)
const average02 = ref(1)
const checkboxList = ref<number[]>([])
const checkCopy = ref([0])
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  label: String(i),
  value: i,
}))
const cycleTotal = computed(() => {
  cycle01.value = props.check(cycle01.value, 0, 22)
  cycle02.value = props.check(cycle02.value, cycle01.value + 1, 23)
  return cycle01.value + '-' + cycle02.value
})
const averageTotal = computed(() => {
  average01.value = props.check(average01.value, 0, 22)
  average02.value = props.check(average02.value, 1, 23 - average01.value)
  return average01.value + '/' + average02.value
})
const checkboxString = computed(() => {
  return checkboxList.value.join(',')
})
watch(
  () => props.cron.hour,
  value => changeRadioValue(value)
)
watch([radioValue, cycleTotal, averageTotal, checkboxString], () => onRadioChange())
function changeRadioValue(value: string) {
  if (value === '*') {
    radioValue.value = 1
  } else if (value.indexOf('-') > -1) {
    const indexArr = value.split('-')
    cycle01.value = Number(indexArr[0])
    cycle02.value = Number(indexArr[1])
    radioValue.value = 2
  } else if (value.indexOf('/') > -1) {
    const indexArr = value.split('/')
    average01.value = Number(indexArr[0])
    average02.value = Number(indexArr[1])
    radioValue.value = 3
  } else {
    checkboxList.value = [...new Set(value.split(',').map(item => Number(item)))]
    radioValue.value = 4
  }
}
function onRadioChange() {
  switch (radioValue.value) {
    case 1:
      emit('update', 'hour', '*', 'hour')
      break
    case 2:
      emit('update', 'hour', cycleTotal.value, 'hour')
      break
    case 3:
      emit('update', 'hour', averageTotal.value, 'hour')
      break
    case 4:
      if (checkboxList.value.length === 0) {
        checkboxList.value.push(checkCopy.value[0])
      } else {
        checkCopy.value = checkboxList.value
      }
      emit('update', 'hour', checkboxString.value, 'hour')
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
  width: 18.8rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}
</style>
