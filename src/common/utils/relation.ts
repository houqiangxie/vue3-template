export default {
  getDomCenter,
};

/**
 * 获取节点中心点
 */
function getDomCenter(dom: HTMLElement) {
  if (!dom) {
    throw Error("[RelationUtil]: 节点不能为空！");
  }
  return {
    x: dom.offsetLeft + dom.clientWidth / 2,
    y: dom.offsetTop + dom.clientHeight / 2,
  };
}

/**
 * 绘制连接线
 */
function drawPolyline(a: { x: number; y: number }, b: { x: number; y: number }) {
  // TODO
}

/**
 * 正弦曲线
 */
