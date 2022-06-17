declare namespace Ux {
  /**
   * 表格列配置
   */
  export interface TableColumnConfig {
    /**
     * 字段名称
     */
    prop?: string;
    /**
     * 是否启用tooltip。默认为false
     */
    useTooltip?: boolean;
    /**
     * 动态插槽
     */
    slotName?: string;
    /**
     * 文本行数限制，溢出后显示...。默认只显示1行
     */
    textRowLimit?: number;
    /**
     * element 相关属性
     * @document https://element-plus.gitee.io/zh-CN/component/table.html
     */
    [propName: string]: any;
  }
}
