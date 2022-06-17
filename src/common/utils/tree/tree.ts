export default {
  parse,
  each,
  relation2Tree,
};

/**
 * 标准树结构的节点遍历，不做任何处理
 * @param node 节点或节点列表
 * @param callback 遍历每个节点时的回调函数
 * @param childrenKey 子集合key。默认为children
 */
export function parse(node: UxCore.TreeNode, callback: UxCore.TreeCallback<UxCore.TreeNode>, childrenKey = "children") {
  if (!node) {
    console.error("[TreeUtil]: 节点不能为空");
    return;
  }
  let list = node as Array<UxCore.TreeNode>;
  if (!Array.isArray(list)) {
    list = [list];
  }
  for (let i = 0, l = list.length; i < l; i++) {
    const item = list[i];
    let stop = false;
    callback(item, () => {
      stop = true;
    });
    if (stop) {
      break;
    }
    const children: Array<UxCore.TreeNode> = item[childrenKey];
    if (children?.length > 0) {
      parse(children, callback, childrenKey);
    }
  }
}

/**
 * 标准树结构的节点遍历，同时注入节点信息
 * @param node 节点或节点列表
 * @param callback 遍历每个节点时的回调函数
 * @param nodeInfo 节点信息
 * ---
 * 1、直接操作源数据
 * 2、可设置子集合key名
 * 3、可设置初始层级
 * 4、可设置初始链路关系
 * 5、可设置链路关系组成元素key名
 */
export function each(node: UxCore.TreeNode, callback?: UxCore.TreeCallback, nodeInfo?: UxCore.TreeNodeInfo) {
  if (!node) {
    console.error("[TreeUtil]: 节点不能为空");
    return;
  }
  if (!nodeInfo) {
    // 外部未传入 直接使用默认值
    nodeInfo = {
      index: 0,
      level: 1,
      relation: [],
      indexRelation: [],
      childrenKey: "children",
      relationKey: "index",
      isLevelEnd: true,
      isLevelEndRelation: [],
    };
  } else {
    // 外部有传入 将无效值替换成默认值
    const { index, level, relation, indexRelation, childrenKey, relationKey, isLevelEnd, isLevelEndRelation } = nodeInfo || {};
    nodeInfo = {
      index: typeof index === "number" ? index : 0,
      level: typeof level === "number" ? level : 1,
      relation: relation ? relation : [],
      indexRelation: indexRelation ? indexRelation : [],
      childrenKey: childrenKey ? childrenKey : "children",
      relationKey: relationKey ? relationKey : "index",
      isLevelEnd: typeof isLevelEnd === "boolean" ? isLevelEnd : true,
      isLevelEndRelation: isLevelEndRelation ? isLevelEndRelation : [],
    };
  }
  let list = node as Array<UxCore.TreeInjectionInfoNode>;
  if (!Array.isArray(list)) {
    list = [list];
  }
  const { level, relation, indexRelation, childrenKey, relationKey, isLevelEndRelation } = nodeInfo;
  for (let i = 0, l = list.length; i < l; i++) {
    const item = list[i];
    const nodeInfo: UxCore.TreeNodeInfo = {
      index: i,
      level,
      relation: [...relation],
      indexRelation: [...indexRelation],
      childrenKey,
      relationKey,
      isLevelEnd: true,
      isLevelEndRelation: [...isLevelEndRelation],
      peers: l - 1,
      childrenLen: 0,
    };
    const children = item[childrenKey];
    if (relationKey === "index") {
      nodeInfo.relation.push(nodeInfo[relationKey]); // 从nodeInfo中获取
    } else {
      nodeInfo.relation.push(item[relationKey]); // 其他则从节点中获取
    }
    nodeInfo.indexRelation.push(i);
    nodeInfo.isLevelEnd = i === l - 1;
    nodeInfo.isLevelEndRelation.push(nodeInfo.isLevelEnd);
    if (children?.length > 0) {
      nodeInfo.childrenLen = children.length;
    }
    item.nodeInfo = nodeInfo; // 注入节点信息(若传入的节点已有nodeInfo字段会直接覆盖)
    let stop = false;
    if (callback) {
      callback(item, () => {
        stop = true;
      });
    }
    if (stop) {
      break;
    }
    if (children?.length > 0) {
      // 把节点信息往下带
      const currentNodeInfo: UxCore.TreeNodeInfo = {
        index: 0,
        level: item.nodeInfo.level + 1,
        relation: [...item.nodeInfo.relation],
        indexRelation: [...item.nodeInfo.indexRelation],
        childrenKey,
        relationKey,
        isLevelEnd: item.nodeInfo.isLevelEnd,
        isLevelEndRelation: [...item.nodeInfo.isLevelEndRelation],
      };
      each(children, callback, currentNodeInfo);
    }
  }
}

/**
 * 根据已知的链路关系映射出相同的树结构
 * @param node 节点或节点列表
 * @param relation 已知的链路关系
 * @param relationType 指定某个链路关系。默认为indexRelation
 * @param injectNodeInfo 是否注入节点信息。默认为false
 */
export function relation2Tree(
  node: UxCore.TreeNode | UxCore.TreeInjectionInfoNode,
  relation: Array<number | string>,
  relationType = "indexRelation",
  injectNodeInfo = false,
) {
  if (!relation) {
    console.error("[TreeUtil]: `relation`参数不能为空!");
    return;
  }
  let list: Array<UxCore.TreeNode | UxCore.TreeInjectionInfoNode> = [];
  for (let i = relation.length - 1, l = 0; i >= l; i--) {
    const target = relation.slice(0, i + 1).toString();
    each(node, (item, stop) => {
      const isTarget = item.nodeInfo[relationType].toString() === target;
      if (isTarget) {
        const node: UxCore.TreeNode | UxCore.TreeInjectionInfoNode = {
          ...item,
          children: i === relation.length - 1 ? [] : list, // 最末节点children为一个空数组
        };
        if (!injectNodeInfo) {
          delete node.nodeInfo;
        }
        list = [node];
        stop();
      }
    });
  }
  return list[0];
}
