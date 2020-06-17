import Observer from './observer';
import Watcher from './watcher';
import Dep from './dep';
export function initState(vm) {
    // 做不同的初始化工作
    const opts = vm.$options;
    if (opts.data) {
        initData(vm); // 初始化数据
    }
    if (opts.computed) {
        initComputed(vm, opts.computed); // 初始化computed
    }
    if (opts.watch) {
        initWatch(vm); // 初始化watch
    }
}
export function observe(data) {
    if (typeof data !== 'object' || data === null) {
        return;
    }
    if (data._observer) { // _observer存在就说明已经被监控过了，那么可以直接返回旧的observer
        return data._observer;
    }
    return new Observer(data);
}

function proxy(vm, source, key) { // 将vm.xx代理到vm.$data.xx
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key];
        },
        set(newVal) {
            vm[source][key] = newVal;
        }
    })
}

function initData(vm) {
    let {
        data
    } = vm.$options;
    data = vm.$data = typeof data === 'function' ? data.call(vm) : data || {}
    for (const key in data) {
        proxy(vm, '$data', key);
    }
    observe(vm.$data);
}

function createComputedGetter(vm, key) {
    const watcher = vm._watcherComputed[key]; // 这个watcher就是用户定义的计算属性watcher。
    return function () { // 用户使用计算属性才会执行回调计算出值
        if (watcher) {
            if (watcher.dirty) { // 如果用到的计算属性或依赖有变化时重新执行回调来计算值。
                watcher.evaluate()
            }
            if (Dep.target) { // 当前栈顶watcher观测计算属性
                watcher.depend();
            }
            return watcher.value;
        }
    }
}

function initComputed(vm, computed) { // 初始化计算属性。
    const watchers = vm._watcherComputed = Object.create(null);
    for (const key in computed) {
        const compRef = computed[key];
        if (typeof compRef !== 'object' && typeof compRef !== 'function' ||
            compRef === null || typeof compRef === 'object' && typeof compRef.get !== 'function')
            throw new Error('Expected the computed property to be a function or a object with getter', compRef);
        const getter = typeof compRef === 'function' ? compRef : compRef.get;
        const setter = compRef.set;
        watchers[key] = new Watcher(vm, getter, () => {}, {
            lazy: true
        }); // 计算属性watcher，默认watcher初始化时计算属性的回调不会执行。
        Object.defineProperty(vm, key, {
            get: createComputedGetter(vm, key),
        });
        setter && Object.defineProperty(vm, key, {
            set: setter.bind(vm),
        })
    }
}

function initWatch(vm) { // 初始化watch选项
    const watch = vm.$options.watch;
    for (const expr in watch) {
        const watcher = watch[expr];
        let handler, opts = {};
        if (typeof watcher === 'function') {
            handler = watcher;
        } else if (typeof watcher === 'object' && watcher !== null) {
            ({
                handler,
                ...opts
            } = watcher);
        }
        vm.$watch(expr, handler, opts);
    }
}