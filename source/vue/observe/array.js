// 拦截数据的变异操作——push,shift,unshift,pop,reverse,sort,splice

import {
    observe
} from ".";

const arrPrototype = Array.prototype;

export const arrayMethods = Object.create(arrPrototype);

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
        observe(array[i]);
    }
}
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        // console.log('调用数据的更新方法：', method);
        let inserted;
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
        inserted && observeArray(inserted);
        this._observer.arrayDep.notify(true); // 通知视图更新
        return arrPrototype[method].apply(this, args);
    }
});
export function dependArray(array) { // 观测数组属性的嵌套数组的变化，
    for (const v of array) {
        v._observer && v._observer.arrayDep && v._observer.arrayDep.depend();
        if (Array.isArray(v)) {
            dependArray(v);
        }
    }
}