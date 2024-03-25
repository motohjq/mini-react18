import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber';
import { Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';
/**
 * 
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {

    /**
     * 
     * @param {*} returnFiber 根fiber div#root对应的fiber
     * @param {*} currentFirstChild 老的函数组件对应的fiber
     * @param {*} element 老的虚拟dom对象
     * @returns 返回新的第一个子fiber
     */
    function reconcileSingleElement(returnFiber, currentFirstChild, element) {
        function useFiber(fiber, pendingProps) {
            const clone = createWorkInProgress(fiber, pendingProps);
            clone.index = 0;
            clone.sibling = null;
            return clone;
        }
        //新的虚拟dom key，也就是唯一标识
        const key = element.key;//null
        let child = currentFirstChild;
        while (child !== null) {
            //判断此老fiber对应的key和新的虚拟dom对象的key是否一样 null===null
            if (child.key === key) {
                //判断老fiber对应的类型和新虚拟dom元素对应的类型是否相同
                if (child.type === element.type) {
                    //如果key和type都一样，就复用
                    const existing = useFiber(child, element.props);
                    existing.return = returnFiber;
                    return existing;
                }
            }
            child = child.sibling;
        }
        //因为我们是初次挂载，老节点的currentFirstChild为null，所以可以直接根据虚拟dom创建新的Fiber节点
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    /**
     * 设置副作用
     * @param {*} newFiber 
     */
    function placeSingleChild(newFiber) {
        //说明要添加副作用
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            //要在最后的提交阶段插入节点 React渲染=渲染(创建fiber树)+提交(更新真实dom)
            newFiber.flags |= Placement;//或操作之后代表插入
        }
        return newFiber;
    }
    function createChild(returnFiber, newChild) {
        if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
            const created = createFiberFromText(`${newChild}`);
            created.return = returnFiber;
            return created;
        }
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = createFiberFromElement(newChild);
                    created.return = returnFiber;
                    return created;
                }
                default:
                    break;
            }
        }
        return null;
    }
    function placeChild(newFiber, newIdx) {
        newFiber.index = newIdx;
        if (shouldTrackSideEffects) {
            //如果一个fiber它的flags位中有Placement，那么说明此节点需要创建真实dom插入到父容器中
            //如果父fiber节点是初次挂载 shouldTrackSideEffects===false 不需要添加flags
            //这种情况下会在完成阶段把所有的子节点添加到自己身上
            newFiber.flags |= Placement;
        }

    }
    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
        let resultingFirstChild = null;//返回的第一个新儿子
        let previousNewFiber = null;//上一个新fiber
        let newIdx = 0;
        for (; newIdx < newChildren.length; newIdx++) {
            const newFiber = createChild(returnFiber, newChildren[newIdx]);
            if (newFiber === null) continue;
            placeChild(newFiber, newIdx);
            //如果previousNewFiber为null，说明这是第一个fiber
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;//这个newFiber就是大儿子
            } else {
                //说明不是大儿子，把这个newFiber添加上一个子节点后面
                previousNewFiber.sibling = newFiber;
            }
            //让newFiber成为新的previousNewFiber
            previousNewFiber = newFiber;
        }
        return resultingFirstChild;
    }


    /**
     * 比较子fiber DOM-DIFF 就是用老的子fiber链表和新的子虚拟dom进行比较
     * @param {*} returnFiber 新的父fiber
     * @param {*} currentFirstChild 老fiber的第一个子fiber
     * @param {*} newChild 新的子虚拟dom
     */
    function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
        // 暂时只考虑新的节点只有一个的情况
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
                default:
                    break;
            }
        }
        if (isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
        }
        return null;
    }
    return reconcileChildFibers;
}

//有老fiber 更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true);
//没有老fiber 初次挂载的时候用这个
export const mountChildren = createChildReconciler(false);