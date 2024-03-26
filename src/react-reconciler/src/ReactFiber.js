
import { HostComponent, HostRoot, HostText, IndeterminateComponent } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags'
/**
 * 
 * @param {*} tag fiber的类型
 * @param {*} pendingProps 新属性 等待处理的属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
    this.tag = tag;
    this.key = key;
    this.type = null;//fiber类型
    //每个虚拟dom=>fiber节点=>真实dom
    this.stateNode = null;//此fiber对应的真实dom节点

    this.return = null;
    this.child = null;
    this.sibling = null;

    //虚拟dom会提供pendingProps属性用来创建fiber节点的属性
    this.pendingProps = pendingProps;//等待生效的属性
    this.memoizedProps = null;//已经生效的属性

    //每个fiber会有自己的状态 每一种fiber状态存的类型是不一样的
    //类组件对应的fiber存的是类的实例的状态，HostRoot存的是要渲染的元素
    this.memoizedState = null;

    //每个fiber身上可能还有更新队列
    this.updateQueue = null;

    //副作用的标识 表示要对此fiber节点进行何种操作
    this.flags = NoFlags;
    //子节点对应的副作用标识
    this.subtreeFlags = NoFlags;
    this.alternate = null;
    this.index = 0;
}
export function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key)
}
export function createHostRootFiber() {
    return createFiber(HostRoot, null, null)
}
/**
 * 基于老的fiber和新的属性创建新的fiber
 * 1. current和workInProgress不是一个对象
 * 2. workInProgress有两种情况
 *  2.1 一种是没有，创建一个新的，互相通过alternate指向
 *  2.2 存在alternate，直接复用老的alternate
 * 复用有两层含义：1. 复用老的fiber对象 2. 复用老的真实dom
 * @param {*} current 老fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
    let workInProgress = current.alternate;
    if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        //更新属性
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
    }
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    return workInProgress;
}
/**
 * 根据虚拟dom创建fiber节点
 * @param {*} element 
 */
export function createFiberFromElement(element) {
    const { type, key, props: pendingProps } = element;
    return createFiberFromTypeAndProps(type, key, pendingProps);
}
export function createFiberFromText(content) {
    return createFiber(HostText, content, null);
}
function createFiberFromTypeAndProps(type, key, pendingProps) {
    let tag = IndeterminateComponent;
    //如果类型type是一个字符串 span div ，说明此fiber类型是一个原生组件
    if (typeof type === 'string') {
        tag = HostComponent;
    }
    const fiber = createFiber(tag, pendingProps, key);
    fiber.type = type;
    return fiber;
}