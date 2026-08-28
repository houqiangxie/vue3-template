import type { GenTable, GenTableColumn } from '../../src/api/system/types'
import type { MockRawPayload, MockRoute } from '../utils'
import { fail, now, ok, pageOk } from '../utils'
import { createZip } from '../zip'

let nextTableId = 3
let nextColumnId = 20

const genTables: GenTable[] = [
  {
    tableId: 1,
    tableName: 'sys_notice',
    tableComment: '通知公告表',
    className: 'SysNotice',
    tplCategory: 'crud',
    packageName: 'com.vue3.system',
    moduleName: 'system',
    businessName: 'notice',
    functionName: '通知公告',
    functionAuthor: 'admin',
    genType: '0',
    genPath: '/',
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-02-01 12:00:00',
  },
  {
    tableId: 2,
    tableName: 'sys_post',
    tableComment: '岗位信息表',
    className: 'SysPost',
    tplCategory: 'crud',
    packageName: 'com.vue3.system',
    moduleName: 'system',
    businessName: 'post',
    functionName: '岗位管理',
    functionAuthor: 'admin',
    genType: '0',
    genPath: '/',
    createTime: '2024-01-12 11:00:00',
    updateTime: '2024-02-02 09:30:00',
  },
]

const dbTables: GenTable[] = [
  { tableId: 0, tableName: 'sys_user', tableComment: '用户信息表', createTime: '2024-01-01 00:00:00' },
  { tableId: 0, tableName: 'sys_role', tableComment: '角色信息表', createTime: '2024-01-01 00:00:00' },
  { tableId: 0, tableName: 'sys_dept', tableComment: '部门表', createTime: '2024-01-01 00:00:00' },
  { tableId: 0, tableName: 'sys_config', tableComment: '参数配置表', createTime: '2024-01-01 00:00:00' },
  { tableId: 0, tableName: 'sys_notice', tableComment: '通知公告表', createTime: '2024-01-01 00:00:00' },
  { tableId: 0, tableName: 'sys_post', tableComment: '岗位信息表', createTime: '2024-01-01 00:00:00' },
]

const columnsByTable = new Map<number, GenTableColumn[]>([
  [1, [
    { columnId: 1, tableId: 1, columnName: 'notice_id', columnComment: '公告ID', columnType: 'bigint', javaType: 'Long', javaField: 'noticeId', isPk: '1', isIncrement: '1', isRequired: '0', isInsert: '0', isEdit: '0', isList: '1', isQuery: '0', queryType: 'EQ', htmlType: 'input', sort: 1 },
    { columnId: 2, tableId: 1, columnName: 'notice_title', columnComment: '公告标题', columnType: 'varchar(50)', javaType: 'String', javaField: 'noticeTitle', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'LIKE', htmlType: 'input', sort: 2 },
    { columnId: 3, tableId: 1, columnName: 'notice_type', columnComment: '公告类型', columnType: 'char(1)', javaType: 'String', javaField: 'noticeType', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'EQ', htmlType: 'select', dictType: 'sys_notice_type', sort: 3 },
    { columnId: 4, tableId: 1, columnName: 'notice_content', columnComment: '公告内容', columnType: 'longblob', javaType: 'String', javaField: 'noticeContent', isPk: '0', isRequired: '0', isInsert: '1', isEdit: '1', isList: '0', isQuery: '0', queryType: 'EQ', htmlType: 'editor', sort: 4 },
    { columnId: 5, tableId: 1, columnName: 'status', columnComment: '状态', columnType: 'char(1)', javaType: 'String', javaField: 'status', isPk: '0', isRequired: '0', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'EQ', htmlType: 'radio', dictType: 'sys_notice_status', sort: 5 },
  ]],
  [2, [
    { columnId: 10, tableId: 2, columnName: 'post_id', columnComment: '岗位ID', columnType: 'bigint', javaType: 'Long', javaField: 'postId', isPk: '1', isIncrement: '1', isRequired: '0', isInsert: '0', isEdit: '0', isList: '1', isQuery: '0', queryType: 'EQ', htmlType: 'input', sort: 1 },
    { columnId: 11, tableId: 2, columnName: 'post_code', columnComment: '岗位编码', columnType: 'varchar(64)', javaType: 'String', javaField: 'postCode', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'EQ', htmlType: 'input', sort: 2 },
    { columnId: 12, tableId: 2, columnName: 'post_name', columnComment: '岗位名称', columnType: 'varchar(50)', javaType: 'String', javaField: 'postName', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'LIKE', htmlType: 'input', sort: 3 },
    { columnId: 13, tableId: 2, columnName: 'post_sort', columnComment: '显示顺序', columnType: 'int', javaType: 'Integer', javaField: 'postSort', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '0', queryType: 'EQ', htmlType: 'input', sort: 4 },
    { columnId: 14, tableId: 2, columnName: 'status', columnComment: '状态', columnType: 'char(1)', javaType: 'String', javaField: 'status', isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'EQ', htmlType: 'radio', dictType: 'sys_normal_disable', sort: 5 },
  ]],
])

function defaultColumns(tableId: number, tableName: string): GenTableColumn[] {
  const prefix = tableName.replace(/^sys_/, '')
  return [
    { columnId: nextColumnId++, tableId, columnName: `${prefix}_id`, columnComment: '主键', columnType: 'bigint', javaType: 'Long', javaField: `${toCamel(prefix)}Id`, isPk: '1', isIncrement: '1', isRequired: '0', isInsert: '0', isEdit: '0', isList: '1', isQuery: '0', queryType: 'EQ', htmlType: 'input', sort: 1 },
    { columnId: nextColumnId++, tableId, columnName: `${prefix}_name`, columnComment: '名称', columnType: 'varchar(50)', javaType: 'String', javaField: `${toCamel(prefix)}Name`, isPk: '0', isRequired: '1', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'LIKE', htmlType: 'input', sort: 2 },
    { columnId: nextColumnId++, tableId, columnName: 'status', columnComment: '状态', columnType: 'char(1)', javaType: 'String', javaField: 'status', isPk: '0', isRequired: '0', isInsert: '1', isEdit: '1', isList: '1', isQuery: '1', queryType: 'EQ', htmlType: 'radio', sort: 3 },
    { columnId: nextColumnId++, tableId, columnName: 'create_time', columnComment: '创建时间', columnType: 'datetime', javaType: 'Date', javaField: 'createTime', isPk: '0', isRequired: '0', isInsert: '0', isEdit: '0', isList: '1', isQuery: '0', queryType: 'EQ', htmlType: 'datetime', sort: 4 },
  ]
}

function toCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toPascal(s: string) {
  const c = toCamel(s)
  return c.charAt(0).toUpperCase() + c.slice(1)
}

/** htmlType → 前端组件名 */
function resolveHtmlComponent(htmlType?: string): string {
  if (htmlType === 'select' || htmlType === 'radio' || htmlType === 'checkbox')
    return 'NSelect'
  if (htmlType === 'datetime')
    return 'NDatePicker'
  if (htmlType === 'editor')
    return 'Editor'
  return 'NInput'
}

function packagePath(packageName?: string) {
  return (packageName || 'com.vue3.system').replace(/\./g, '/')
}

function getPkColumn(cols: GenTableColumn[]) {
  return cols.find(c => c.isPk === '1') || cols[0]
}

function buildXmlQueryCondition(col: GenTableColumn) {
  const field = col.javaField || col.columnName
  const test = `${field} != null and ${field} != ''`
  switch (col.queryType) {
    case 'LIKE':
      return `            <if test="${test}">\n                and ${col.columnName} like concat('%', #{${field}}, '%')\n            </if>`
    case 'NE':
      return `            <if test="${test}">\n                and ${col.columnName} != #{${field}}\n            </if>`
    case 'GT':
      return `            <if test="${field} != null">\n                and ${col.columnName} &gt; #{${field}}\n            </if>`
    case 'GE':
      return `            <if test="${field} != null">\n                and ${col.columnName} &gt;= #{${field}}\n            </if>`
    case 'LT':
      return `            <if test="${field} != null">\n                and ${col.columnName} &lt; #{${field}}\n            </if>`
    case 'LE':
      return `            <if test="${field} != null">\n                and ${col.columnName} &lt;= #{${field}}\n            </if>`
    default:
      return `            <if test="${test}">\n                and ${col.columnName} = #{${field}}\n            </if>`
  }
}

function buildPreview(table: GenTable) {
  const cols = columnsByTable.get(table.tableId) || []
  const className = table.className || 'Entity'
  const moduleName = table.moduleName || 'system'
  const businessName = table.businessName || 'demo'
  const functionName = table.functionName || businessName
  const packageName = table.packageName || 'com.vue3.system'
  const author = table.functionAuthor || 'admin'
  const pk = getPkColumn(cols)
  const pkField = pk?.javaField || 'id'
  const pkType = pk?.javaType || 'Long'
  const pkColumn = pk?.columnName || 'id'
  const permPrefix = `${moduleName}:${businessName}`
  const pkgPath = packagePath(packageName)
  const queryCols = cols.filter(c => c.isQuery === '1')
  const insertCols = cols.filter(c => c.isInsert === '1')
  const serviceVar = `${toCamel(className)}Service`

  const api = `import type { PageQuery, PageResult } from '@/api/system/types'
import { del, get, post, put } from '@/utils/fetch'

export function list${className}(query: PageQuery = {}) {
  return get<PageResult<Record<string, unknown>>>('/${moduleName}/${businessName}/list', query)
}

export function get${className}(${pkField}: number) {
  return get(\`/${moduleName}/${businessName}/\${${pkField}}\`)
}

export function add${className}(data: Record<string, unknown>) {
  return post('/${moduleName}/${businessName}', data)
}

export function update${className}(data: Record<string, unknown>) {
  return put('/${moduleName}/${businessName}', data)
}

export function delete${className}(${pkField}s: number[]) {
  return del(\`/${moduleName}/${businessName}/\${${pkField}s.join(',')}\`)
}
`

  const fields = cols
    .filter(c => c.isPk !== '1' && (c.isList === '1' || c.isQuery === '1' || c.isInsert === '1' || c.isEdit === '1'))
    .map((c) => {
      const lines: string[] = [
        `    key: '${c.javaField}',`,
        `    label: '${c.columnComment || c.columnName}',`,
        `    component: '${resolveHtmlComponent(c.htmlType)}',`,
      ]
      if (c.htmlType === 'textarea')
        lines.push(`    bind: { type: 'textarea', rows: 3 },`)
      if (c.htmlType === 'editor')
        lines.push(`    bind: { height: 280, placeholder: '请输入${c.columnComment || c.columnName}' },`)
      if (c.htmlType === 'datetime')
        lines.push(`    bind: { type: 'datetime', clearable: true },`)
      if (c.dictType)
        lines.push(`    // dictType: '${c.dictType}' — 接入字典后替换 options`)
      if (c.htmlType === 'select' || c.htmlType === 'radio')
        lines.push(`    options: [],`)

      if (c.isQuery === '1')
        lines.push(`    search: { enabled: true${c.htmlType === 'select' || c.htmlType === 'radio' ? ', defaultValue: null' : ''} },`)
      else
        lines.push(`    search: false,`)

      if (c.isInsert === '1' || c.isEdit === '1') {
        const formParts = [`required: ${c.isRequired === '1'}`]
        if (c.htmlType === 'editor' || c.htmlType === 'textarea')
          formParts.push('span: 2')
        lines.push(`    form: { ${formParts.join(', ')} },`)
      }
      else {
        lines.push(`    form: false,`)
      }

      if (c.isList === '1') {
        const tableParts = [`width: ${c.htmlType === 'datetime' ? 170 : 120}`]
        if (c.htmlType === 'select' || c.htmlType === 'radio')
          tableParts.push(`format: 'option'`)
        lines.push(`    table: { ${tableParts.join(', ')} },`)
      }
      else {
        lines.push(`    table: false,`)
      }

      return `  {\n${lines.join('\n')}\n  }`
    })
    .join(',\n')

  const pageName = `${toPascal(moduleName)}-${toPascal(businessName)}`
  const labelField = cols.find(c => c.isList === '1' && c.isPk !== '1' && c.javaType === 'String')?.javaField
    || cols.find(c => c.isList === '1' && c.isPk !== '1')?.javaField
    || pkField

  const vue = `<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="fields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('${permPrefix}:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('${permPrefix}:remove')"
          type="error"
          secondary
          :disabled="!checkedIds.length"
          @click="handleBatchDelete"
        >
          删除
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      selectable
      col-setting-key="${moduleName}-${businessName}"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.${pkField} as number"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    />
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import {
  add${className},
  delete${className},
  list${className},
  update${className},
} from '@/api/${moduleName}/${businessName}'
import { usePermission } from '@/hooks/usePermission'

defineOptions({ name: '${pageName}' })

const { hasPermission } = usePermission()
const { confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const fields = defineFields([
${fields}
])

const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
  handleSearch,
  onPageChange,
  onPageSizeChange,
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async query => toPageResult(await list${className}(query)),
  defaults: extractSearchDefaults(fields),
  formDefaults: () => extractFormDefaults(fields),
})

const tableFields = computed(() => [
  ...fields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 140,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: '${permPrefix}:edit',
          onClick: (r) => openEdit(r as Record<string, unknown>),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: '${permPrefix}:remove',
          popconfirm: (r) => \`是否确认删除「\${(r as Record<string, unknown>).${labelField}}」？\`,
          onClick: async (r) => {
            await removeAndRefresh(() => delete${className}([(r as Record<string, unknown>).${pkField} as number]))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改${functionName}' : '新增${functionName}',
  width: 720,
  sections: [{
    type: 'form',
    key: 'main',
    fields,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate()
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '${functionName}',
    action: () => delete${className}(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(add${className}, update${className})
}
</script>
`

  // parent_id=1 表示挂在「系统管理」下，真实环境可按需调整
  const menuSql = `-- ${functionName}菜单
-- 一级菜单（parent_id 按实际父菜单调整，1 一般为系统管理）
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('${functionName}', '1', '1', '${businessName}', '${moduleName}/${toPascal(businessName)}', 1, 0, 'C', '0', '0', '${permPrefix}:list', 'DocumentTextOutline', 'admin', sysdate(), '', null, '${functionName}菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', '${permPrefix}:query', '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', '${permPrefix}:add', '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', '${permPrefix}:edit', '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', '${permPrefix}:remove', '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', '${permPrefix}:export', '#', 'admin', sysdate(), '', null, '');
`

  const domain = `package ${packageName}.domain;

import com.ruoyi.common.core.domain.BaseEntity;

/**
 * ${functionName}对象 ${table.tableName}
 *
 * @author ${author}
 */
public class ${className} extends BaseEntity {
    private static final long serialVersionUID = 1L;

${cols.map(c => `    /** ${c.columnComment || c.columnName} */
    private ${c.javaType} ${c.javaField};`).join('\n\n')}
}
`

  const mapper = `package ${packageName}.mapper;

import java.util.List;
import ${packageName}.domain.${className};

/**
 * ${functionName}Mapper接口
 *
 * @author ${author}
 */
public interface ${className}Mapper {
    /**
     * 查询${functionName}
     */
    ${className} select${className}By${toPascal(pkField)}(${pkType} ${pkField});

    /**
     * 查询${functionName}列表
     */
    List<${className}> select${className}List(${className} ${toCamel(className)});

    /**
     * 新增${functionName}
     */
    int insert${className}(${className} ${toCamel(className)});

    /**
     * 修改${functionName}
     */
    int update${className}(${className} ${toCamel(className)});

    /**
     * 删除${functionName}
     */
    int delete${className}By${toPascal(pkField)}(${pkType} ${pkField});

    /**
     * 批量删除${functionName}
     */
    int delete${className}By${toPascal(pkField)}s(${pkType}[] ${pkField}s);
}
`

  const mapperXml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="${packageName}.mapper.${className}Mapper">

    <resultMap type="${className}" id="${className}Result">
${cols.map(c => `        <result property="${c.javaField}" column="${c.columnName}"/>`).join('\n')}
    </resultMap>

    <sql id="select${className}Vo">
        select ${cols.map(c => c.columnName).join(', ')}
        from ${table.tableName}
    </sql>

    <select id="select${className}List" parameterType="${className}" resultMap="${className}Result">
        <include refid="select${className}Vo"/>
        <where>
${queryCols.length ? queryCols.map(buildXmlQueryCondition).join('\n') : '            1 = 1'}
        </where>
    </select>

    <select id="select${className}By${toPascal(pkField)}" parameterType="${pkType}" resultMap="${className}Result">
        <include refid="select${className}Vo"/>
        where ${pkColumn} = #{${pkField}}
    </select>

    <insert id="insert${className}" parameterType="${className}"${pk?.isIncrement === '1' ? ' useGeneratedKeys="true" keyProperty="' + pkField + '"' : ''}>
        insert into ${table.tableName}
        <trim prefix="(" suffix=")" suffixOverrides=",">
${insertCols.map(c => `            <if test="${c.javaField} != null">${c.columnName},</if>`).join('\n')}
        </trim>
        <trim prefix="values (" suffix=")" suffixOverrides=",">
${insertCols.map(c => `            <if test="${c.javaField} != null">#{${c.javaField}},</if>`).join('\n')}
        </trim>
    </insert>

    <update id="update${className}" parameterType="${className}">
        update ${table.tableName}
        <trim prefix="SET" suffixOverrides=",">
${cols.filter(c => c.isEdit === '1').map(c => `            <if test="${c.javaField} != null">${c.columnName} = #{${c.javaField}},</if>`).join('\n')}
        </trim>
        where ${pkColumn} = #{${pkField}}
    </update>

    <delete id="delete${className}By${toPascal(pkField)}" parameterType="${pkType}">
        delete from ${table.tableName} where ${pkColumn} = #{${pkField}}
    </delete>

    <delete id="delete${className}By${toPascal(pkField)}s" parameterType="${pkType}">
        delete from ${table.tableName} where ${pkColumn} in
        <foreach item="${pkField}" collection="array" open="(" separator="," close=")">
            #{${pkField}}
        </foreach>
    </delete>
</mapper>
`

  const service = `package ${packageName}.service;

import java.util.List;
import ${packageName}.domain.${className};

/**
 * ${functionName}Service接口
 *
 * @author ${author}
 */
public interface I${className}Service {
    ${className} select${className}By${toPascal(pkField)}(${pkType} ${pkField});

    List<${className}> select${className}List(${className} ${toCamel(className)});

    int insert${className}(${className} ${toCamel(className)});

    int update${className}(${className} ${toCamel(className)});

    int delete${className}By${toPascal(pkField)}s(${pkType}[] ${pkField}s);
}
`

  const serviceImpl = `package ${packageName}.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ${packageName}.domain.${className};
import ${packageName}.mapper.${className}Mapper;
import ${packageName}.service.I${className}Service;

/**
 * ${functionName}Service业务层处理
 *
 * @author ${author}
 */
@Service
public class ${className}ServiceImpl implements I${className}Service {
    @Autowired
    private ${className}Mapper ${toCamel(className)}Mapper;

    @Override
    public ${className} select${className}By${toPascal(pkField)}(${pkType} ${pkField}) {
        return ${toCamel(className)}Mapper.select${className}By${toPascal(pkField)}(${pkField});
    }

    @Override
    public List<${className}> select${className}List(${className} ${toCamel(className)}) {
        return ${toCamel(className)}Mapper.select${className}List(${toCamel(className)});
    }

    @Override
    public int insert${className}(${className} ${toCamel(className)}) {
        return ${toCamel(className)}Mapper.insert${className}(${toCamel(className)});
    }

    @Override
    public int update${className}(${className} ${toCamel(className)}) {
        return ${toCamel(className)}Mapper.update${className}(${toCamel(className)});
    }

    @Override
    public int delete${className}By${toPascal(pkField)}s(${pkType}[] ${pkField}s) {
        return ${toCamel(className)}Mapper.delete${className}By${toPascal(pkField)}s(${pkField}s);
    }
}
`

  const controller = `package ${packageName}.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import ${packageName}.domain.${className};
import ${packageName}.service.I${className}Service;

/**
 * ${functionName}Controller
 *
 * @author ${author}
 */
@RestController
@RequestMapping("/${moduleName}/${businessName}")
public class ${className}Controller extends BaseController {
    @Autowired
    private I${className}Service ${serviceVar};

    /**
     * 查询${functionName}列表
     */
    @PreAuthorize("@ss.hasPermi('${permPrefix}:list')")
    @GetMapping("/list")
    public TableDataInfo list(${className} ${toCamel(className)}) {
        startPage();
        List<${className}> list = ${serviceVar}.select${className}List(${toCamel(className)});
        return getDataTable(list);
    }

    /**
     * 获取${functionName}详细信息
     */
    @PreAuthorize("@ss.hasPermi('${permPrefix}:query')")
    @GetMapping("/{${pkField}}")
    public AjaxResult getInfo(@PathVariable("${pkField}") ${pkType} ${pkField}) {
        return success(${serviceVar}.select${className}By${toPascal(pkField)}(${pkField}));
    }

    /**
     * 新增${functionName}
     */
    @PreAuthorize("@ss.hasPermi('${permPrefix}:add')")
    @PostMapping
    public AjaxResult add(@RequestBody ${className} ${toCamel(className)}) {
        return toAjax(${serviceVar}.insert${className}(${toCamel(className)}));
    }

    /**
     * 修改${functionName}
     */
    @PreAuthorize("@ss.hasPermi('${permPrefix}:edit')")
    @PutMapping
    public AjaxResult edit(@RequestBody ${className} ${toCamel(className)}) {
        return toAjax(${serviceVar}.update${className}(${toCamel(className)}));
    }

    /**
     * 删除${functionName}
     */
    @PreAuthorize("@ss.hasPermi('${permPrefix}:remove')")
    @DeleteMapping("/{${pkField}s}")
    public AjaxResult remove(@PathVariable ${pkType}[] ${pkField}s) {
        return toAjax(${serviceVar}.delete${className}By${toPascal(pkField)}s(${pkField}s));
    }
}
`

  return {
    [`main/java/${pkgPath}/domain/${className}.java`]: domain,
    [`main/java/${pkgPath}/mapper/${className}Mapper.java`]: mapper,
    [`main/resources/mapper/${moduleName}/${className}Mapper.xml`]: mapperXml,
    [`main/java/${pkgPath}/service/I${className}Service.java`]: service,
    [`main/java/${pkgPath}/service/impl/${className}ServiceImpl.java`]: serviceImpl,
    [`main/java/${pkgPath}/controller/${className}Controller.java`]: controller,
    [`vue/api/${moduleName}/${businessName}.ts`]: api,
    [`vue/views/${moduleName}/${toPascal(businessName)}.vue`]: vue,
    [`sql/${businessName}_menu.sql`]: menuSql,
  }
}

function buildZipPayload(tables: GenTable[], filename: string): MockRawPayload {
  const files: Array<{ name: string, content: string }> = []
  for (const table of tables) {
    const preview = buildPreview(table)
    for (const [name, content] of Object.entries(preview))
      files.push({ name, content })
  }
  const body = createZip(files)
  return {
    __raw: true,
    body,
    contentType: 'application/zip',
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(body.length),
    },
  }
}

export const genRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/tool/gen/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...genTables]
      const tableName = req.query.tableName?.trim()
      const tableComment = req.query.tableComment?.trim()
      if (tableName)
        list = list.filter(t => t.tableName.includes(tableName))
      if (tableComment)
        list = list.filter(t => (t.tableComment || '').includes(tableComment))
      list.sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/db/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = dbTables.filter(t => !genTables.some(g => g.tableName === t.tableName))
      const tableName = req.query.tableName?.trim()
      const tableComment = req.query.tableComment?.trim()
      if (tableName)
        list = list.filter(t => t.tableName.includes(tableName))
      if (tableComment)
        list = list.filter(t => (t.tableComment || '').includes(tableComment))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/batchGenCode',
    handler: (req) => {
      const names = String(req.query.tables || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (!names.length)
        return fail('请选择要生成的表')
      const tables = names
        .map(name => genTables.find(t => t.tableName === name))
        .filter((t): t is GenTable => !!t)
      if (!tables.length)
        return fail('表不存在')
      return buildZipPayload(tables, 'ruoyi.zip')
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/:tableId',
    handler: (req) => {
      const tableId = Number(req.params.tableId)
      const info = genTables.find(t => t.tableId === tableId)
      if (!info)
        return fail('表不存在')
      return ok({
        info,
        rows: columnsByTable.get(tableId) || [],
        tables: genTables,
      })
    },
  },
  {
    method: 'PUT',
    path: '/tool/gen',
    handler: (req) => {
      const info = req.body?.info as GenTable | undefined
      const rows = req.body?.rows as GenTableColumn[] | undefined
      if (!info?.tableId)
        return fail('参数错误')
      const idx = genTables.findIndex(t => t.tableId === info.tableId)
      if (idx < 0)
        return fail('表不存在')
      genTables[idx] = { ...genTables[idx], ...info, updateTime: now() }
      if (Array.isArray(rows))
        columnsByTable.set(info.tableId, rows)
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/tool/gen/:tableIds',
    handler: (req) => {
      const ids = req.params.tableIds.split(',').map(Number)
      for (const id of ids) {
        const idx = genTables.findIndex(t => t.tableId === id)
        if (idx >= 0)
          genTables.splice(idx, 1)
        columnsByTable.delete(id)
      }
      return ok(null)
    },
  },
  {
    method: 'POST',
    path: '/tool/gen/importTable',
    handler: (req) => {
      const tables = String(req.body?.tables || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (!tables.length)
        return fail('请选择要导入的表')
      for (const name of tables) {
        if (genTables.some(t => t.tableName === name))
          continue
        const db = dbTables.find(t => t.tableName === name)
        const business = name.replace(/^sys_/, '')
        const tableId = nextTableId++
        const row: GenTable = {
          tableId,
          tableName: name,
          tableComment: db?.tableComment || name,
          className: toPascal(name),
          tplCategory: 'crud',
          packageName: 'com.vue3.system',
          moduleName: 'system',
          businessName: business,
          functionName: db?.tableComment || business,
          functionAuthor: 'admin',
          genType: '0',
          genPath: '/',
          createTime: now(),
          updateTime: now(),
        }
        genTables.push(row)
        columnsByTable.set(tableId, defaultColumns(tableId, name))
      }
      return ok(null)
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/preview/:tableId',
    handler: (req) => {
      const tableId = Number(req.params.tableId)
      const info = genTables.find(t => t.tableId === tableId)
      if (!info)
        return fail('表不存在')
      return ok(buildPreview(info))
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/synchDb/:tableName',
    handler: (req) => {
      const table = genTables.find(t => t.tableName === req.params.tableName)
      if (!table)
        return fail('表不存在')
      table.updateTime = now()
      return ok(null, '同步成功')
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/genCode/:tableName',
    handler: (req) => {
      const table = genTables.find(t => t.tableName === req.params.tableName)
      if (!table)
        return fail('表不存在')
      // genType=1 自定义路径：真实后端写盘；Mock 仅标记成功
      return ok(null, '生成成功')
    },
  },
  {
    method: 'GET',
    path: '/tool/gen/download/:tableName',
    handler: (req) => {
      const table = genTables.find(t => t.tableName === req.params.tableName)
      if (!table)
        return fail('表不存在')
      return buildZipPayload([table], `${table.tableName}.zip`)
    },
  },
]
