import { HostRoot } from "./ReactWorkTags";

const concurrentQueue = [];
let concurrentQueuesIndex = 0;

export function finishQueueingConcurrentUpdates() {
    const endIndex = concurrentQueuesIndex;//9
    concurrentQueuesIndex = 0;
    let i = 0;
    while (i < endIndex) {
        const fiber = concurrentQueue[i++];// 0 3 6
        const queue = concurrentQueue[i++];// 1 4 7
        const update = concurrentQueue[i++];//2 5 8
        if (queue !== null && update !== null) {
            const pending = queue.pending;
            if (pending === null) {
                update.next = update;
            } else {
                update.next = pending.next;
                pending.next = update;
            }
            queue.pending = update;
        }
    }
}

/**
 * 把更新对象添加到更新队列中
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
    enqueueUpdate(fiber, queue, update);
    return getRootForUpdatedFiber(fiber);
}
function getRootForUpdatedFiber(sourceFiber) {
    let node = sourceFiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }
    return node.tag === HostRoot ? node.stateNode : null;//FiberRootNode div#root
}
/**
 * 把更新先缓存到concurrentQueue中
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
function enqueueUpdate(fiber, queue, update) {
    //012 setNumber1 345 setNumber2 678 setNumber3
    concurrentQueue[concurrentQueuesIndex++] = fiber;//0 函数组件对应fiber
    concurrentQueue[concurrentQueuesIndex++] = queue;//1 要更新的hook对应的更新队列
    concurrentQueue[concurrentQueuesIndex++] = update;//2 更新对象
    //执行完concurrentQueuesIndex是 3 6 9
}

/**
 * 本来此文件要处理更新优先级的问题
 * 目前现在只实现向上找到根节点
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
    let node = sourceFiber;//当前fiber
    let parent = sourceFiber.return;//当前fiber的父节点
    while (parent !== null) {
        node = parent;
        parent = parent.parent;
    }
    //一直找到parent为null
    if (node.tag === HostRoot) {
        return node.stateNode
    }
    return null;
}