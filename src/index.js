import Vue from 'vue';
const renderLis = (h, lis) => lis.map(({
    background,
    key
}) => {
    return h('li', {
        style: {
            background
        },
        key
    }, key);
});
const vm = new Vue({
    el: '#app',
    render(h) { // 内部调用此render方法，将render方法中的this变为当前Vue实例
        return h('div', {
                id: 'app'
            },
            h('p', {}, 'message:' + this.msg),
            h('p', {}, 'computed:' + this.msg_obb_name),
            h('p', {}, 'arr:' + this.arr),
            h('ul', {}, ...renderLis(h, this.lis)));
    },
    data() {
        return {
            msg: 'corleone',
            arr: [1, 2, 4, {
                    address: 'chengdu'
                },
                [11, 22, 33,[23, [34]]]
            ],
            obb: {
                name: 'lifu',
            },
            lis: [{
                background: 'red',
                key: 'a'
            }, {
                background: 'yellow',
                key: 'b'
            }, {
                background: 'blue',
                key: 'c'
            }, {
                background: 'pink',
                key: 'd'
            }, ]
        }
    },
    computed: {
        msg_obb_name() {
            return this.msg + this.obb.name;
        }
    },
    watch: {
        msg: {
            handler(newVal) {
                console.log('msg changed the new value:', newVal);
            },
            immediate: true,
        },
        arr(newVal) {
            console.log('the arr changed:', newVal);
        }
    }
})
setTimeout(() => {
    // vm.msg = 'adfadf';
    // vm.msg = 'fdsadf';
    // vm.msg = 'adsfdsadf';
    vm.msg = 'corleone xiao';
    vm.arr.push(5);
    vm.arr[4][3][1].push(55);
    // console.log('arr:', vm.arr);
}, 1000);
setTimeout(() => {
    // vm.lis = [{
    //     background: 'green',
    //     key: 'f'
    // }, {
    //     background: 'red',
    //     key: 'd'
    // }, {
    //     background: 'yellow',
    //     key: 'c'
    // }, {
    //     background: 'blue',
    //     key: 'a'
    // }, {
    //     background: 'pink',
    //     key: 'b'
    // }, {
    //     background: 'purple',
    //     key: 'e',
    // }]
    vm.lis = [{
        background: 'green',
        key: 'f'
    },{
        background: 'indianred',
        key: 'e'
    },{
        background: 'red',
        key: 'a'
    }, {
        background: 'yellow',
        key: 'b'
    }, {
        background: 'blue',
        key: 'c'
    }, {
        background: 'pink',
        key: 'd'
    }, ]
}, 2000);
if(module.hot && process.env.NODE_ENV !== 'production'){
    module.hot.accept();
}