import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue'
function FiberRootNode(containerInfo) {// div #root
    this.containerInfo = containerInfo;
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