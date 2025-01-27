import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { scheduleUpdateOnFiber, requestUpdateLane, requestEventTime } from './ReactFiberWorkLoop';

export function createContainer(containerInfo) {
    return createFiberRoot(containerInfo);
}
/**
 * 更新容器 把虚拟dom element变成真实dom插入到container容器中
 * @param {*} element 虚拟dom
 * @param {*} container dom容器 FiberRootNode containerInfo div#root
 */
export function updateContainer(element, container) {
    //获取当前的根fiber
    const current = container.current;
    const eventTime = requestEventTime();
    //请求一个更新车道 16
    const lane = requestUpdateLane(current);
    //创建更新
    const update = createUpdate(lane);
    //要更新的虚拟dom
    update.payload = { element };// h1
    //把此更新对象添加到current这个根fiber的更新队列上
    const root = enqueueUpdate(current, update, lane); // 这里返回的root是FiberRootNode
    scheduleUpdateOnFiber(root, current, lane, eventTime);
}