declare namespace Ux {
  /**
   * 表单项配置
   */
  export interface FormItemConfig {
    /**
     * 业务字段
     */
    field: string;
    /**
     * 内部支持的组件名
     */
    component?: "Input" | "InputNumber" | "Select" | "Cascader" | "DatePicker" | "Switch" | "Checkbox" | "ColorPicker" | "Rate" | "Slider";
    /**
     * 动态插槽
     */
    slotName?: string;
    /**
     * 是否显示。不传默认为true
     */
    show?: boolean;
    /**
     * 文本
     */
    label?: string;
    /**
     * 文本宽度
     */
    labelWidth?: number;
    /**
     * 规则
     * @document https://github.com/yiminghe/async-validator
     */
    rules?: Array<{ [propName: string]: any }>;
    /**
     * 布局配置
     * @document https://element-plus.gitee.io/zh-CN/component/layout.html#col-%E5%B1%9E%E6%80%A7
     */
    colProps?: { [propName: string]: any };
    /**
     * 组件内部属性
     */
    componentProps?: { [propName: string]: any };
    /**
     * 组件内部事件
     */
    componentEvents?: { [propName: string]: any };
  }
}
