import {
    render,
    patch
} from './patch';

function createElement(tag, props, ...children) { // 创建vnode
    const key = props.key;
    delete props.key;
    children = children.map(child => {
        if (typeof child === 'object') { // 为对象说明是vnode
            return child;
        } else if(typeof child === 'number' || typeof child === 'string') { // 文本节点
            return vnode(undefined, undefined, undefined, undefined, child);
        }
        return null;
    })
    return vnode(tag, props, key, children);
}

function vnode(tag, props, key, children, text) {
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