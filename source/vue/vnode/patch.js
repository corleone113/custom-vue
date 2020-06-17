export function render(vnode, container) {
    const el = createEl(vnode);
    // container.appendChild(el);
    if (container.parentNode) { // 挂载节点有父节点则直接替换挂载节点
        container.parentNode.replaceChild(el, container);
    } else { // 没有父节点则作为子节点附加在挂载节点上
        container.appendChild(el);
    }
}
// 创建真实DOM节点
function createEl(vnode) {
    const {
        tag,
        children,
        key,
        props,
        text
    } = vnode;
    if (typeof tag === 'string') {
        // 标签、一个虚拟DOM节点
        vnode.el = document.createElement(tag);
        updateProps(vnode);
        children.forEach(child => {
            return render(child, vnode.el);
        });
    } else {
        // 文本
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}

function updateProps(vnode, oldProps = {}) {// 暂时只做简单处理。
    const {
        el,
        props: newProps = {}
    } = vnode;
    const newStyle = newProps.style || {};
    const oldStyle = oldProps.style || {};
    for (const key in oldStyle) {
        if (!newStyle[key]) {
            el.style[key] = '';
        }
    }
    // 更新时用新的属性更新节点
    for (const key in oldProps) {
        if (!newProps[key]) {
            delete el[key];
        }
    }
    for (const key in newProps) {
        if (key === 'style') {
            for (const styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName];
            }
        } else if (key === 'class') {
            el.className = newProps.class;
        } else {
            el[key] = newProps[key];
        }
    }
}
export function patch(oldVnode, newVnode) { // 比对新旧节点
    // 先比对标签名是否一致
    if (oldVnode.tag !== newVnode.tag) { // 不一样则直接替换
        oldVnode.el.parentNode.replaceChild(createEl(newVnode), oldVnode.el);
    }
    // 如果是文本节点，那么比较文本内容是否一致
    if (!oldVnode.tag) {
        if (oldVnode.text !== newVnode.text) { // 不一样则直接更新文本内容
            oldVnode.el.textContent = newVnode.text;
        }
    }
    // 标签一样，则复用旧DOM节点
    const el = newVnode.el = oldVnode.el;
    // 先更新attribute
    updateProps(newVnode, oldVnode.props);
    // 比较子节点
    const oldChildren = oldVnode.children || [],
        newChildren = newVnode.children || [];
    if (oldChildren.length > 0 && newChildren.length > 0) {
        updateChildren(el, oldChildren, newChildren); // 新旧子节点数组都不为空则需要进一步进行diff比对。
    } else if (oldChildren.length > 0) { // 子节点被全清了则清空节点的内容
        el.innerHTML = '';
    } else if (newChildren.length > 0) { // 全是新子节点则依次附加到节点上
        for (const child of newChildren) {
            el.appendChild(createEl(child));
        }
    }
    return el;
}

function updateChildren(parent, oldChildren, newChildren) {
    let oldStartIndex = 0,
        oldStartVnode = oldChildren[oldStartIndex];
    let oldEndIndex = oldChildren.length - 1,
        oldEndVnode = oldChildren[oldEndIndex];

    const map = makeIndexByKey(oldChildren);

    let newStartIndex = 0,
        newStartVnode = newChildren[newStartIndex]; // 新的开始索引和开始节点
    let newEndIndex = newChildren.length - 1,
        newEndVnode = newChildren[newEndIndex];
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
            oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {// 新旧头节点一样时
            patch(oldStartVnode, newStartVnode); // 比对这两个节点
            oldStartVnode = oldChildren[++oldStartIndex]; // 新旧头指针向后移动一位
            newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) { // 新旧尾节点一样时
            patch(oldEndVnode, newEndVnode); // 比对这两个节点。
            oldEndVnode = oldChildren[--oldEndIndex]; // 新旧尾指针向前移动一位
            newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 新尾节点和旧头节点一样时
            patch(oldStartVnode, newEndVnode); // 比对这两个节点
            parentInsert(parent, oldStartVnode.el, oldEndVnode.el.nextSibling); // 将旧头节点移动到尾部
            oldStartVnode = oldChildren[++oldStartIndex]; // 旧头指针向后移动一位
            newEndVnode = newChildren[--newEndIndex]; // 新尾指针向前移动一位
        } else if (isSameVnode(oldEndVnode, newStartVnode)) { // 新头节点和旧尾节点一样时
            patch(oldEndVnode, newStartVnode); // 比对这两个节点
            parentInsert(parent, oldEndVnode.el, oldStartVnode.el); // 将旧尾节点移动到头部
            oldEndVnode = oldChildren[--oldEndIndex]; // 旧尾指针向前移动一位
            newStartVnode = newChildren[++newStartIndex]; // 新头指针向后移动一位
        } else { // 以上四种情况之外的情况——两个子节点列表发生乱序，且存在不能复用的情况
            const moveIndex = map[newStartVnode.key]; // 用新头节点的key在旧节点map中查询是否有相同(可复用)的节点，找到则保存其索引。
            if (moveIndex == undefined) {// 没有找到则在旧头节点之前插入新头节点。
                parentInsert(parent, createEl(newStartVnode), oldStartVnode.el);
            } else {
                const moveNode = oldChildren[moveIndex]; // 找到了则获取对应旧节点。
                oldChildren[moveIndex] = undefined; // 保存变量后将该索引的旧节点置为undefined。
                parentInsert(parent, moveNode.el, oldStartVnode.el); // 将找到的旧节点移动到旧头节点之前
                patch(moveNode, newStartVnode); // 比对新旧节点。
            }
            newStartVnode = newChildren[++newStartIndex];// 这种情况下之移动新头指针。
        }
    }
    if (newStartIndex <= newEndIndex) { // 最后还剩余新节点的话，将新节点插入到DOM中
        for (let i = newStartIndex; i <= newEndIndex; ++i) {
            const ele = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el; // 新尾指针的下个位置指向若为null那么表示应该在尾部插入新节点，否则这个位置就是指向真实DOM节点的第一个子节点，此时应该插入到它之前。
            parentInsert(parent, createEl(newChildren[i]), ele);
        }
    }

    if (oldStartIndex <= oldEndIndex) { // 最后还存在旧节点的话则直接移除。
        for (let i = oldStartIndex; i <= oldEndIndex; ++i) {
            const child = oldChildren[i];
            if (child != undefined) {
                parent.removeChild(child.el);
            }
        }
    }
}

function parentInsert(el, newChild, oldChild) {
    if (newChild !== oldChild) { // 避免无用的移动
        el.insertBefore(newChild, oldChild)
    }
}

function isSameVnode(oldVnode, newVnode) {
    return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key);
}

function makeIndexByKey(children) { // 根据旧子节点数组生成节点key到索引的映射map。
    const map = {};
    children.forEach((item, index) => {
        map[item.key] = index;
    });
    return map;
}