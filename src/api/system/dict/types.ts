/** BPM consts 用到的字典 VO（精简） */
export interface DictDataVO {
  id?: number
  sort?: number
  label: string
  value: string | number
  dictType?: string
  status?: number
  colorType?: string
  cssClass?: string
  remark?: string
}
