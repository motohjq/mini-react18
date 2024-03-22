import { registerTwoPhaseEvent } from './EventRegistry';

const simpleEventPluginEvents = ['click'];
export const topLevelEventsToReactNames = new Map();

function registerSimpleEvent(domEventName, reactName) {
    //把原生事件名和处理函数的名字进行映射或者绑定，click->onClick
    topLevelEventsToReactNames.set(domEventName, reactName);
    registerTwoPhaseEvent(reactName, [domEventName]);//onClick ['click'] 注册冒泡和捕获的回调
}

export function registerSimpleEvents() {
    for (let i = 0; i < simpleEventPluginEvents.length; i++) {
        const eventName = simpleEventPluginEvents[i];//click
        const domEventName = eventName.toLowerCase();//click
        const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);//Click
        registerSimpleEvent(domEventName, `on${capitalizeEvent}`);//click onClick
    }
}