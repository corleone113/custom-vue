import {pushTarget, popTarget} from './dep';
import {getValue} from '../helper';
let id=0;
export default class Watcher{ // 用于Vue渲染虚拟DOM、实现watch选项/$watch方法、实现计算属性
    /**
     * 
     * @param {*} vm 当前组件实例
     * @param {*} exprOrFn 用户传入的可能时一个表达式或函数
     * @param {*} cb 监控到变化时调用的回调函数
     * @param {*} opts 其它一些参数
     */
    constructor(vm, exprOrFn, cb=()=>{}, opts={}){
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if(typeof exprOrFn === 'function'){
            this.getter = () => exprOrFn.call(vm);
        }else{
            this.getter = function(){
                return getValue(vm, exprOrFn);// 将vm上对应的属性取出来
            }
        }
        this.dirty = this.lazy = opts.lazy; // 如果lazy为true，说明是计算属性。dirty表示监听的值是否发生变化。
        this.immediate = opts.immediate;
        this.cb= cb;
        this.opts=opts;
        this.id = id++;
        this.deps = [];
        this.depIds= new Set();
        this.value = this.lazy ? undefined : this.get(); // 默认创建一个watcher 调用自身get方法。如果是计算属性的话初始化时不会调用get获取值
        if(this.immediate){
            this.cb(this.value);
        }
    }
    get(){
        pushTarget(this); // watcher入栈(Dep.target栈)
        const value = this.getter(); // 执行表达式或函数，然后会访问依赖的表达式/函数的值对应的vm上的属性，从而注册watcher到对应属性的Dep实例上——完成对属性观测。
        popTarget(); // 完成观测后出栈。
        return value; // 返回表达式/函数的结果
    }
    update(force){
        if(this.lazy){
            this.dirty = true;
        }else { // 非懒加载模式则进行响应式更新
            this.force = force; // force为true表示强制更新。
            queueWather(this);
        }
    }
    run(){
        const value = this.get();
        if(this.value !== value || this.force){
            this.force = false;
            this.cb(value, this.value);
            this.value = value;
        }
    }
    evaluate(){
        this.dirty = false;
        this.value = this.get();
    }
    addDep(dep){
        const id = dep.id; // 取出id进行判断。
        if(!this.depIds.has(id)){
            this.depIds.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }
    depend(){ // 用于Dep.target栈顶watcher观测计算属性依赖的vm属性。
        for(let i = this.deps.length-1; i>=0; --i) {
            this.deps[i].depend();
        }
    }
}
let has = {}
const queue = [];
const cbs = [];
function flushCallback(){
    cbs.forEach(cb=>cb());
    cbs.length = 0;
}
function nextTick(cb){
    cbs.push(cb);
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
    queue.forEach(w => w.run());
    queue.length = 0;// 清空队列
    has = {};// 清空id记录
}
function queueWather(watcher){
    const id = watcher.id;
    if(!has[id]){
        has[id]= true;
        queue.push(watcher);
        // 延迟清空队列
        nextTick(flushQueue);
    }
}