/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-06-01 17:25:57
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-06 11:46:23
 */
import {NInput,NInputNumber,NFormItem} from 'naive-ui'
/**
 * 
 * @param list 列表数据
 * @param disabled 是否禁用
 * @param rowI 行id
 * @returns 
 */
const RenderDynamicInput = (list: Array<{ key: string, value: number }>, disabled: boolean,rowI:number) => {
    return (<div className="grid grid-cols-4 items-center gap-x-8 gap-y-5 px-5">
        {
            list.map((listItem,index) => (
                <div className={`col-span-1 h-8 grid grid-cols-2 gap-3 text-[#333639] relative ${disabled ? 'mr-5' : ''}`}>
                    <NFormItem show-label={false} path={`troopsManyExpandList[${rowI}].list[${index}].key`} rule={{ required: true, type: 'string', message: '名称不能为空', trigger: ['blur'] }}>
                        <NInput disabled={disabled} value={listItem.key} on-update:value={(e:string)=>listItem.key=e }/>
                    </NFormItem>
                    <NFormItem show-label={false} path={`troopsManyExpandList[${rowI}].list[${index}].value`} rule={{ required: true, type: 'number', message: '值不能为空', trigger: ['blur'] }}>
                        <NInputNumber disabled={disabled} value={listItem.value}  on-update:value={ (e:number)=>listItem.value=e }/>
                    </NFormItem>
                    {!disabled?(<svg class="icon text-[#939393] text-xl cursor-pointer absolute -right-5 top-2" aria-hidden="true"  onClick={()=>list.splice(index,1)}> <use xlink:href="#icon-close"></use></svg>):''}
                        
                </div>
            ))
        }
        </div>)
}

/**
 * 自定义字段  类型
 * @param row 行数据
 * @param disabled 是否禁用
 * @param index 行id
 */
const renderTypeComponent = (row:any,disabled:boolean,index:number) => {
    return (<div className="grid items-center h-8">
        <NFormItem  show-label={false} path={`troopsManyExpandList[${index}].fieldName`} rule={{ required: true, type: 'string', message: '类别不能为空', trigger: ['blur'] }}>
                <NInput disabled={disabled} value={row.fieldName} on-update:value={(e:string)=>row.fieldName=e }/>
            </NFormItem>
    </div>)
}


export {RenderDynamicInput,renderTypeComponent}