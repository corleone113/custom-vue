import Observer from './observer';
import Watcher from './watcher';
import Dep from './dep';
export function initState(vm) {
    const opts = vm.$options;
    if (opts.data) {
        initData(vm); // 初始化数据
    }
    if (opts.computed) { // 初始化计算属性
        initComputed(vm, opts.computed); // 初始化computed
    }
    if (opts.watch) {
        initWatch(vm); // 初始化watch
    }
}
export function observe(data) { // 通过observer对传入的对象的属性进行劫持——以便进行响应式更新，并返回observer
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

function initData(vm) { // 初始化组件(Vue)实例数据对象
    let {
        data
    } = vm.$options; // 从组件选项对象获取data选项
    data = vm.$data = typeof data === 'function' ? data.call(vm) : data || {} // 创建数据对象，数据对象保存在组件实例的$data上
    for (const key in data) { // 将data选项配置的属性从组件实例代理到数据对象上
        proxy(vm, '$data', key);
    }
    observe(vm.$data); // 劫持数据对象的属性
}

function createComputedGetter(vm, key) {
    const watcher = vm._watcherComputed[key]; // 这个watcher就是用户定义的计算属性watcher。
    return function () { // 用户使用计算属性才会执行回调计算出值
        if (watcher.dirty) { // 如果用到的计算属性的依赖有变化时重新计算watcher.value。
            watcher.evaluate()
        }
        if (Dep.target) { // 让当前栈顶watcher观测此计算属性
            watcher.depend();
        }
        return watcher.value; // 返回计算属性 
    }
}

function initComputed(vm, computed) { // 初始化计算属性。
    const watchers = vm._watcherComputed = Object.create(null); // 缓存watcher对象
    for (const key in computed) {
        const origValue = computed[key]; // 计算属性原始值(来自选项对象)
        if (typeof origValue !== 'object' && typeof origValue !== 'function' ||
            origValue === null || typeof origValue === 'object' && typeof origValue.get !== 'function')
            throw new Error('Expected the computed property to be a function or a object with getter', origValue);
        const getter = typeof origValue === 'function' ? origValue : origValue.get; // 获取getter函数
        const setter = origValue.set; // 获取setter函数
        watchers[key] = new Watcher(vm, getter, () => {}, { // 创建getter函数对应的watcher
            lazy: true
        }); // 计算属性watcher，默认watcher初始化时计算属性的回调不会执行。
        Object.defineProperty(vm, key, { // 在组件实例上定义计算属性名对应的getter属性
            get: createComputedGetter(vm, key),
        });
        setter && Object.defineProperty(vm, key, { // 在组件实例上定义计算属性名对应的setter属性
            set: setter.bind(vm), // 在setter函数中应该修改计算属性依赖的属性。
        })
    }
}

function initWatch(vm) { // 初始化watch选项
    const watch = vm.$options.watch;
    for (const expr in watch) { // watch选项的属性名为依赖的键路径(字符串)
        const watcher = watch[expr];
        let handler, opts = {};
        if (typeof watcher === 'function') { // watch选项属性值为函数则直接作为回调
            handler = watcher;
        } else if (typeof watcher === 'object' && watcher !== null) {
            ({  // watch选项属性值为对象则解构获取回调和其它选项。
                handler,
                ...opts
            } = watcher);
        }
        vm.$watch(expr, handler, opts);
    }
}