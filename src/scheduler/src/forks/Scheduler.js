import { peek, pop, push } from './SchedulerMinHeap';
import { ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority, IdlePriority } from './SchedulerPriority';

function getCurrentTime() {
    return performance.now();
}

const maxSigned31BitInt = 1073741823;
//立刻过期
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
//正常优先级的过期时间
const NORMAL_PRIORITY_TIMEOUT = 5000;
//低优先级过期时间
const LOW_PRIORITY_TIMEOUT = 10000;
//永不过期
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

//任务ID计数器
let taskIdCounter = 1;
//任务最小堆
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;
//每一帧向浏览器申请5ms用于自己任务执行
//如果5ms没有完成，react会放弃控制权，交还给浏览器
const frameInterval = 5;

const channel = new MessageChannel();
const port1 = channel.port1;
const port2 = channel.port2;
port1.onmessage = performWorkUntilDeadline;

/**
 * 按优先级执行任务
 * @param {*} priorityLevel 
 * @param {*} callback 
 */
function scheduleCallback(priorityLevel, callback) {
    //获取当前的时间
    const currentTime = getCurrentTime();
    //此任务的开始时间
    const startTime = currentTime;
    //超时时间
    let timeout;
    switch (priorityLevel) {
        case ImmediatePriority:
            timeout = IMMEDIATE_PRIORITY_TIMEOUT;
            break;
        case UserBlockingPriority:
            timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
            break;
        case IdlePriority:
            timeout = IDLE_PRIORITY_TIMEOUT;
            break;
        case LowPriority:
            timeout = LOW_PRIORITY_TIMEOUT;
            break;
        case NormalPriority:
        default:
            timeout = NORMAL_PRIORITY_TIMEOUT;
            break;
    }
    //计算此任务的过期时间
    const expirationTime = startTime + timeout;
    const newTask = {
        id: taskIdCounter++,
        callback,//回调函数
        priorityLevel,//优先级
        startTime,//开始时间
        expirationTime,//过期时间
        sortIndex: expirationTime,//排序依赖
    }
    //向任务最小堆里添加任务，排序的依据是过期时间
    push(taskQueue, newTask);
    //flushWork执行工作，刷新工作，执行任务
    requestHostCallback(workLoop);
    return newTask;
}

function shouldYieldToHost() {
    //用当前时间减去开始的时间就是过去的时间
    const timeElapsed = getCurrentTime() - startTime;
    //如果流逝或者经过的时间小于5ms，那就不需要放弃执行
    if (timeElapsed < frameInterval) {
        return false;
    }
    //5ms用光了，需要放弃执行
    return true;
}

/**
 * 开始执行任务队列中的任务
 * @param {*} startTime 
 */
function workLoop(startTime) {
    let currentTime = startTime;
    //取出优先级最高的任务
    currentTask = peek(taskQueue);
    while (currentTask !== null) {
        //如果此任务的过期时间小于当前时间，就是说没有过期，并且需要放弃执行（时间片到期）
        if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            //跳出工作循环
            break;
        }
        //取出当前的任务中的回调函数
        const callback = currentTask.callback;
        if (typeof callback === 'function') {
            currentTask.callback = null;
            //执行工作，如果返回新的函数，表示当前的工作没有完成
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            const continuationCallback = callback(didUserCallbackTimeout);
            if (typeof continuationCallback === 'function') {
                currentTask.callback = continuationCallback;
                return true;//还有任务要执行
            }
            //如果此任务已经完成，则不需要再继续执行，把此任务弹出
            if (currentTask === peek(taskQueue)) {
                pop(taskQueue);
            }
        } else {
            pop(taskQueue);
        }
        //如果当前的任务执行完了，或者当前任务不合法，取出下一个任务执行
        currentTask = peek(taskQueue);
    }
    //如果循环结束还有未完成的任务
    if (currentTask !== null) {
        return true;
    }
    //没有任何要完成的任务
    return false;
}

function requestHostCallback(workLoop) {
    //先缓存回调函数
    scheduleHostCallback = workLoop;
    //执行工作直到截止时间
    schedulePerformWorkUntilDeadline();
}
function schedulePerformWorkUntilDeadline() {
    port2.postMessage(null);
}
function performWorkUntilDeadline() {
    if (scheduleHostCallback) {
        //先获取开始执行任务的时间
        //表示时间片的开始
        startTime = getCurrentTime();
        //是否有更多的工作要做
        let hasMoreWork = true;
        try {
            //执行flushWork，并判断有没有返回值
            hasMoreWork = scheduleHostCallback(startTime);
        } finally {
            //执行完以后如果为true，说明还有更多工作要做
            if (hasMoreWork) {
                //继续执行
                schedulePerformWorkUntilDeadline();
            } else {
                scheduleHostCallback = null;
            }
        }
    }
}

export {
    scheduleCallback as unstable_scheduleCallback,
    shouldYieldToHost as shouldYield,
    ImmediatePriority as unstable_ImmediatePriority,
    UserBlockingPriority as unstable_UserBlockingPriority,
    NormalPriority as unstable_NormalPriority,
    LowPriority as unstable_LowPriority,
    IdlePriority as unstable_IdlePriority,
}