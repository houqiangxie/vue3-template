import { Boot } from '@wangeditor/editor'
import mentionModule from '@wangeditor/plugin-mention'
import processRecordModule from './module'

let registered = false

/** 注册打印模板编辑器插件（只注册一次） */
export const setupWangEditorPlugin = () => {
  if (registered)
    return
  Boot.registerModule(processRecordModule as any)
  Boot.registerModule(mentionModule)
  registered = true
}
