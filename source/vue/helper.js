
const defaultReg = /\{\{((?:.|\r?\n)+?)\}\}/

export function getValue(vm, expr){
    const keys = expr.split('.');
    return keys.reduce((memo, current)=>{
        memo = memo[current];
        return memo;
    }, vm)
}
function compilerText(node, vm){ // 替换{{}}插值字符串
    if(!node.expr){
        node.expr = node.textContent;
    }

    node.textContent = node.expr.replace(defaultReg, function(...arg){
        return getValue(vm, arg[1]);
    })
}
export function compile(node,vm){
    const childNodes = node.childNodes;
    [...childNodes].forEach(child=>{ // 一种是元素 一种是文本
        if(child.nodeType === 1){ // 1表示元素
            compile(child, vm);
        }else if(child.nodeType === 3){ // 3表示文本节点
            compilerText(child, vm);
        }
    })
}

export function query(el){
    if(typeof el === 'string'){
        return document.querySelector(el);
    }
    return el;
}