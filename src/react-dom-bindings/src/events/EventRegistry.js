export const allNativeEvents = new Set();

/**
 * 注册两个阶段的事件
 * 当在页面中触发事件的时候，会走事件处理函数
 * 事件处理函数需要找到dom元素对应的要执行的react事件
 * @param {*} registrationName react事件名 onClick
 * @param {*} dependencies 原生事件数组 ['click']
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
    //注册冒泡事件的对应关系
    registerDirectEvent(registrationName, dependencies);
    //注册捕获事件的对应关系
    registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(registrationName, dependencies) {
    for (let i = 0; i < dependencies.length; i++) {
        allNativeEvents.add(dependencies[i]);//click
    }
}

