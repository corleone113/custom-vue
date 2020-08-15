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
    constructor(data) { // data为要进行观测的对象。
        this.value = data;
        Object.defineProperty(data, '_observer', { // 为观测的对象添加_observer属性，以便复用。
            get: () => this,
        })
        if (Array.isArray(data)) {
            this.arrayDep = new Dep(); // 创建Dep实例存放观测数组变更操作的watcher
            Object.setPrototypeOf(data, arrayMethods); // 修改原型对象实现对变更操作方法的劫持
            observeArray(data); // 观测数组中的对象。
        } else {
            this.walk(data); // 观察非数组对象。
        }
    }
    walk(data) { // 遍历并劫持对象的各个属性
        for (const key of Object.keys(data)) {
            const value = data[key];
            defineReactive(data, key, value);
        }
    }
}
export function defineReactive(targ, key, value) { // 递归地劫持对象的属性
    const childOb = observe(value); // 若属性值为对象，那么也对其属性进行劫持
    const dep = new Dep(); // 创建和当前被劫持属性对应的Dep实例。
    Object.defineProperty(targ, key, {
        get() {
            if (Dep.target) { // Dep.target表示Dep模块的watcher栈的栈顶元素，该watcher执行get方法时会入Dep.target栈，而watcher执行表达式时会访问vm某个属性，接着就到了这里。
                dep.depend(); // 将当前dep放到Dep栈顶watcher的dep列表中，然后会将栈顶watcher缓存到当前属性对应的dep中，这样该watcher就可以观测当前属性的变化了。
                if (childOb && childOb.arrayDep) { // arrayDep存在说明value是数组属性
                    childOb.arrayDep.depend(); // 同上，这里是为了让栈顶watcher观测数组的变更操作
                    dependArray(value); // 让栈顶watcher观测嵌套数组的变更操作。
                }
            }
            return value;
        },
        set(newVal) {
            if (newVal === value) return;
            observe(newVal); // 如果设置的值为对象那么也要进行观测。
            value = newVal;
            dep.notify(); // 通知依赖该属性的watcher进行更新。
        }
    })
}