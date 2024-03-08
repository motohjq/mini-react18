import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
let workInProgress = null;
/**
 * 计划更新root
 * 源码中此处有一个调度任务的功能
 * @param {*} root 
 */
export function scheduleUpdateOnFiber(root) {
    //确保调度执行root上的更新
    ensureRootIsScheduled(root);
}
function ensureRootIsScheduled(root) {
    //告诉浏览器要执行performConcurrentWorkOnRoot
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root))
}
/**
 * 根据fiber构建fiber树，要创建真实的dom节点插到容器中
 * @param {*} root 
 */
function performConcurrentWorkOnRoot(root) {
    //以同步的方式渲染根节点，初次渲染的时候都是同步
    renderRootSync(root);
}
function prepareFreshStack(root) {
    workInProgress = createWorkInProgress(root.current, null);
    console.log(workInProgress);
}
function renderRootSync(root) {
    //开始构建fiber树
    prepareFreshStack(root);
    workLoopSync();
}
function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }
}
/**
 * 执行一个工作单元
 * @param {*} unitOfWork 
 */
function performUnitOfWork(unitOfWork) {
    //获取新fiber对应的老fiber
    const current = unitOfWork.alternate;
    //完成当前fiber的子fiber链表构建后
    const next = beginWork(current, unitOfWork);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {//如果没有子节点，表示当前的fiber已经完成
        completeUnitOfWork(unitOfWork);
    } else {//如果有子节点 就让子节点成为下一个工作单元
        workInProgress = next;
    }
}

function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;
        //执行此fiber的完成工作 不同类型fiber的完成工作不同
        completeWork(current, completedWork);
        //如果有弟弟 就构建弟弟对应的fiber子链表
        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return
        }
        //如果没有弟弟，说明当前完成的是父fiber的最后一个节点 也就是说一个父fiber的所有子fiber全部完成了
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null);
}