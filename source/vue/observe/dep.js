let id = 0;
export default class Dep { // 用于收集watcher(依赖)，并利用watcher通知更新——watcher通过Dep完成对属性的依赖，从而实现响应式更新
    constructor() {
        this.id = id++; // Dep实例id
        this.watchers = []; // 缓存watcher的内部数组
    }
    addWatcher(watcher) { // 将watcher添加到内部数组中
        this.watchers.push(watcher);
    }
    notify(force) {
        this.watchers.forEach(w => {
            w.update(force);
            // 执行完后清空watcher上缓存的dep实例
            Array.isArray(w.deps) && (w.deps.length = 0);
            w.depIds instanceof Set && w.depIds.clear();
        });
        this.watchers.length = 0; // 执行完后回收空间。
    }
    depend() { // 让栈顶watcher添加当前Dep实例，添加时该Dep又会通过addWatcher将栈顶watcher添加到缓存数组中，从而实现watcher对Dep对应的属性的观测(依赖)。
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
}
const stacks = [];
export function pushTarget(watcher) { // watcher入栈作为Dep.target栈顶watcher，然后初始化组件(劫持属性)时，就可以实现watcher对属性的依赖(观测到属性变化时执行回调)
    Dep.target = watcher;
    stacks.push(watcher);
}
export function popTarget() { // watcher出栈
    stacks.pop();
    Dep.target = stacks[stacks.length - 1];
}