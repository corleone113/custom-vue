import {render, patch} from './patch';
function createElement(tag, props, ...children){
    const key = props.key;
    delete props.key;
    children = children.map(child => {
        if(typeof child === 'object'){
            return child;
        }else { // 文本节点
            return vnode(undefined,undefined,undefined,undefined,child);
        }
    })
    return vnode(tag,props,key,children);
}
function vnode(tag, props,key,children, text){
    return {
        tag,
        props,
        key,
        children,
        text,
    }
}
export {
    createElement,
    render,
    patch,
}