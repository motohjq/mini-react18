import logger, { indent } from "shared/logger";
import { FunctionComponent, HostComponent, HostRoot, HostText, IndeterminateComponent } from "./ReactWorkTags";
import { cloneUpdateQueue, processUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildren, reconcileChildFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { renderWithHooks } from './ReactFiberHooks';

/**
 * 根据新的虚拟dom生成新的fiber链表
 * @param {*} current 老的父fiber
 * @param {*} workInProgress 新的父fiber
 * @param {*} nextChildren 新的子虚拟dom
 */
function reconcileChildren(current, workInProgress, nextChildren) {
    //如果没有老fiber，说明要新创建新fiber
    if (current === null) {
        workInProgress.child = mountChildren(workInProgress, null, nextChildren);
    } else {
        //如果有老fiber，需要做DOM-DIFF 拿老的子fiber链表和新的子虚拟dom进行比较 current.child==老的子fiber链表
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
    }
}
function updateHostRoot(current, workInProgress, renderLanes) {
    const nextProps = workInProgress.pendingProps;
    cloneUpdateQueue(current, workInProgress);
    //需要知道它的子虚拟dom，知道它的儿子的虚拟dom信息
    processUpdateQueue(workInProgress, nextProps, renderLanes);//workInProgress.memoizedState={element}
    const nextState = workInProgress.memoizedState;
    //nextChildren就是新的子虚拟dom
    const nextChildren = nextState.element;
    //协调子节点 DOM-DIFF算法
    //根据新的虚拟dom生成子fiber链表
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;//{tag:5,type:'h1'}
}
/**
 * 构建原生组件的子fiber链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 */
function updateHostComponent(current, workInProgress) {
    const { type } = workInProgress;
    const nextProps = workInProgress.pendingProps;
    let nextChildren = nextProps.children;
    //判断当前虚拟dom的儿子是不是只有文本节点
    const isDirectTextChild = shouldSetTextContent(type, nextProps);
    if (isDirectTextChild) {
        nextChildren = null;
    }
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

/**
 * 挂载函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件类型，也就是函数组件的定义
 */
export function mountIndeterminateComponent(current, workInProgress, Component) {
    const props = workInProgress.pendingProps;
    const value = renderWithHooks(current, workInProgress, Component, props);
    workInProgress.tag = FunctionComponent;
    reconcileChildren(current, workInProgress, value);
    return workInProgress.child;
}
export function updateFunctionComponent(current, workInProgress, Component, nextProps) {
    const nextChildren = renderWithHooks(current, workInProgress, Component, nextProps);
    reconcileChildren(current, workInProgress, nextChildren);
    console.log(workInProgress.child, '??????');
    return workInProgress.child;
}
/**
 * 目标是根据新的虚拟dom构建新的fiber子链表 child sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @returns 
 */
export function beginWork(current, workInProgress, renderLanes) {
    logger(' '.repeat(indent.number) + "beginwork", workInProgress);
    indent.number += 2;
    switch (workInProgress.tag) {
        case IndeterminateComponent:
            return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
        case FunctionComponent: {
            const Component = workInProgress.type;
            const nextProps = workInProgress.pendingProps;
            return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
        }
        case HostRoot:
            return updateHostRoot(current, workInProgress, renderLanes);
        case HostComponent:
            return updateHostComponent(current, workInProgress, renderLanes);
        case HostText:
            return null;
        default:
            return null;
    }
}