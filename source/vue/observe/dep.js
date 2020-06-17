let id = 0;
export default class Dep { // 用于收集watcher
    constructor() {
        this.id = id++;
        this.subs = [];
    }
    addSub(watcher) { // 订阅——将watcher添加到内部数组中
        this.subs.push(watcher);
    }
    notify(force) {
        let tmpW;
        this.subs.forEach(w => {
            w.update(force);
            // 执行完后清空watcher上缓存的dep实例
           Array.isArray(w.deps) && (w.deps.length = 0);
           w.depIds instanceof Set && w.depIds.clear();
        });
        this.subs.length = 0; // 执行完后回收空间。
    }
    depend(){
        if(Dep.target){
           Dep.target.addDep(this); 
        }
    }
}
const stacks = [];
export function pushTarget(watcher) {
    Dep.target = watcher;
    stacks.push(watcher);
}
export function popTarget(watcher) {
    stacks.pop();
    Dep.target = stacks[stacks.length - 1];
}