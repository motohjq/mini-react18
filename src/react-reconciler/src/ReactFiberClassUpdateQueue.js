import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
    //创建一个新的更新队列
    //pending其实是一个循环链表
    const queue = {
        shared: {
            pending: null
        }
    }
    fiber.updateQueue = queue;
}

export function createUpdate() {
    const update = { tag: UpdateState };
    return update;
}
export function enqueueUpdate(fiber, update) {
    //更新队列的pending指向当前更新
    const updateQueue = fiber.updateQueue;
    const pending = updateQueue.shared.pending;
    if (pending === null) {
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    // pending要指向最后一个更新，最后一个更新的next指向第一个更新 是个单向循环链表
    // 返回根节点 从当前的fiber向上冒泡到根节点
    updateQueue.shared.pending = update;
    return markUpdateLaneFromFiberToRoot(fiber);
}
/**
 * 根据老状态和更新队列中的更新计算最新状态
 * @param {*} workInProgress 要计算的fiber
 */

export function processUpdateQueue(workInProgress) {
    const queue = workInProgress.updateQueue;
    const pendingQueue = queue.shared.pending;
    //如果有更新 或者说更新队列里有内容
    if (pendingQueue !== null) {
        //清楚等待生效的更新
        queue.shared.pending = null;
        //获取更新队列中最后一个更新 update={payload:{element:'h1'}}
        const lastPendingUpdate = pendingQueue;
        //指向第一个更新
        const firstPendingUpdate = lastPendingUpdate.next;
        //把更新链表剪开，变成单链表
        lastPendingUpdate.next = null;
        //获取老状态
        let newState = workInProgress.memoizedState;//这时候newState是老状态
        let update = firstPendingUpdate;
        while (update) {
            //根据老状态和更新计算新状态 并赋值给newState
            newState = getStateFromUpdate(update, newState);
            update = update.next;
        }
        //把最终计算道德状态赋值给memoizedState
        workInProgress.memoizedState = newState;
    }
}
/**
 * 根据老状态和更新计算新状态
 * @param {*} update 更新的对象其实有很多种类型
 * @param {*} prevState 
 */
function getStateFromUpdate(update, prevState) {
    switch (update.tag) {
        case UpdateState:
            const { payload } = update;
            return assign({}, prevState, payload)
    }
}