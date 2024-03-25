import logger, { indent } from "shared/logger";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import {
    createTextInstance,
    createInstance,
    appendInitialChild,
    finalizeInitialChildren,
    prepareUpdate
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { NoFlags, Update } from "./ReactFiberFlags";

/**
 * 把当前的完成的fiber所有的子节点对应的真实dom兜挂载到自己父parent真实dom上
 * @param {*} parent 当前完成的fiber真实的dom节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
    let node = workInProgress.child;
    while (node) {
        // 如果子节点类型是一个原生节点或者是一个文本节点
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
            //如果第一个儿子不是一个原生节点，说明它可能是一个函数组件
        } else if (node.child !== null) {
            node = node.child;
            continue;
        }
        if (node === workInProgress) return;
        //如果当前的节点没有弟弟
        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) return;
            //回到父节点
            node = node.return;
        }
        node = node.sibling;
    }
}

function markUpdate(workInProgress) {
    workInProgress.flags |= Update;//给当前的fiber添加更新的副作用
}

/**
 * 在fiber(button)的完成阶段准备更新dom
 * @param {*} current button老fiber
 * @param {*} workInProgress button新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(current, workInProgress, type, newProps) {
    const oldProps = current.memoizedProps;//老的属性
    const instance = workInProgress.stateNode;//老的dom节点
    //比较新老属性，收集属性的差异
    const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
    console.log(updatePayload);
    //让原生组件的新fiber更新队列等于[]
    workInProgress.updateQueue = updatePayload;
    if (updatePayload) {
        markUpdate(workInProgress);
    }
}

/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建fiber
 */
export function completeWork(current, workInProgress) {
    indent.number -= 2;
    logger(' '.repeat(indent.number) + "completedWork", workInProgress);
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case HostRoot:
            bubbleProperties(workInProgress);
            break;
        case HostComponent:
            //如果完成的fiber是原生节点 那么就创建真实的dom节点
            const { type } = workInProgress;
            //如果老fiber存在，并且老fiber上真实dom节点，要走节点更新逻辑
            if (current !== null && workInProgress.stateNode !== null) {
                updateHostComponent(current, workInProgress, type, newProps);
            } else {
                const instance = createInstance(type, newProps, workInProgress);
                //把自己所有的儿子都添加到自己身上
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
                finalizeInitialChildren(instance, type, newProps);
            }

            bubbleProperties(workInProgress);
            break;
        case FunctionComponent:
            bubbleProperties(workInProgress);
            break;
        case HostText:
            //如果完成的fiber是文本节点 那么就创建真实的文本节点
            const newText = newProps;
            //创建真实的dom节点并传入stateNode
            workInProgress.stateNode = createTextInstance(newText);
            //向上冒泡属性
            bubbleProperties(workInProgress);
            break;
        default:
            break;
    }
}

function bubbleProperties(completedWork) {
    let subtreeFlags = NoFlags;
    //遍历当前fiber的所有子节点，把所有后代节点的副作用全部合并
    let child = completedWork.child;
    while (child !== null) {
        subtreeFlags |= child.subtreeFlags;//儿子的副作用
        subtreeFlags |= child.flags;
        child = child.sibling;
    }
    completedWork.subtreeFlags = subtreeFlags;
}