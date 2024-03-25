
const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
/**
 * 从真实的dom节点上获取对应的fiber节点
 * @param {*} targetNode 
 */
export function getClosestInstanceFromNode(targetNode) {
    const targetInst = targetNode[internalInstanceKey];
    if (targetInst) {
        return targetInst;
    }
    return null;
    //如果真实dom没有fiber，就返回null
}

/**
 * 提前缓存fiber节点的实力到dom节点上
 * @param {*} hostInst fiber实例
 * @param {*} node 真实dom
 */
export function precacheFiberNode(hostInst, node) {
    node[internalInstanceKey] = hostInst;
}

export function updateFiberProps(node, props) {
    node[internalPropsKey] = props;
}

export function getFiberCurrentPropsFromNode(node) {
    return node[internalPropsKey] || null;
}
