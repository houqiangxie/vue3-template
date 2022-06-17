declare namespace Ux {
  export interface MindConfig {
    rootLayout: Array<{
      /**
       * 分布方案
       * @description
       * ① LR -- 左右平分；
       * ② U -- U型环绕；
       * ③ B -- 底部水平对称排列。
       */
      layoutType: "LR" | "U" | "B";
      /**
       * 定位样式
       * @description 仅配置 left、top
       */
      style: {
        top?: string;
        left?: string;
        [propName: string]: any;
      };
    }>;
    rootList: Array<UxCore.TreeNode>;
  }
}
