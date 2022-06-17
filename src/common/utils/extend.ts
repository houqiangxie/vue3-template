export default {
  throttle,
  debounce,
  uuid,
  deepCopy,
  stringUrlPath,
};

/**
 * 函数节流
 * @param fn 待执行函数
 * @param wait 单位(毫秒)
 */
function throttle(fn: (...args: Array<any>) => any, wait: number) {
  let timer: unknown = null;
  return function (...args: Array<any>) {
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, wait);
    }
  };
}

/**
 * 函数防抖
 * @param fn 待执行函数
 * @param wait 单位(毫秒)
 */
function debounce(fn: (...args: Array<any>) => any, wait: number) {
  let timer: unknown = null;
  return function (...args: Array<any>) {
    if (timer) {
      clearTimeout(timer as number);
      timer = setTimeout(() => {
        fn(...args);
      }, wait);
    } else {
      timer = setTimeout(() => {
        fn(...args);
      }, wait);
    }
  };
}

/**
 * 生成uuid
 */
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 深拷贝
 * @param target 拷贝目标
 */
function deepCopy<T>(target: T): T {
  // 此数组解决了循环引用和相同引用的问题，它存放已经递归到的目标对象
  const copyedObjs: Array<any> = [];

  function _deepCopy(target: any) {
    if (typeof target !== "object" || !target) {
      return target;
    }
    for (let i = 0; i < copyedObjs.length; i++) {
      if (copyedObjs[i].target === target) {
        return copyedObjs[i].copyTarget;
      }
    }
    let obj: { [propName: string]: any } = {};
    if (Array.isArray(target)) {
      obj = []; // 处理target是数组的情况
    }
    copyedObjs.push({
      target: target,
      copyTarget: obj,
    });
    Object.keys(target).forEach((key) => {
      if (obj[key]) {
        return;
      }
      obj[key] = _deepCopy(target[key]);
    });
    return obj;
  }
  return _deepCopy(target);
}

/**
 * 将地址中的占位符替换成某个值
 * ---
 * "http://test.com/users/{userId}" => "https://test.com/users/1"
 */
function stringUrlPath(url: string, params: { [propName: string]: string }): string {
  for (const k in params) {
    if (params[k] !== undefined) {
      const regExp = new RegExp(`({${k}})`, "g");
      url = url.replace(regExp, params[k]);
    }
  }
  return url;
}
