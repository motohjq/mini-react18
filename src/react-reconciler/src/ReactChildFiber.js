import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber';
import { Placement, ChildDeletion } from './ReactFiberFlags';
import isArray from 'shared/isArray';
import { HostText } from './ReactWorkTags';
/**
 * 
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
    function useFiber(fiber, pendingProps) {
        const clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
    }

    function deleteChild(returnFiber, childToDelete) {
        if (!shouldTrackSideEffects) return;
        const deletions = returnFiber.deletions;
        if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
        } else {
            returnFiber.deletions.push(childToDelete);
        }
    }

    //删除从currentFirstChild开始的之后所有fiber节点
    function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) return;
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
        return null;
    }


    /**
     * 
     * @param {*} returnFiber 根fiber div#root对应的fiber
     * @param {*} currentFirstChild 老的函数组件对应的fiber
     * @param {*} element 老的虚拟dom对象
     * @returns 返回新的第一个子fiber
     */
    function reconcileSingleElement(returnFiber, currentFirstChild, element) {
        //新的虚拟dom key，也就是唯一标识
        const key = element.key;//null
        let child = currentFirstChild;
        while (child !== null) {
            //判断此老fiber对应的key和新的虚拟dom对象的key是否一样 null===null
            if (child.key === key) {
                //判断老fiber对应的类型和新虚拟dom元素对应的类型是否相同
                if (child.type === element.type) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    //如果key和type都一样，就复用
                    const existing = useFiber(child, element.props);
                    existing.ref = element.ref;
                    existing.return = returnFiber;
                    return existing;
                } else {
                    //如果找到了key一样的老fiber，但类型不一样，那么就把剩下的全部删除
                    deleteRemainingChildren(returnFiber, child);
                }
            } else {
                deleteChild(returnFiber, child);
            }
            child = child.sibling;
        }
        //因为我们是初次挂载，老节点的currentFirstChild为null，所以可以直接根据虚拟dom创建新的Fiber节点
        const created = createFiberFromElement(element);
        created.ref = element.ref;
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
                    created.ref = newChild.ref;
                    created.return = returnFiber;
                    return created;
                }
                default:
                    break;
            }
        }
        return null;
    }
    function placeChild(newFiber, lastPlacedIndex, newIdx) {
        //指定新的fiber在新的挂载索引
        newFiber.index = newIdx;
        if (!shouldTrackSideEffects) {
            return lastPlacedIndex;
        }
        const current = newFiber.alternate;
        //如果有，说明这是一个更新节点，有老的真实dom
        if (current !== null) {
            const oldIndex = current.index;
            //如果找到的老fiber的索引比lastPlacedIndex要小，则老fiber对应的dom节点需要移动
            if (oldIndex < lastPlacedIndex) {
                newFiber.flags |= Placement;
                return lastPlacedIndex;
            } else {
                return oldIndex;
            }

        } else {
            //如果一个fiber它的flags位中有Placement，那么说明此节点需要创建真实dom插入到父容器中
            //如果父fiber节点是初次挂载 shouldTrackSideEffects===false 不需要添加flags
            //这种情况下会在完成阶段把所有的子节点添加到自己身上
            newFiber.flags |= Placement;
            return lastPlacedIndex;
        }

    }

    function updateElement(returnFiber, current, element) {
        const elementType = element.type;
        if (current !== null) {
            //判断是否类型一样 则表示key和type都相同，可以复用老的fiber和真实dom
            if (current.type === elementType) {
                const existing = useFiber(current, element.props);
                existing.ref = element.ref;
                existing.return = returnFiber;
                return existing;
            }
        }
        const created = createFiberFromElement(element);
        created.ref = element.ref;
        created.return = returnFiber;
        return created;
    }

    function updateSlot(returnFiber, oldFiber, newChild) {
        const key = oldFiber !== null ? oldFiber.key : null;
        if (newChild !== null && typeof newChild === 'object') {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    //如果key一样，进入更新元素的逻辑
                    if (newChild.key === key) {
                        return updateElement(returnFiber, oldFiber, newChild);
                    }
                }
                default:
                    return null;
            }
        }
        return null;
    }

    function mapRemainingChildren(returnFiber, currentFirstChild) {
        const existingChildren = new Map();
        let existingChild = currentFirstChild;
        while (existingChild !== null) {
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                //没有key使用索引
                existingChildren.set(existingChild.index, existingChild);
            }
            existingChild = existingChild.sibling;
        }
        return existingChildren;
    }

    function updateTextNode(returnFiber, current, textContent) {
        if (current === null || current.tag !== HostText) {
            const created = createFiberFromText(textContent);
            created.return = returnFiber;
            return created;
        } else {
            const existing = useFiber(current, textContent);
            existing.return = returnFiber;
            return existing;
        }
    }

    function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
        if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
            const matchedFiber = existingChildren.get(newIdx) || null;
            return updateTextNode(returnFiber, matchedFiber, '' + newChild);
        }
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                    return updateElement(returnFiber, matchedFiber, newChild);
                }
            }
        }
    }

    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
        let resultingFirstChild = null;//返回的第一个新儿子
        let previousNewFiber = null;//上一个新fiber
        let newIdx = 0;//用来遍历新的虚拟dom的索引
        let oldFiber = currentFirstChild;//第一个老fiber
        let nextOldFiber = null;//下一个老fiber
        let lastPlacedIndex = 0;//上一个不需要移动的老节点的索引

        //开始第一轮循环 如果老fiber有值，新的虚拟dom也有值
        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            //先暂存下一个老fiber
            nextOldFiber = oldFiber.sibling;
            //试图更新或者试图复用老的fiber
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
            if (newFiber === null) {
                break;
            }
            if (shouldTrackSideEffects) {
                //如果有老fiber 但是新的fiber并没有成功复用老fiber和老的真实dom，那就删除老fiber，在提交阶段会删除真实dom
                if (oldFiber && newFiber.alternate === null) {
                    deleteChild(returnFiber, oldFiber);
                }
            }
            //指定新fiber的位置
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;//li(A) sibling=p(B)
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }
        //新的虚拟dom已经循环完毕，3=>2
        if (newIdx === newChildren.length) {
            //删除剩下的老fiber
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }
        if (oldFiber === null) {
            //如果老的fiber已经没有了，新的虚拟dom还有，进入插入新节点的逻辑
            for (; newIdx < newChildren.length; newIdx++) {
                const newFiber = createChild(returnFiber, newChildren[newIdx]);
                if (newFiber === null) continue;
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
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
        }

        //开始处理移动的情况
        const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
        //开始遍历剩下的虚拟dom子节点
        for (; newIdx < newChildren.length; newIdx++) {
            const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx]);
            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    //如果要跟踪副作用，并且有老fiber
                    if (newFiber.alternate !== null) {
                        existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);

                    }
                }
                //指定新的fiber的存放位置，并且给lastPlacedIndex赋值
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;//这个newFiber就是大儿子
                } else {
                    //说明不是大儿子，把这个newFiber添加上一个子节点后面
                    previousNewFiber.sibling = newFiber;
                }
                //让newFiber成为新的previousNewFiber
                previousNewFiber = newFiber;
            }
        }
        if (shouldTrackSideEffects) {
            //等全部处理完后，删除map中所有剩下的老fiber
            existingChildren.forEach(child => deleteChild(returnFiber, child));
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