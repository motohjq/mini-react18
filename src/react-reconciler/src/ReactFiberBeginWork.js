import logger, { indent } from "shared/logger";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { processUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildren, reconcileChildFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/ReactDOMHostConfig';

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
function updateHostRoot(current, workInProgress) {
    //需要知道它的子虚拟dom，知道它的儿子的虚拟dom信息
    processUpdateQueue(workInProgress);//workInProgress.memoizedState={element}
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
 * 目标是根据新的虚拟dom构建新的fiber子链表 child sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @returns 
 */
export function beginWork(current, workInProgress) {
    logger(' '.repeat(indent.number) + "beginwork", workInProgress);
    indent.number += 2;
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(current, workInProgress);
        case HostComponent:
            return updateHostComponent(current, workInProgress);
        case HostText:
            return null;
        default:
            return null;
    }
}