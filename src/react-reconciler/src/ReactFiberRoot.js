import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue';
import { NoLane, NoLanes } from './ReactFiberLane';
function FiberRootNode(containerInfo) {// div #root
    this.containerInfo = containerInfo;
    //表示此根上有哪些赛道等待被处理
    this.pendingLanes = NoLanes;
    this.callbackNode = null;
    this.callbackPriority = NoLane;
}

export function createFiberRoot(containerInfo) {
    const root = new FiberRootNode(containerInfo);
    const uninitializedFiber = createHostRootFiber();//创建根fiber HostRoot指的是根节点div #root 不需要传参 stateNode指向了#root
    // 根容器的current指向当前的根fiber
    root.current = uninitializedFiber;
    // 根fiber的stateNode指向真实dom节点root
    uninitializedFiber.stateNode = root;
    initialUpdateQueue(uninitializedFiber);
    return root;
}