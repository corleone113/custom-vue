import {pushTarget, popTarget} from './dep';
import {getValue} from '../helper';
let id=0;
export default class Watcher{ // 用于Vue渲染虚拟DOM、实现watch选项/$watch方法、实现计算属性
    /**
     * 
     * @param {*} vm 当前组件实例
     * @param {*} exprOrFn 用户传入的可能时一个键路径字符串或函数(表达式)
     * @param {*} cb 观测到变化时调用的回调函数
     * @param {*} opts 其它一些参数
     */
    constructor(vm, exprOrFn, cb=()=>{}, opts={}){
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if(typeof exprOrFn === 'function'){ // exprOrFn为函数则取其执行结果作为观测的表达式的值
            this.getter = () => exprOrFn.call(vm);
        }else{
            this.getter = function(){
                return getValue(vm, exprOrFn);// 其它情况下exprOrFn应该为键路径字符串，此时根据键路径(比如:'a.b.c')将vm上对应的属性取出来
            }
        }
        this.dirty = this.lazy = opts.lazy; // 如果lazy为true，说明是计算属性。dirty表示观测的组件属性(数据属性/计算属性)/表达式是否发生变化，初始值设置为传入的opts.lazy。
        this.immediate = opts.immediate;
        this.cb= cb; // 观测到属性/表达式变化时执行的回调
        this.opts=opts;
        this.id = id++;
        this.deps = []; // 缓存当前watcher的Dep实例，wathcer通过这个Dep实例实现对组件实例某个属性/表达式的依赖。
        this.depIds= new Set(); // 缓存Dep实例的id
        this.value = this.lazy ? undefined : this.get(); // value属性用于缓存属性/表达式的值。默认情况下watcher初始化时会调用自身get方法求值。如果是计算属性的话初始化时不会调用get获取值
        if(this.immediate){ // 如果选项对象中immediate为true那么立即执行回调
            this.cb(this.value);
        }
    }
    get(){
        pushTarget(this); // watcher入栈(Dep.target栈)
        const value = this.getter(); // 重新获取属性值或计算表达式，从而会访问依赖的vm上的属性，从而注册watcher到属性的Dep实例上——完成对属性观测。
        popTarget(); // 完成观测后出栈。
        return value; // 返回表达式/函数的结果
    }
    update(force){
        if(this.lazy){ // 对于计算属性的watcher，则暂时先不通知更新
            this.dirty = true;
        }else { // 非懒加载模式则进行更新
            this.force = force; // force为true表示强制更新，用于处理数组的变更发起的更新。
            queueWather(this); // 先将当前watcher放入队列中再批量更新
        }
    }
    run(){
        const value = this.get(); // 重新获取属性值或计算表达式
        if(this.value !== value || this.force){ // 观测的属性的值/表达式结果发生变化或需要强制更新则执行回调并更新缓存
            this.force = false;
            this.cb(value, this.value); // 执行观测属性/表达式变化的回调
            this.value = value; // 更新缓存的属性/表达式值
        }
    }
    evaluate(){ // 用于重新计算computed属性
        this.dirty = false; // 重置dirty属性
        this.value = this.get();
    }
    addDep(dep){
        const id = dep.id;
        if(!this.depIds.has(id)){ // 根据id判断该Dep实例是否已经被缓存过，没被缓存过才会进行下面这些操作。
            this.depIds.add(id); // 缓存id
            this.deps.push(dep); // 缓存Dep实例
            dep.addSub(this); // 将该watcher缓存Dep实例内部，之后属性更新时会通过Dep实例通知watcher更新——watcher调用run方法执行回调，从而实现组件视图更新/触发watch回调触发。
        }
    }
    depend(){ // 用于实现Dep.target对当前watcher(计算属性的watcher)的依赖。
        for(let i = this.deps.length-1; i>=0; --i) {
            this.deps[i].depend();
        }
    }
}
const queue = []; // 存放需要调用run方法的watcher的队列
let has = {}; // 判断watcher是否已经添加到queue中
const cbs = [];
function flushCallback(){ // 依次执行缓存的回调，然后清空数组。
    cbs.forEach(cb=>cb());
    cbs.length = 0;
}
function nextTick(cb){ // 延时函数
    cbs.push(cb); // 先将回调放入数组中，待事件循环末尾再依次执行。
    if(queueMicrotask){
        return queueMicrotask(flushCallback);
    }
    if(Promise){ // 优先考虑使用Promise
        return Promise.resolve().then(flushCallback);
    }
    if(MutationObserver){
        const observer = new MutationObserver(flushCallback);
        const textNode = document.createTextNode(1);
        observer.observe(textNode, {characterData: true});
        textNode.textContent = 2;
        return;
    }
    if(setImmediate){
        return setImmediate(flushCallback);
    }
    setTimeout(flushCallback);
}
function flushQueue(){
    // 等待当前watcher全部更新操作完毕时再批量更新
    queue.forEach(w => w.run()); // 依次调用watcher的run方法
    queue.length = 0;// 清空队列
    has = {};// 清空id记录
}
function queueWather(watcher){
    const id = watcher.id;
    if(!has[id]){ // watcher还没有入queue队列才进行后续
        has[id]= true;
        queue.push(watcher);
        // 延迟清空队列
        nextTick(flushQueue);
    }
}