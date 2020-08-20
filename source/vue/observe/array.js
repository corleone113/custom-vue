// 拦截数据的变异操作——push,shift,unshift,pop,reverse,sort,splice

import {
    observe
} from ".";

const arrPrototype = Array.prototype;

export const arrayMethods = Object.create(arrPrototype); // 作为被观测数组的新原型。

const methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice',
];
export function observeArray(array) {
    for (let i = 0; i < array.length; ++i) {
        observe(array[i]); // 对新插入的数组/对象进行观测
    }
}
methods.forEach(method => {
    arrayMethods[method] = function (...args) { // 劫持数组的变更操作方法
        let inserted; // 判断是否插入新元素
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
            default:
                break;
        }
        inserted && observeArray(inserted); // 如果插入新元素则也会对它们进行观测。
        this._observer.arrayDep.notify(true); // 通知依赖当前数组属性的watcher更新(调用watcher.run)
        return arrPrototype[method].apply(this, args);
    }
});
export function dependArray(array) { // 让Dep.target(栈顶watcher)观测嵌套数组的变更，
    for (const v of array) {
        if (v._observer && v._observer.arrayDep) {
            v._observer.arrayDep.depend();
            dependArray(v);
        }
    }
}