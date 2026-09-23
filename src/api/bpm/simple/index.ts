import request from '@/config/axios'

/** 更新简易流程模型 */
export const updateBpmSimpleModel = async (data: { id: number, simpleModel: unknown }) => {
  return await request.post({
    url: '/jgzf-flowable/bpm/model/simple/update',
    data,
  })
}

/** 获取简易流程模型 */
export const getBpmSimpleModel = async (id: number) => {
  return await request.get({
    url: `/jgzf-flowable/bpm/model/simple/get?id=${id}`,
  })
}
