/**
 * 页面元素观察者
 * @version 0.0.1
 */
export default {
  drag,
};

// interface ITargetEl extends HTMLElement {
//   standard: {
//     x: number;
//     y: number;
//     left: number;
//     top: number;
//   };
// }

/**
 * 元素拖拽事件
 * @param target 被观察者
 * @param root 根元素
 * @param mouseupCallback mouseup事件执行的回调函数
 * @param mousemoveCallback mousemove事件执行的回调函数
 * ---
 * 注意：
 * 1️⃣ 若元素没有设置position时，会添加行内样式position: fixed;
 * 2️⃣ 元素添加 user-select: none; 可提升拖拽流畅度。
 * 3️⃣ z-index为默认值，被遮挡时应修改元素样式提高层级。
 * 4️⃣ 事件代理子节点的宽度应与指令根节点宽度保持一致。
 */
export function drag(
  target: any,
  root?: HTMLElement,
  mouseupCallback?: (payload: { rect: DOMRect }) => void,
  mousemoveCallback?: (payload: { rect: DOMRect }) => void,
): {
  observe: () => void;
  unobserve: () => void;
} {
  if (!target) {
    throw Error("[ObserverUtil/drag]: 被观察者不能为空，请检查节点是否存在！");
  }

  const { position } = window.getComputedStyle(target);

  // 检查position是否为默认值
  if (position === "static") {
    if (root) {
      root.style.position = "fixed";
    } else {
      target.style.position = "fixed"; // ? root
    }
  }

  // 鼠标起点位置与元素当前偏移量
  const standard = "_directive_drag_standard";

  const mouseenterHandler = (e: MouseEvent) => {
    e.stopPropagation();
    document.body.removeEventListener("mousemove", mousemoveHandler);
  };

  const mousedownHandler = (e: MouseEvent) => {
    e.stopPropagation();
    document.body.addEventListener("mouseenter", mouseenterHandler);
    document.body.addEventListener("mousemove", mousemoveHandler);
    document.body.addEventListener("mouseup", mouseupHandler);
    // target.addEventListener("mouseleave", mouseupHandler);

    let left, top;
    if (root) {
      const style = window.getComputedStyle(root);
      left = style.left;
      top = style.top;
    } else {
      const style = window.getComputedStyle(target); // ? root
      left = style.left;
      top = style.top;
    }

    // 当前元素left值
    const currentLeft = typeof left === "string" ? +left.replace("px", "") : 0;
    // 当前元素top值
    const currentTop = typeof top === "string" ? +top.replace("px", "") : 0;

    // 记录鼠标起点位置与元素当前偏移量
    target[standard] = {
      x: e.x,
      y: e.y,
      left: currentLeft,
      top: currentTop,
    };
  };

  const mousemoveHandler = (e: MouseEvent) => {
    e.stopPropagation();

    const { x, y, left, top } = target[standard];

    if (root) {
      root.style.left = left - (x - e.x) + "px";
      root.style.top = top - (y - e.y) + "px";
    } else {
      target.style.left = left - (x - e.x) + "px"; // ? root
      target.style.top = top - (y - e.y) + "px"; // ? root
    }

    if (typeof mousemoveCallback === "function") {
      let el = target;
      if (root) {
        el = root;
      }
      const rect = el.getBoundingClientRect();
      mousemoveCallback({
        rect,
      });
    }
  };

  const mouseupHandler = (e: MouseEvent) => {
    e.stopPropagation();
    document.body.removeEventListener("mouseenter", mouseenterHandler);
    document.body.removeEventListener("mousemove", mousemoveHandler);
    document.body.removeEventListener("mouseup", mouseupHandler);
    // target.removeEventListener("mouseleave", mouseupHandler);

    if (typeof mouseupCallback === "function") {
      let el = target;
      if (root) {
        el = root;
      }
      const rect = el.getBoundingClientRect();
      mouseupCallback({
        rect,
      });
    }
  };

  // 开始观察
  const observe = () => {
    target.addEventListener("mousedown", mousedownHandler);
  };

  // 结束观察
  const unobserve = () => {
    target.removeEventListener("mousedown", mousedownHandler);
  };

  return {
    observe,
    unobserve,
  };
}
