<template>
  <div>
    <n-tabs type="card" animated>
      <n-tab-pane v-if="shouldHide('second')" name="second" tab="秒">
        <CrontabSecond
          ref="cronsecond"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('min')" name="min" tab="分钟">
        <CrontabMin
          ref="cronmin"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('hour')" name="hour" tab="小时">
        <CrontabHour
          ref="cronhour"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('day')" name="day" tab="日">
        <CrontabDay
          ref="cronday"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('month')" name="month" tab="月">
        <CrontabMonth
          ref="cronmonth"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('week')" name="week" tab="周">
        <CrontabWeek
          ref="cronweek"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>

      <n-tab-pane v-if="shouldHide('year')" name="year" tab="年">
        <CrontabYear
          ref="cronyear"
          :check="checkNumber"
          :cron="crontabValueObj"
          @update="updateCrontabValue"
        />
      </n-tab-pane>
    </n-tabs>

    <div class="popup-main">
      <div class="popup-result">
        <p class="title">时间表达式</p>
        <table>
          <thead>
            <tr>
              <th v-for="item of tabTitles" :key="item">{{ item }}</th>
              <th>Cron 表达式</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span v-if="crontabValueObj.second.length < 10">{{ crontabValueObj.second }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.second }}</span>
                  </template>
                  {{ crontabValueObj.second }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.min.length < 10">{{ crontabValueObj.min }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.min }}</span>
                  </template>
                  {{ crontabValueObj.min }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.hour.length < 10">{{ crontabValueObj.hour }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.hour }}</span>
                  </template>
                  {{ crontabValueObj.hour }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.day.length < 10">{{ crontabValueObj.day }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.day }}</span>
                  </template>
                  {{ crontabValueObj.day }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.month.length < 10">{{ crontabValueObj.month }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.month }}</span>
                  </template>
                  {{ crontabValueObj.month }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.week.length < 10">{{ crontabValueObj.week }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.week }}</span>
                  </template>
                  {{ crontabValueObj.week }}
                </n-tooltip>
              </td>
              <td>
                <span v-if="crontabValueObj.year.length < 10">{{ crontabValueObj.year }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueObj.year }}</span>
                  </template>
                  {{ crontabValueObj.year }}
                </n-tooltip>
              </td>
              <td class="result">
                <span v-if="crontabValueString.length < 90">{{ crontabValueString }}</span>
                <n-tooltip v-else placement="top">
                  <template #trigger>
                    <span>{{ crontabValueString }}</span>
                  </template>
                  {{ crontabValueString }}
                </n-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CrontabResult :ex="crontabValueString" />

      <div class="pop_btn">
        <n-space justify="center">
          <n-button type="primary" @click="submitFill">确定</n-button>
          <n-button type="warning" @click="clearCron">重置</n-button>
          <n-button @click="hidePopup">取消</n-button>
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NSpace, NTabPane, NTabs, NTooltip } from 'naive-ui'
import CrontabSecond from './second.vue'
import CrontabMin from './min.vue'
import CrontabHour from './hour.vue'
import CrontabDay from './day.vue'
import CrontabMonth from './month.vue'
import CrontabWeek from './week.vue'
import CrontabYear from './year.vue'
import CrontabResult from './result.vue'

const emit = defineEmits(['hide', 'fill'])
const props = defineProps({
  hideComponent: {
    type: Array as () => string[],
    default: () => [],
  },
  expression: {
    type: String,
    default: '',
  },
})
const tabTitles = ref(['秒', '分钟', '小时', '日', '月', '周', '年'])
const hideComponent = ref<string[]>([])
const expression = ref('')
const crontabValueObj = ref<Record<string, string>>({
  second: '*',
  min: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
  year: '',
})
const crontabValueString = computed(() => {
  const obj = crontabValueObj.value
  return (
    obj.second +
    ' ' +
    obj.min +
    ' ' +
    obj.hour +
    ' ' +
    obj.day +
    ' ' +
    obj.month +
    ' ' +
    obj.week +
    (obj.year === '' ? '' : ' ' + obj.year)
  )
})
watch(expression, () => resolveExp())
function shouldHide(key: string) {
  return !(hideComponent.value && hideComponent.value.includes(key))
}
function resolveExp() {
  // 反解析 表达式
  if (expression.value) {
    const arr = expression.value.split(/\s+/)
    if (arr.length >= 6) {
      //6 位以上是合法表达式
      const obj: Record<string, any> = {
        second: arr[0],
        min: arr[1],
        hour: arr[2],
        day: arr[3],
        month: arr[4],
        week: arr[5],
        year: arr[6] ? arr[6] : '',
      }
      crontabValueObj.value = {
        ...obj,
      }
    }
  } else {
    // 没有传入的表达式 则还原
    clearCron()
  }
}
// 由子组件触发，更改表达式组成的字段值
function updateCrontabValue(name: any, value: any, _from: any) {
  crontabValueObj.value[name] = value
}
// 表单选项的子组件校验数字格式（通过-props传递）
function checkNumber(value: any, minLimit: any, maxLimit: any) {
  // 检查必须为整数
  value = Math.floor(value)
  if (value < minLimit) {
    value = minLimit
  } else if (value > maxLimit) {
    value = maxLimit
  }
  return value
}
// 隐藏弹窗
function hidePopup() {
  emit('hide')
}
// 填充表达式
function submitFill() {
  emit('fill', crontabValueString.value)
  hidePopup()
}
function clearCron() {
  // 还原选择项
  crontabValueObj.value = {
    second: '*',
    min: '*',
    hour: '*',
    day: '*',
    month: '*',
    week: '?',
    year: '',
  }
}
onMounted(() => {
  expression.value = props.expression
  hideComponent.value = props.hideComponent
})
</script>

<style scoped>
.pop_btn {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 12px;
}
.popup-main {
  position: relative;
  margin: 10px auto;
  background: #fff;
  border-radius: 5px;
  font-size: 12px;
  overflow: hidden;
}
.popup-title {
  overflow: hidden;
  line-height: 34px;
  padding-top: 6px;
  background: #f2f2f2;
}
.popup-result {
  box-sizing: border-box;
  line-height: 24px;
  margin: 25px auto;
  padding: 15px 10px 10px;
  border: 1px solid #ccc;
  position: relative;
}
.popup-result .title {
  position: absolute;
  top: -28px;
  left: 50%;
  width: 140px;
  font-size: 14px;
  margin-left: -70px;
  text-align: center;
  line-height: 30px;
  background: #fff;
}
.popup-result table {
  text-align: center;
  width: 100%;
  margin: 0 auto;
  border-collapse: collapse;
}
.popup-result table td:not(.result) {
  width: 3.5rem;
  min-width: 3.5rem;
  max-width: 3.5rem;
}
.popup-result table span {
  display: block;
  width: 100%;
  font-family: arial;
  line-height: 30px;
  height: 30px;
  white-space: nowrap;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.popup-result-scroll {
  font-size: 12px;
  line-height: 24px;
  height: 10em;
  overflow-y: auto;
}
</style>
