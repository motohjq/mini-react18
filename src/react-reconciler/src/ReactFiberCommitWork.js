import { insertBefore, appendChild, commitUpdate } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { MutationMask, Placement, Update } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

function recursivelyTraverseMutationEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & MutationMask) {
        let { child } = parentFiber;
        while (child !== null) {
            commitMutationEffectsOnFiber(child, root);
            child = child.sibling;
        }
    }
}

function commitReconciliationEffects(finishedWork) {
    const { flags } = finishedWork;
    //如果此fiber要执行插入操作的话
    if (flags & MutationMask) {
        //进行插入操作，也就是把此fiber对应的真实dom节点添加到父真实dom节点上
        commitPlacement(finishedWork);
        //把flags里的Placement标记去掉
        finishedWork.flags & ~Placement;
    }
}

function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;//div#root
}

/**
 * 找到真实dom节点的父
 * @param {*} fiber 
 */
function getHostParentFiber(fiber) {
    let parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
    parent
}

/**
 * 把子节点对应的真实dom插入到父节点dom中
 * @param {*} node 将要插入的fiber节点
 * @param {*} before 
 * @param {*} parent 父真实dom节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
    const { tag } = node;
    //判断此fiber对应的节点是不是真实dom节点
    const isHost = tag === HostComponent || tag === HostText;
    //如果是的话直接插入
    if (isHost) {
        const { stateNode } = node;
        if (before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendChild(parent, stateNode);
        }
    } else {
        //如果node不是真实dom节点，获取它的大儿子
        const { child } = node;
        if (child !== null) {
            insertOrAppendPlacementNode(child, before, parent);//把大儿子添加到父亲dom节点里
            let { sibling } = child;
            while (sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}

/**
 * 找到要插入的锚点
 * 找到可以插在它前面的那个fiber对应的真实dom
 * @param {*} fiber 
 */
function getHostSibling(fiber) {
    let node = fiber;
    siblings: while (true) {
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) return null;
            node = node.return;
        }
        node = node.sibling;
        //如果弟弟不是原生节点也不是文本节点
        while (node.tag !== HostComponent && node.tag !== HostText) {
            //如果此节点是一个即将要插入的节点，找它的弟弟
            if (node.flags & Placement) {
                continue siblings;
            } else {
                node = node.child;
            }
        }
        if (!(node.flags & Placement)) {
            return node.stateNode;
        }
    }
}

/**
 * 把此fiber的真实dom插入到父dom里
 * @param {*} finishedWork 
 */
function commitPlacement(finishedWork) {
    const parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case HostRoot: {
            const parent = parentFiber.stateNode.containerInfo;
            const before = getHostSibling(finishedWork);//获取最近的弟弟的真实dom节点
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        case HostComponent: {
            const parent = parentFiber.stateNode;
            const before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        default:
            break;
    }
}

/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
    const current = finishedWork.alternate;
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case HostRoot:
        case HostText: {
            //先遍历他们的子节点，处理他们的子节点上的副作用
            recursivelyTraverseMutationEffects(root, finishedWork);
            //再处理自己身上的副作用
            commitReconciliationEffects(finishedWork);
            break;
        }
        case HostComponent: {
            //先遍历他们的子节点，处理他们的子节点上的副作用
            recursivelyTraverseMutationEffects(root, finishedWork);
            //再处理自己身上的副作用
            commitReconciliationEffects(finishedWork);
            //处理dom更新
            if (flags & Update) {
                //获取真实dom
                const instance = finishedWork.stateNode;
                //更新真实dom
                if (instance !== null) {
                    const newProps = finishedWork.memoizedProps;
                    const oldProps = current !== null ? current.memoizedProps : newProps;
                    const type = finishedWork.type;
                    const updatePayload = finishedWork.updateQueue;
                    finishedWork.updateQueue = null;
                    if (updatePayload) {
                        commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                    }
                }
            }
            break;
        }
        default:
            break;
    }
}