export const template = (isTaskListener) => {
  return `
  <div class="panel-tab__content">
    <el-table :data="elementListenersList" size="small" border>
      <el-table-column label="序号" width="50px" type="index" />
      <el-table-column label="事件类型" min-width="100px" prop="event" />
      <el-table-column label="监听器类型" min-width="100px" show-overflow-tooltip :formatter="row => listenerTypeObject[row.listenerType]" />
      <el-table-column label="操作" width="90px">
        <template #default="scope">
          <n-button size="small" type="primary" :text="true" @click="openListenerForm(scope, scope.$index)">编辑</n-button>
          <n-divider direction="vertical" />
          <n-button size="small" type="primary" :text="true" style="color: #ff4d4f" @click="removeListener(scope, scope.$index)">移除</n-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button">
      <n-button size="small" type="primary" icon="el-icon-plus" @click="openListenerForm(null)">添加监听器</n-button>
    </div>

    <!-- 监听器 编辑/创建 部分 -->
    <n-drawer :visible.sync="listenerFormModelVisible"  :width="width + 'px'" destroy-on-close>
    <n-drawer-content title="执行监听器" :closable="true" native-scrollbar>
      <n-form size="small" :model="listenerForm" label-width="96px" ref="listenerFormRef" @submit.native.prevent>
        <n-form-item label="事件类型" path="event" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <n-select v-model:value="listenerForm.event" :options="[{ label: 'start', value: 'start' }, { label: 'end', value: 'end' }]" />
        </n-form-item>
        <n-form-item label="监听器类型" path="listenerType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <n-select v-model:value="listenerForm.listenerType" :options="[{ label: 'listenerTypeObject[i]', value: 'i' }]" />
        </n-form-item>
        <n-form-item
          v-if="listenerForm.listenerType === 'classListener'"
          label="Java类"
          path="class"
          key="listener-class"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <n-input v-model:value="listenerForm.class" clearable />
        </n-form-item>
        <n-form-item
          v-if="listenerForm.listenerType === 'expressionListener'"
          label="表达式"
          path="expression"
          key="listener-expression"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <n-input v-model:value="listenerForm.expression" clearable />
        </n-form-item>
        <n-form-item
          v-if="listenerForm.listenerType === 'delegateExpressionListener'"
          label="代理表达式"
          path="delegateExpression"
          key="listener-delegate"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <n-input v-model:value="listenerForm.delegateExpression" clearable />
        </n-form-item>
        <template v-if="listenerForm.listenerType === 'scriptListener'">
          <n-form-item
            label="脚本格式"
            path="scriptFormat"
            key="listener-script-format"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写脚本格式' }"
          >
            <n-input v-model:value="listenerForm.scriptFormat" clearable />
          </n-form-item>
          <n-form-item
            label="脚本类型"
            path="scriptType"
            key="listener-script-type"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请选择脚本类型' }"
          >
            <n-select v-model:value="listenerForm.scriptType" :options="[{ label: '内联脚本', value: 'inlineScript' }, { label: '外部脚本', value: 'externalScript' }]" />
          </n-form-item>
          <n-form-item
            v-if="listenerForm.scriptType === 'inlineScript'"
            label="脚本内容"
            path="value"
            key="listener-script"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写脚本内容' }"
          >
            <n-input v-model:value="listenerForm.value" clearable />
          </n-form-item>
          <n-form-item
            v-if="listenerForm.scriptType === 'externalScript'"
            label="资源地址"
            path="resource"
            key="listener-resource"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写资源地址' }"
          >
            <n-input v-model:value="listenerForm.resource" clearable />
          </n-form-item>
        </template>
        ${
          isTaskListener
            ? "<n-form-item label='定时器类型' path='eventDefinitionType' key='eventDefinitionType'>" +
              "<el-select v-model='listenerForm.eventDefinitionType'>" +
              "<el-option label='日期' value='date' />" +
              "<el-option label='持续时长' value='duration' />" +
              "<el-option label='循环' value='cycle' />" +
              "<el-option label='无' value='' />" +
              '</el-select>' +
              '</n-form-item>' +
              "<n-form-item v-if='!!listenerForm.eventDefinitionType' label='定时器' path='eventDefinitions' key='eventDefinitions'>" +
              "<n-input v-model:value='listenerForm.eventDefinitions' clearable />" +
              '</n-form-item>'
            : ''
        }
      </n-form>
      <n-divider />
      <p class="listener-filed__title">
        <span><i class="el-icon-menu"></i>注入字段：</span>
        <n-button size="small" type="primary" @click="openListenerFieldForm(null)">添加字段</n-button>
      </p>
      <el-table :data="fieldsListOfListener" size="small" max-height="240" border fit style="flex: none">
        <el-table-column label="序号" width="50px" type="index" />
        <el-table-column label="字段名称" min-width="100px" prop="name" />
        <el-table-column label="字段类型" min-width="80px" show-overflow-tooltip :formatter="row => fieldTypeObject[row.fieldType]" />
        <el-table-column label="字段值/表达式" min-width="100px" show-overflow-tooltip :formatter="row => row.string || row.expression" />
        <el-table-column label="操作" width="100px">
          <template #default="scope">
            <n-button size="small" type="primary" :text="true" @click="openListenerFieldForm(scope, scope.$index)">编辑</n-button>
            <n-divider direction="vertical" />
            <n-button size="small" type="primary" :text="true" style="color: #ff4d4f" @click="removeListenerField(scope, scope.$index)">移除</n-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="element-drawer__button">
        <n-button size="small" @click="listenerFormModelVisible = false">取 消</n-button>
        <n-button size="small" type="primary" @click="saveListenerConfig">保 存</n-button>
      </div>
    
    </n-drawer-content>
  </n-drawer>

    <!-- 注入西段 编辑/创建 部分 -->
    <n-modal preset="card" :bordered="false" :style="{ width: '600px' }" title="字段配置" :visible.sync="listenerFieldFormModelVisible">
      <n-form :model="listenerFieldForm" size="small" label-width="96px" ref="listenerFieldFormRef" style="height: 136px" @submit.native.prevent>
        <n-form-item label="字段名称：" path="name" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <n-input v-model:value="listenerFieldForm.name" clearable />
        </n-form-item>
        <n-form-item label="字段类型：" path="fieldType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <n-select v-model:value="listenerFieldForm.fieldType" :options="[{ label: 'fieldTypeObject[i]', value: 'i' }]" />
        </n-form-item>
        <n-form-item
          v-if="listenerFieldForm.fieldType === 'string'"
          label="字段值："
          path="string"
          key="field-string"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <n-input v-model:value="listenerFieldForm.string" clearable />
        </n-form-item>
        <n-form-item
          v-if="listenerFieldForm.fieldType === 'expression'"
          label="表达式："
          path="expression"
          key="field-expression"
          :rules="{ required: true, trigger: ['blur', 'change'] }"
        >
          <n-input v-model:value="listenerFieldForm.expression" clearable />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button size="small" @click="listenerFieldFormModelVisible = false">取 消</n-button>
        <n-button size="small" type="primary" @click="saveListenerFiled">确 定</n-button>
      </template>
    </n-modal>
  </div>
  `
}
