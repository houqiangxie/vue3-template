export default {
  getDOMRect,
  getSVGPolylinePoints,
  getChildLayout,
};

/**
 * 扩展DOMRect
 */
function getDOMRect(el: HTMLElement): UxCore.MindRect {
  if (!el) {
    throw Error("[MindUtil]: 节点不存在！");
  }
  const targetDOMRect = el.getBoundingClientRect() as UxCore.MindRect;
  targetDOMRect.center = {
    x: targetDOMRect.x + targetDOMRect.width / 2,
    y: targetDOMRect.y + targetDOMRect.height / 2,
  };
  return targetDOMRect;
}

interface IPolylinePoint {
  x: number;
  y: number;
}

/**
 * 获取 SVG polyline 可用数据集，用于直接绘制
 * @param start 起点
 * @param end 终点
 * @param turn 转折点
 */
function getSVGPolylinePoints(start: IPolylinePoint, end: IPolylinePoint, turn: Array<IPolylinePoint> = []) {
  return [start, ...turn, end].map(({ x, y }) => `${x},${y}`).join(" ");
}

interface IChildLayout {
  offset: { x: number; y: number };
  style?: { [propName: string]: any };
}

/**
 * 子节点布局
 * @description 计算子节点相对根节点的偏移量
 * @param type 内部支持的分布类型
 * @param mainDOM 可滚动节点
 * @param rootDOM 根节点
 */
function getChildLayout(type = "LR", mainDOM: HTMLElement, rootDOM: HTMLElement, childTotal = 0): Array<IChildLayout> {
  // console.log("---");
  // console.log("mainDOM", mainDOM);
  // console.log("rootDOM", rootDOM);
  // console.log("childTotal", childTotal);
  if (type === "LR") {
    // 左右分布
    return [
      {
        style: { direction: "rtl" },
        offset: { x: -120, y: -70 },
      },
      {
        style: { direction: "rtl" },
        offset: { x: -120, y: 70 },
      },
      {
        style: {},
        offset: { x: 120, y: -70 },
      },
      {
        style: {},
        offset: { x: 120, y: 70 },
      },
    ];
  } else if (type === "U") {
    // U型环绕分布
    const gap = 60 + 20;
    const list = [
      {
        style: { direction: "rtl" },
        offset: { x: -150, y: 0 - gap * 2 },
      },
      {
        style: { direction: "rtl" },
        offset: { x: -150, y: 0 - gap * 1 },
      },
      {
        style: { direction: "rtl" },
        offset: { x: -150, y: 0 },
      },
      {
        style: { direction: "rtl" },
        offset: { x: -150, y: 0 + gap * 1 },
      },
      {
        style: { direction: "rtl" },
        offset: { x: -150, y: 0 + gap * 2 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 - gap / 2 - gap * 2 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 - gap / 2 - gap * 1 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 - gap / 2 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 + gap / 2 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 + gap / 2 + gap * 1 },
      },
      {
        style: {},
        offset: { x: 150, y: 0 + gap / 2 + gap * 2 },
      },
    ];
    return list;
  } else if (type === "B") {
    const list: Array<{ offset: { x: number; y: number } }> = [];
    const y = 130;
    const size = 120;
    const itemGap = 20;
    const step = size + itemGap;
    for (let i = 0, l = childTotal; i < l; i++) {
      list.push({ offset: { x: 0, y } });
    }
    if (list.length % 2 === 0) {
      const half = list.length / 2;
      let i = 0;
      while (i < half) {
        list[i].offset.x = i * step + 20 / 2 + size / 2 - half * step;
        list[i + half].offset.x = i * step + 20 / 2 + size / 2;
        i++;
      }
    } else {
      const half = Math.ceil(list.length / 2);
      let i = 0;
      while (i < half) {
        list[i].offset.x = i * step - half * step + step;
        if (i + half !== list.length) {
          list[i + half].offset.x = i * step + step;
        }
        i++;
      }
    }
    return list;
  }
  return [];
}
