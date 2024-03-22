import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheticMouseEvent } from '../SyntheticEvent';

/**
 * 把要执行回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 派发队列，里面放置我们的监听函数
 * @param {*} domEventName dom事件名 click
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件系统标题 0冒泡 4捕获
 * @param {*} targetContainer 目标容器
 */
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    const reactName = topLevelEventsToReactNames.get(domEventName);//click=>onClick
    let SyntheticEventCtor;//合成事件的构造函数
    switch (domEventName) {
        case 'click':
            SyntheticEventCtor = SyntheticMouseEvent;
            break;
        default:
            break;
    }
    const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;//是否是捕获阶段
    const listeners = accumulateSinglePhaseListeners(
        targetInst,
        reactName,
        nativeEvent.type,
        isCapturePhase,
    )
    //如果有要执行的监听函数 [onClickCapture,onClickCapture]=[ChildCapture,ParentCapture]
    if (listeners.length > 0) {
        const event = new SyntheticEventCtor(reactName, domEventName, null, nativeEvent, nativeEventTarget);
        dispatchQueue.push({
            event,
            listeners,
        })
    }
}

export { registerSimpleEvents as registerEvents };
export { extractEvents as extractEvents };