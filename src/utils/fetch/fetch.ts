import { Cfetch, interceptors } from "./interceptor";
import { useStorage } from "vue3-storage";
import { deepClone } from "../common";
const storage = useStorage();
import { useCommonStore } from "@/store/common";
import { da } from "date-fns/locale";
const commonStore = useCommonStore();
/**
 * config 自定义配置项
 * @param withoutCheck 不使用默认的接口状态校验，直接返回 response
 * @param returnOrigin 是否返回整个 response 对象，为 false 只返回 response.data
 * @param showError 全局错误时，是否使用统一的报错方式
 * @param canEmpty 传输参数是否可以为空
 * @param mock 是否使用 mock 服务
 * @param timeout 接口请求超时时间，默认10秒
 */
let configDefault: any = {
  showError: true,
  canEmpty: false,
  returnOrigin: false,
  withoutCheck: false,
  mock: false,
  timeout: 10000,
  mode: "cors",
  cache: "no-cache",
};

// 根据请求方式，url等生成请求key
function generateReqKey(config: any) {
  const { method, url, body } = config;
  return [method, url, new URLSearchParams(body)].join("&");
}

const pendingRequest = new Map();
function addPendingRequest(config: any) {
  const requestKey = config.requestKey ?? generateReqKey(config);
  if (!pendingRequest.has(requestKey)) {
    pendingRequest.set(requestKey, true);
  }
}

function removePendingRequest(config: any) {
  const requestKey = config.requestKey ?? generateReqKey(config);
  if (!config.requestKey) config.generateReqKey = requestKey;
  if (pendingRequest.has(requestKey)) {
    const cancelToken = pendingRequest.get(requestKey);
    if (cancelToken) {
      config.abortRequest = true;
      config.controller.abort();
    }
    pendingRequest.delete(requestKey);
  }
}

// 添加请求拦截器
interceptors.request.use((config: any = {}) => {
  commonStore.showLoading = true;
  const token = storage.getStorageSync("token")?.token;
  const controller = new AbortController();
  const { signal } = controller;
  let configTemp = Object.assign(
    {
      responseType: "json",
      headers: {
        "Content-Type": config.formData
          ? "application/x-www-form-urlencoded"
          : "application/json;charset=utf-8",
        // authorization: `Bearer ${token}`,
        token,
      },
    },
    { signal, ...configDefault, ...config, controller }
  );
  if (config.isNotAuth) delete configTemp.headers["token"];

  removePendingRequest(configTemp); // 检查是否存在重复请求，若存在则取消已发的请求
  addPendingRequest(configTemp); // 把当前请求信息添加到pendingRequest对象中
  return configTemp;
});

// 添加响应拦截器
interceptors.response.use(
  async (response: any) => {
    // TODO: 这里是复制一份结果处理，在这里可以做一些操作
    commonStore.showLoading = false;
    const res: any = await resultReduction(response);
    removePendingRequest(response.requestConfig); // 从pendingRequest对象中移除请求
    if (
      (response.status == 401 || res.code == 401) &&
      !response.requestConfig.withoutCheck
    ) {
      const { hash, pathname } = window.location;
      if (!hash.includes("returnUrl"))
        window.location.href =
          pathname +
          "#/login?returnUrl=" +
          encodeURIComponent(hash.replace("#", ""));
      return res;
    }

    // HTTP 状态码 2xx 状态入口，data.code 为 200 表示数据正确，无任何错误
    if (response.status >= 200 && response.status < 300 && res.code != 401) {
      if (
        res.code !== 0 &&
        res.message &&
        !response.requestConfig.withoutCheck
      ) {
        window.$message.error(res.message);
      }
      return res;
    } else {
      // 非 2xx 状态入口
      if (configDefault.withoutCheck) {
        // 不进行状态状态检测
        return Promise.reject(response);
      }
      // return Promise.reject(response);
      if (res.code !== 0 && res.message) {
        window.$message.error(res.message);
      }
    }
  },
  async ({ error, requestConfig }: any) => {
    // 响应拦截进来隐藏loading效果，此处采用延时处理是合并loading请求效果，避免多次请求loading关闭又开启
    commonStore.showLoading = false;
    if (!requestConfig.abortRequest)
      window.$message.error("服务器异常，请稍后再试"); //非手动阻止请求抛出异常
    removePendingRequest(requestConfig || {}); // 从pendingRequest对象中移除请求
    // return Promise.reject(new Error(error));
  }
);

// 结果处理，fetch请求响应结果是promise，还得处理
async function resultReduction(response: any) {
  let res = "";
  switch (response.requestConfig.responseType) {
    case "json":
      res = await response.json();
      break;
    case "text":
      res = await response.text();
      break;
    case "blob":
      res = await response.blob();
      break;
    default:
      res = await response?.json();
      break;
  }
  return await res;
}

function request(
  method: string,
  path: string,
  data: { [prop: string]: any },
  config: any = {}
) {
  const paramsData = deepClone(data);
  for (const key in paramsData) {
    if (!paramsData[key]) {
      delete paramsData[key];
    }
  }
  data = paramsData;
  path = (config?.unwanted ? "" : import.meta.env.VITE_APP_baseUrl) + path;
  let myInit = {
    method,
    ...configDefault,
    ...config,
    body: config.formData ? new URLSearchParams(data) : JSON.stringify(data),
  };
  if (method === "GET") delete myInit.body;
  let params = "";
  if (data && (method === "GET" || config.joinUrl)) {
    // 对象转url参数
    params = (JSON.stringify(data) as any)
      ?.replace(/:/g, "=")
      ?.replace(/"/g, "")
      ?.replace(/,/g, "&")
      ?.match(/\{([^)]*)\}/)[1];
  }

  return Cfetch(params ? `${path}${params ? "?" : ""}${params}` : path, myInit);
}
// get请求方法使用封装
export function get(path = "", data = {}, config = {}) {
  return request("GET", path, data, config);
}

// post请求方法使用封装
export function post(path = "", data = {}, config = {}) {
  return request("POST", path, data, config);
}

// put请求方法使用封装
export function put(path = "", data = {}, config = {}) {
  return request("PUT", path, data, config);
}

// delete请求方法使用封装
export function del(path = "", data = {}, config = {}) {
  return request("DELETE", path, data, config);
}

export default {
  fetch: Cfetch,
  get,
  post,
  put,
  delete: del,
};
