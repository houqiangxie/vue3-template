/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-27 16:36:11
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-05-27 17:12:06
 */
const RenderSvg = ({icon='add',className=''}:any) => {
    return <svg className={`icon ${className}`} aria-hidden="true"> <use xlink:href={`#icon-${icon}`}></use></svg>
}


export {RenderSvg}