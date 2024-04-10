import ReactSharedInternals from "shared/ReactSharedInternals";
import { requestUpdateLane, scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import { Passive as PassiveEffect, Update as UpdateEffect } from './ReactFiberFlags';
import { HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout } from './ReactHookEffectTags';
import { NoLane, NoLanes } from "./ReactFiberLane";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

const HooksDispatcherOnMount = {
    useReducer: mountReducer,
    useState: mountState,
    useEffect: mountEffect,
    useLayoutEffect: mountLayoutEffect
}
const HooksDispatcherOnUpdate = {
    useReducer: updateReducer,
    useState: updateState,
    useEffect: updateEffect,
    useLayoutEffect: updateLayoutEffect
}

function mountLayoutEffect(create, deps) {
    return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateLayoutEffect(create, deps) {
    return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateEffect(create, deps) {
    return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy;
    //上一个老hook
    if (currentHook !== null) {
        // 获取此useEffect这个hook上的老effect对象 create deps distroy
        const prevEffect = currentHook.memoizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            const prevDeps = prevEffect.deps;
            //用新数组和老数组进行对比 如果一样的话
            if (areHooInputsEqual(nextDeps, prevDeps)) {
                //不管要不要重新执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue中
                hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
                return;
            }
        }
    }
    //如果要执行的话 需要修改fiber的flags
    currentlyRenderingFiber.flags |= fiberFlags;
    //如果要执行的话 添加HookHasEffect flag
    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps);
}

function areHooInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) return null;
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(prevDeps[i], nextDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}

function mountEffect(create, deps) {
    return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    //给当前的函数组件fiber添加flags
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);
}

/**
 * 添加effect链表
 * @param {*} tag effect标签 
 * @param {*} create 创建方法
 * @param {*} destroy 销毁方法
 * @param {*} deps 依赖数组
 */
function pushEffect(tag, create, destroy, deps) {
    const effect = {
        tag,
        create,
        destroy,
        deps,
        next: null
    }
    let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}

function createFunctionComponentUpdateQueue() {
    return {
        lastEffect: null
    }
}

function baseStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
}

function updateState(initialState) {
    return updateReducer(baseStateReducer, initialState);
}

/**
 * hook的属性
 * memoizedState 当前hook真正显示出来的状态
 * baseState 第一个跳过的更新之前的状态
 * lastRenderedState 上一个计算的状态
 */
function mountState(initialState) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = hook.baseState = initialState;
    const queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: baseStateReducer,//上一个reducer
        lastRenderedState: initialState,//上一个state
    }
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}
function dispatchSetState(fiber, queue, action) {
    // 获取当前的更新赛道 1
    const lane = requestUpdateLane()
    const update = {
        lane, //本次更新优先级就是1
        action,
        hasEagerState: false, //是否有急切的更新
        eagerState: null, //急切的更新状态
        next: null,
    }
    const alternate = fiber.alternate
    //当你派发动作后，我立刻用上一次的状态和上一次的reducer计算新状态
    if (
        fiber.lanes === NoLanes &&
        (alternate === null || alternate.lanes == NoLanes)
    ) {
        //先获取队列上的老的状态和老的reducer
        const { lastRenderedReducer, lastRenderedState } = queue
        //使用上次的状态和上次的reducer结合本次action进行计算新状态
        const eagerState = lastRenderedReducer(lastRenderedState, action)
        update.hasEagerState = true
        update.eagerState = eagerState
        if (Object.is(eagerState, lastRenderedState)) {
            return
        }
    }
    //下面是真正的入队更新，并调度更新逻辑
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane)
    scheduleUpdateOnFiber(root, fiber, lane)
}

/**
 * 构建新的hooks
 */
function updateWorkInProgressHook() {
    //获取将要构建的新的hook的老hook
    if (currentHook === null) {
        const current = currentlyRenderingFiber.alternate;
        currentHook = current.memoizedState;
    } else {
        currentHook = currentHook.next;
    }
    //根据老hook创建新hook
    const newHook = {
        memoizedState: currentHook.memoizedState,
        queue: currentHook.queue,
        next: null
    }
    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
        workInProgressHook = workInProgressHook.next = newHook;
    }
    return workInProgressHook;
}

function updateReducer(reducer) {
    //获取新的hook
    const hook = updateWorkInProgressHook();
    console.log(hook, '?????');
    //获取新的hook的更新队列
    const queue = hook.queue;
    //获取老的hook
    const current = currentHook;
    //获取将要生效的更新队列
    const pendingQueue = queue.pending;
    //初始化一个新状态，取值为当前的状态
    let newState = current.memoizedState;
    if (pendingQueue !== null) {
        queue.pending = null;
        const firstUpdate = pendingQueue.next;
        let update = firstUpdate;
        do {
            if (update.hasEagerState) {
                newState = update.eagerState;
            } else {
                const action = update.action;
                newState = reducer(newState, action);
            }
            update = update.next;
        } while (update !== null && update !== firstUpdate);
    }
    //计算好新的状态后，不但要改变hook的状态，也要改变hook上队列的lastRenderedState
    hook.memoizedState = queue.lastRenderedState = newState;
    return [hook.memoizedState, queue.dispatch];
}

function mountReducer(reducer, initialArg) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = initialArg;
    const queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialArg,
    }
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}
/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
    //在每个hook里会存放一个更新队列，更新队列是一个更新对象的循环链表
    const update = {
        action,//{type:'add',payload:1} 派发的动作
        next: null//指向下一个更新对象
    }
    //把当前最新的更新添加更新队列中，并且返回当前的根fiber
    const root = enqueueConcurrentHookUpdate(fiber, queue, update);
    scheduleUpdateOnFiber(root);
}

/**
 * 挂载构建中的hook
 */
function mountWorkInProgressHook() {
    const hook = {
        memoizedState: null,//hook的状态 0
        queue: null,//存放本hook的更新队列 多次执行同一个setHook queue.pending=update的循环链表
        next: null//指向下一个hook，函数里可以有很多hook，它们会组成一个单向链表
    };
    if (workInProgressHook === null) {
        //当前函数组件对应的fiber的状态等于第一个hook对象
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟dom或者react元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
    currentlyRenderingFiber = workInProgress;//Function组件对应的fiber
    workInProgress.updateQueue = null;
    //如果有老的fiber，并且有老的hook链表
    if (current !== null && current.memoizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
    } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMount;
    }


    //需要在函数组件执行前给ReactCurrentDispatcher.current赋值
    const children = Component(props);
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    return children;
}