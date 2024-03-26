import { setInitialProperties, diffProperties, updateProperties } from './ReactDOMComponent';
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree';
export function shouldSetTextContent(type, props) {
    return typeof props.children === 'string' || typeof props.children === 'number';
}

export function createTextInstance(content) {
    return document.createTextNode(content);
}

/**
 * 在原生组件初次挂载的时候，会通过此方法创建真实dom
 * @param {*} type 类型span
 * @param {*} props 属性
 * @param {*} internalInstanceHandle 它对应的fiber
 * @returns 
 */
export function createInstance(type, props, internalInstanceHandle) {
    const domElement = document.createElement(type);
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props)
    return domElement;
}

export function appendInitialChild(parent, child) {
    parent.appendChild(child);
}

export function finalizeInitialChildren(domElement, type, props) {
    setInitialProperties(domElement, type, props);
}

export function appendChild(parentInstance, child) {
    parentInstance.appendChild(child);
}
/**
 * 
 * @param {*} parentInstance 父dom节点
 * @param {*} child 子dom节点
 * @param {*} beforeChild 插入到谁的前面，也是一个dom节点
 */
export function insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
}

export function prepareUpdate(domElement, type, oldProps, newProps) {
    return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
    updateProperties(domElement, updatePayload, type, oldProps, newProps);
    updateFiberProps(domElement, newProps);
}

export function removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
}

