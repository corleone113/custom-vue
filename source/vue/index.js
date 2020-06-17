import {
    initState
} from './observe';
import Watcher from './observe/watcher';
import {query} from './helper'
import {createElement, render, patch} from './vnode'

function Vue(options) {
    this._init(options);
}
Vue.prototype._init = function (options) {
    // vue中的初始化方法
    const vm = this;
    vm.$options = options;
    initState(vm);

    // 开始挂载
    if (vm.$options.el) {
        vm.$mount();
    }
}
Vue.prototype._update = function(vnode){
    // 利用传入的数据去更新视图
    const vm = this;
    const el = vm.$el;
    const preVnode = vm.preVnode;
    if(!preVnode){ // 初次渲染
        render(vnode, el);
    } else { // 非首次渲染则比对新旧节点
        vm.$el = patch(preVnode, vnode);
    }
    vm.preVnode = vnode; //将上一次的节点保存起来
}
Vue.prototype._render = function(){
    const vm = this;
    const {render} = vm.$options;
    return render.call(vm, createElement);
};
Vue.prototype.$mount = function () {
    const vm = this
    let { el } = vm.$options;
    el = vm.$el = query(el);
    // 渲染时通过watcher进行
    // 渲染watcher
    const updateComponent = ()=>{ // 更新组件、渲染虚拟DOM
        vm._update(vm._render()); // 更新组件
    }
    new Watcher(vm, updateComponent); // 渲染watcher，默认会调用updateComopnent这个方法。
}
Vue.prototype.$watch = function(expr, handler, opts){
    new Watcher(this, expr, handler, opts);
}
export default Vue;