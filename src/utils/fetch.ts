import { showFailToast } from "vant";
import { db, local } from 'ux-web-storage'
const commonStore = useCommonStore();
window.addEventListener("unhandledrejection", e => {
    console.log(e.reason);
    e.preventDefault();
});
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
    cached: false,
    catchExpires: null,
};

// 根据请求方式，url等生成请求key
const generateReqKey = (config: any) => {
    const { method, url, body, requestKey } = config;
    return requestKey || [method, url, new URLSearchParams(body)].join("&");
}

// 请求配置map
const pendingRequest = new Map();
const cacheRequestMap = new Map()
// 添加请求map
export const addPendingRequest = (config: any) => {
    const requestKey = generateReqKey(config);
    if (!pendingRequest.has(requestKey)) {
        pendingRequest.set(requestKey, config);
    }
}
// 移除请求map
export const removePendingRequest = (config: any, requestKey?: string) => {
    if (!requestKey) requestKey = generateReqKey(config);
    if (!config.requestKey) config.requestKey = requestKey;
    if (pendingRequest.has(requestKey)) {
        const cancelToken = config || pendingRequest.get(requestKey);
        if (cancelToken) {
            cancelToken.abortRequest = true;
            cancelToken.controller.abort();
        }
        pendingRequest.delete(requestKey);
    }
}

// 移除所有pending请求
export const removeAllPendingRequest = () => {
    pendingRequest.forEach((source) => {
        if (source) {
            removePendingRequest(source)
        }
    })
}

// 结果处理，fetch请求响应结果是promise，还得处理
async function resultReduction(response: any) {
    let res = '';
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
        case "arrayBuffer":
            res = await response.arrayBuffer();
            break;
        default:
            res = await response?.json();
            break;
    }
    return await res;
}

async function request(method: string, path: string, data: { [prop: string]: any }, config: any = {}): Promise<{ data: any, code: number }> {

    // 请求处理前的操作
    if (!config.hideLoading) commonStore.showLoading = true;
    const token = local.token?.token;
    const controller = new AbortController();
    const { signal } = controller;
    let configTemp = Object.assign(
        {
            responseType: "json",
            headers: {
                "Content-Type": config.formData
                    ? "application/x-www-form-urlencoded" :
                    config.fileUpload ? 'multipart/form-data;'
                        : "application/json;charset=utf-8",
                token
            },
        },
        { signal, ...configDefault, ...config, controller }
    );
    if (config.isNotAuth) delete configTemp.headers['token'];
    if (config.fileUpload) delete configTemp.headers["Content-Type"];
    // removePendingRequest(configTemp); // 检查是否存在重复请求，若存在则取消已发的请求
    addPendingRequest(configTemp); // 把当前请求信息添加到pendingRequest对象中
    const requestKey = generateReqKey(configTemp)
    // 共享promise
    if (cacheRequestMap.has(requestKey)) return cacheRequestMap.get(requestKey)
    if (config.cached) {//缓存数据
        const res = await db.get(requestKey)
        if (res) return Promise.resolve({ cached: true, requestKey, res }) as any;
    }


    if (!config.fileUpload) {
        const paramsData = deepClone(data);
        for (const key in paramsData) {
            if (paramsData[key] === null) {
                delete paramsData[key];
            }
        }
        data = paramsData;
    }
    path = (config?.unwanted ? '' : import.meta.env.VITE_baseUrl) + path;
    let myInit = {
        method,
        ...configDefault,
        ...config,
        body: config.fileUpload ? data : (config.formData ? new URLSearchParams(data) : JSON.stringify(data))
    };
    if (method === 'GET') delete myInit.body
    let params = '';
    if (data && (method === 'GET' || config.joinUrl)) {
        // 对象转url参数
        params = (JSON.stringify(data) as any)?.replace(/:/g, '=')?.replace(/"/g, '')?.replace(/,/g, '&')?.match(/\{([^)]*)\}/)[1];
    }

    const fetchPromise :any= new Promise((resolve, reject) => {
        fetch(params ? `${path}${params ? "?" : ""}${params}` : path, myInit).then(async response => {
            // TODO: 这里是复制一份结果处理，在这里可以做一些操作
            commonStore.showLoading = false;
            const res: any = await resultReduction(response);
            removePendingRequest(configTemp); // 从pendingRequest对象中移除请求
            cacheRequestMap.delete(requestKey)
            if ((response.status == 401 || res.code == 401) && !configTemp.withoutCheck) {
                const { hash, pathname } = location;
                if (!hash.includes('returnUrl')) {
                    if (window.eventCenterForAppEmergencyTeam) parent.location.replace((location.ancestorOrigins[0] || '') + '#/login')
                    else location.href = pathname + '#/login?returnUrl=' + encodeURIComponent(hash);;
                }
                return resolve(res);
            }
            if (res.code == 403) window.history.go(-1);
            // HTTP 状态码 2xx 状态入口，data.code 为 200 表示数据正确，无任何错误
            if (response.status >= 200 && response.status < 300 && res.code != 401) {
                if (res.code !== 0 && res.message && !configTemp.withoutCheck) {
                    if (location.pathname.includes('app')) showFailToast(res.code !== 500 ? res.message : '接口异常，请联系管理员!');
                    else window.$message.error(res.code !== 500 ? res.message : '接口异常，请联系管理员!');
                }
                if (configTemp.cached) {
                    const requestKey = generateReqKey(configTemp)
                    db.set(requestKey, deepClone(res), configTemp.catchExpires)
                }
                return resolve(res);
            } else {
                // 非 2xx 状态入口 // 不进行状态状态检测
                if (configDefault.withoutCheck) return resolve(response as any);
                if (res.code !== 0 && res.code !== 500 && res.message) {
                    if (location.pathname.includes('app')) showFailToast(res.message);
                    else window.$message.error(res.message);
                }
            }
        }).catch(error => {
            // 响应拦截进来隐藏loading效果，此处采用延时处理是合并loading请求效果，避免多次请求loading关闭又开启
            commonStore.showLoading = false;
            if (!configTemp.abortRequest) window.$message.error("服务器异常，请稍后再试"); //非手动阻止请求抛出异常
            removePendingRequest(configTemp || {}); // 从pendingRequest对象中移除请求
            cacheRequestMap.delete(requestKey)
        })
    })
    cacheRequestMap.set(requestKey, fetchPromise)
    return fetchPromise

}
// get请求方法使用封装
export async function get(path = '', data = {}, config = {}) {
    return await request('GET', path, data, config);
}

// post请求方法使用封装
export async function post(path = '', data = {}, config = {}) {
    return await request('POST', path, data, config);
}

// put请求方法使用封装
export async function put(path = '', data = {}, config = {}) {
    return await request('PUT', path, data, config);
}

// delete请求方法使用封装
export async function del(path = '', data = {}, config = {}) {
    return await request('DELETE', path, data, config);
}
