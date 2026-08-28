# FormBuilder（表单设计器）

设计器入口页面：`src/views/web/Tool/Build.vue`。本目录负责字段草稿、属性面板、编译预览与导出；**真正渲染控件**由 `CommonForm` / `SearchPanel` 完成。

## 目录说明

| 文件 | 作用 |
|------|------|
| `constants.ts` | 左侧组件面板（`paletteGroups`）、组件下拉（`componentOptions`）、常用选项常量 |
| `types.ts` | 设计器字段类型（`BuilderField`、草稿结构等） |
| `utils.ts` | 是否需要 options / 多选等辅助判断 |
| `FieldPropsPanel.vue` | 右侧属性面板（公共控件、场景、联动等） |
| `ComponentBindExtras.vue` | 各组件专属 bind 可视化配置 |
| `bindManagedKeys.ts` | 已可视化管理的 bind 键；避免与「扩展 JSON」重复 |
| `compile.ts` | 设计器字段 → 运行时字段（表达式编译等） |
| `serialize.ts` | 导入 / 导出 schema |
| `exportCrud.ts` | 导出 CRUD 页面代码 |
| `useFormBuilderPersistence.ts` | 草稿自动保存、撤销重做 |

相关运行时（不在本目录，但接入组件必改）：

- `../table/fieldSchema.ts` — 字段类型、`NaiveComponentName`、默认值
- `../CommonForm.vue` — 表单渲染组件映射
- `../SearchPanel.vue` — 搜索栏组件映射

---

## 接入新组件

按「设计器注册 → 运行时渲染 → 可选属性面板」三层改。只改 `constants` 不够，预览会回退为 `NInput` 或空白。

### 必改

#### 1. `src/components/common/table/fieldSchema.ts`

- 在 `NaiveComponentName` 联合类型中增加组件名
- 默认值为数组时：加入 `ARRAY_VALUE_COMPONENTS`
- 有特殊默认值时：在 `resolveComponentDefaultValue` 中处理（参考 `SqlSearch`）

#### 2. `constants.ts`

- `paletteGroups`：左侧可拖拽项，可用 `defaults` 预设 `form` / `search` / `bind` / `options`
- `componentOptions`：属性面板「组件」下拉选项

```ts
// paletteGroups 示例
{ label: '部门选择', component: 'DeptSelect', defaults: { bind: { clearable: true } } }
```

#### 3. 运行时组件映射

| 场景 | 文件 | 改什么 |
|------|------|--------|
| 表单 / 设计器预览 | `CommonForm.vue` | Naive UI → `NAIVE_COMPONENTS`；业务组件 → `CUSTOM_COMPONENTS`（常用 `defineAsyncComponent`） |
| 搜索栏 | `SearchPanel.vue` | `SEARCH_COMPONENTS`（搜索侧组件较少，需显式注册） |

按需同步：

- `COMPONENTS_WITH_CLEARABLE`：是否默认注入 `clearable`
- `inferFieldType` / 特殊 props（如 `DeptSelect` 的 `mode: 'select'`）

### 按需改（属性面板体验）

| 文件 | 何时改 |
|------|--------|
| `utils.ts` | `needsOptions` / `needsTreeOptions` / `supportsMultiple` |
| `ComponentBindExtras.vue` | 为该组件增加可视化 bind 表单项 |
| `bindManagedKeys.ts` → `COMPONENT_MANAGED_BIND_KEYS` | 声明已管理的 bind 键，避免与扩展 JSON 重复展示 |
| `FieldPropsPanel.vue` | 仅当公共区有组件特例（如 `NInput` 多行、`NRadioGroup` 按钮模式） |

未做可视化时，仍可通过属性面板「扩展 JSON」写任意 bind。

### 一般不用改

- `Build.vue`：只消费 palette，不硬编码组件列表
- `compile.ts` / `serialize.ts` / `exportCrud.ts`：无特殊导出逻辑可不动
- 组件本体：需已存在，并支持 `v-model` + 普通 props

---

## 接入清单

### Naive UI 控件（例：`NMention`）

1. [ ] `fieldSchema.ts` — 类型（+ 默认值如需）
2. [ ] `constants.ts` — `paletteGroups` + `componentOptions`
3. [ ] `CommonForm.vue` — `NAIVE_COMPONENTS` 注册
4. [ ] （可选）`SearchPanel.vue` — 搜索场景需要时注册
5. [ ] （可选）`utils.ts` / `ComponentBindExtras.vue` / `bindManagedKeys.ts`

### 业务组件（例：新建 `XxxSelect.vue`）

1. [ ] 实现组件（`v-model` + props）
2. [ ] `fieldSchema.ts` — 类型与默认值
3. [ ] `constants.ts` — 面板与下拉
4. [ ] `CommonForm.vue` — `CUSTOM_COMPONENTS`
5. [ ] （可选）`SearchPanel.vue`
6. [ ] （可选）options / multiple / 专属 bind 面板

---

## 字段与 bind 约定

- 公共字段结构见 `fieldSchema.ts` 的 `UnifiedFieldConfig`
- 设计器内部字段为 `BuilderField`（含 `uid`、`_*` 临时字段），导出时由 `serialize` 清理
- 组件专属参数写在 `bind`；场景覆盖可写在 `form.bind` / `search.bind`
- 已在面板管理的键列入 `bindManagedKeys.ts`，扩展 JSON 只会保留「未管理」的键
- `defineFields` 会编译 `form.visibleExpr` / `hiddenExpr` / `renderExpr` / `onChangeExpr`，以及 `table.tagTypeValue` / `exportTextValue`
- `dictType` 仅为设计器提示：导出前请先「加载」字典写入 `options`，或在业务页自行 `useDict`

参考已有业务组件：`DeptSelect`、`SqlSearch`、`UploadFile`、`ImageCropper`、`Editor`。
