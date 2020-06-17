import {
    observe
} from './index';
import {
    arrayMethods,
    observeArray,
    dependArray,
} from './array';
import Dep from './dep';
export default class Observer {
    constructor(data) { // 要进行响应式观测的对象。
        Object.defineProperty(data, '_observer', {
            get: () => this,
        })
        if (Array.isArray(data)) {
            this.arrayDep = new Dep(); // 存放观测数组变形操作的watcher
            Object.setPrototypeOf(data, arrayMethods); // 观测数组的变形操作。
            observeArray(data); // 观测数组中的对象。
        } else {
            this.walk(data); // 观察非数组对象。
        }
    }
    walk(data) {
        for (const key in data) {
            const value = data[key];
            defineReactive(data, key, value);
        }
    }
}
export function defineReactive(targ, key, value) { // 递归观测
    const childOb = observe(value);
    const dep = new Dep();
    Object.defineProperty(targ, key, {
        get() {
            // console.log('获取数据', key);
            if (Dep.target) { // Dep.target是一个栈结构，栈顶是当前正在更新的watcher，当watcher执行get方法时会入Dep.target栈然后访问vm某个属性，紧接着就到这里来了
                dep.depend(); // 将当前dep放到Dep栈顶watcher的dep列表中，同时将栈顶watcher存放到当前属性的dep中，这样通过该watcher就可以观测当前属性的变化了。
                if (childOb && childOb.arrayDep) { // arrayDep存在说明是数组属性
                    childOb.arrayDep.depend(); // 同上，这里是为了让栈顶watcher观测数组的变形操作
                    dependArray(value); // 让栈顶watcher观测嵌套数组的变形操作。
                }
            }
            return value;
        },
        set(newVal) {
            if (newVal === value) return;
            // console.log('更新数据',key);
            observe(newVal); // 如果设置的值为对象那么也要进行监控(观测)。
            value = newVal;
            dep.notify(); // 通知上面注册的渲染watcher进行更新。
        }
    })
}