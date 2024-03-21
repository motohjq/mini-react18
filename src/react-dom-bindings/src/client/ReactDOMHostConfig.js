import { setInitialProperties } from './ReactDOMComponent';
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree';
export function shouldSetTextContent(type, props) {
    return typeof props.children === 'string' || typeof props.children === 'number';
}

export function createTextInstance(content) {
    return document.createTextNode(content);
}

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