<template>
  <div class="ux-filter-record">
    <div class="filter">
      <!-- 查询条件 -->
      <slot name="filter" :filter="searchFilter"></slot>
      <!-- 内置按钮 -->
      <el-button class="search" type="primary" @click="onSearch" v-if="showSearch">查询</el-button>
      <el-button class="reset" @click="onReset" v-if="showReset">重置</el-button>
      <!-- 更多按钮 -->
      <slot name="more" :filter="searchFilter"></slot>
    </div>
    <div class="list">
      <h3 class="title">数据列表</h3>
      <UxTable ref="uxTable" :data="tableConfig.tb" v-loading="tableConfig.loading">
        <UxTableColumn v-for="(col, i) in tableConfig.th" :key="i" :config="col">
          <template v-for="slotName in Object.keys($slots)" #[slotName]="scope">
            <slot :name="slotName" :row="scope.row" v-if="slotName !== 'filter'"></slot>
          </template>
        </UxTableColumn>
      </UxTable>
      <slot name="list-ctrl"></slot>
    </div>
    <div class="pages">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        v-model:currentPage="page.current"
        v-model:page-size="page.size"
        :page-sizes="[10, 30, 50, 100]"
        :total="page.total"
        @current-change="onCurrentPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 记录分页查询组件
 * @version 0.0.2
 * @description 支持自定义筛选条件、自定义表格列插槽。
 */

import { ref, reactive, watch, nextTick } from "vue";
import UxTable from "@/components/ux/table/UxTable.vue";
import UxTableColumn from "@/components/ux/table/UxTableColumn.vue";

interface IProps {
  /**
   * 过滤条件
   */
  filter?: { [propName: string]: any };
  /**
   * 是否显示分页器。默认为true
   */
  showPages?: boolean;
  /**
   * 是否显示分页器总条数。默认为true
   */
  showPagesTotal?: boolean;
  /**
   * 是否显示查询按钮。默认为true
   */
  showSearch?: boolean;
  /**
   * 是否显示重置按钮。默认为true
   */
  showReset?: boolean;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  filter: () => ({}),
  showPages: true,
  showPagesTotal: true,
  showSearch: true,
  showReset: true,
});

/**
 * @events
 */
const emit = defineEmits(["records-search", "records-update"]);

const uxTable = ref(null);
const searchFilter = ref<{ [propName: string]: any }>({});
const page = reactive({ total: 0, current: 1, size: 10 });
const tableConfig = reactive({ th: [], tb: [], loading: false });

watch(
  () => props.filter,
  (next) => {
    searchFilter.value = next;
  },
  { deep: true, immediate: true },
);

/**
 * @public
 */
defineExpose({
  getFilter,
  getPage,
  setData,
});

function getFilter() {
  return searchFilter.value;
}

function setFilter(filter = {}) {
  searchFilter.value = { ...filter };
}

function getPage() {
  return page;
}

function setPage(total = 0, current = 1, size = 10) {
  page.total = total;
  page.current = current;
  page.size = size;
}

function onSearch() {
  tableConfig.tb = [];
  getData();
}

function onReset() {
  tableConfig.tb = [];
  setFilter({});
  setPage(0, 1, getPage().size);
  getData();
}

function onCurrentPageChange(currentPage: number) {
  page.current = currentPage;
  getData();
}

function onSizeChange(size: number) {
  page.size = size;
  getData();
}

function getData() {
  emit("records-search", { ...searchFilter.value }, { ...page });
}

async function setData(promise: Promise<Array<any>>, loading = true) {
  tableConfig.loading = loading;
  promise
    .then(([table, page]) => {
      // 设置列表数据
      tableConfig.th = table.th;
      tableConfig.tb = table.tb;

      // ? 带有type属性并且为selection时的默认勾选处理
      nextTick(() => {
        table.th.forEach((col: Ux.TableColumnConfig) => {
          if (col.type === "selection") {
            table.tb.forEach((row: any) => {
              if (col.prop && row[col.prop]) {
                (uxTable.value as any)?.getTableMethods().toggleRowSelection(row);
              }
            });
          }
        });
      });

      setPage(page.total, page.current, page.size);
      emit("records-update", page);
    })
    .finally(() => {
      tableConfig.loading = false;
    });
}
</script>

<style lang="scss" scoped>
.ux-filter-record {
  & > .filter {
    padding: 20px;
    padding-bottom: 15px;
    min-height: 76px;
    background-color: #fff;
    &::after {
      display: block;
      content: "";
      clear: both;
    }
  }
  & > .list {
    position: relative;
    margin: 15px 0;
    padding: 20px;
    padding-top: 76px;
    box-sizing: border-box;
    background-color: #fff;
    & > .title {
      position: absolute;
      top: 10px;
      left: 20px;
      display: flex;
      align-items: center;
      height: 56px;
      font-size: 20px;
      font-family: Microsoft YaHei;
      font-weight: bold;
      text-indent: 10px;
      color: #454b5b;
      &::before {
        position: absolute;
        content: "";
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        background: #325bde;
      }
    }
  }
  & > .pages {
    padding: 50px 0;
    display: flex;
    justify-content: flex-end;
    background-color: #fff;
  }
}
</style>
