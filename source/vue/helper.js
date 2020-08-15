
const defaultReg = /\{\{((?:.|\r?\n)+?)\}\}/

export function getValue(vm, expr){ // 根据键路径获取组件实例上的属性
    const keys = expr.split('.');
    return keys.reduce((memo, current)=>{
        memo = memo[current];
        return memo;
    }, vm)
}

export function query(el){
    if(typeof el === 'string'){
        return document.querySelector(el);
    }
    return el;
}