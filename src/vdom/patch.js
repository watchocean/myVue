// createPatchFunction工厂函数是主体。由于Patch中的节点操作是跨平台的，所以需要动态创建
// createPatchFunction接受一个backend参数。这个工厂函数里定义了大量的helper函数。关键是patch函数。所以要先看这个函数。
// 然后依次实现patch函数调用的那些工具函数。
// hydrating的情况先不考虑
import VNode from './vnode'
import { isDef, isUndef, isTrue, makeMap, isPrimitive } from '../util/index'

export var emptyNode = new VNode('', {}, [])

var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];
//判断是否是同一节点，如果是则直接Patch
function sameVnode(a, b) {
	return (a.key === b.key && a.isComment === b.isComment && isDef(a.data) === isDef(b.data))
}

export function createPatchFunction(backend) {
	var i,j
	var cbs = {}
	var nodeOps = backend.nodeOps
	var modules = backend.modules

	//初始化cbs中hooks并添加module`s hook
	for (i = 0; i < hooks.length; ++i) {
		cbs[hooks[i]] = []
		for (j = 0; j < modules.length; ++j) {
			if (isDef(modules[j][hooks[i]])) {
				cbs[hooks[i]].push(modules[j][hooks[i]])
			}
		}
	}

	function emptyNodeAt(elm) {
		return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
	}

	function createElm(vnode, insertedVnodeQueue, parentElm, refElm) {
		var data = vnode.data
    	var children = vnode.children
    	var tag = vnode.tag

    	if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      		return
    	}
    	//根据参数判断节点类型，依据类型创建节点并插入层级关系
    	if (isDef(tag)) {
		    vnode.elm = nodeOps.createElement(tag, vnode)
		   	//创建子节点
		    createChildren(vnode, children, insertedVnodeQueue)
		    if (isDef(data)) {
		    	//激活钩子函数
		       invokeCreateHooks(vnode, insertedVnodeQueue)
		    }
		    insert(parentElm, vnode.elm, refElm)
		} else if (isTrue(vnode.isComment)) {
		    vnode.elm = nodeOps.createComment(vnode.text)
		    insert(parentElm, vnode.elm, refElm)
		}else {
		    vnode.elm = nodeOps.createTextNode(vnode.text)
		    insert(parentElm, vnode.elm, refElm)
		}
	}

	function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
		var i = vnode.data
		if (isDef(i)) {
			if (isDef(i = i.hook) && isDef(i = i.init)) {
				i(vnode, parentElm, refElm)
			}
			if (isDef(vnode.componentInstance)) {
				initComponent(vnode, insertedVnodeQueue)
				return true
			}
		}
	}

	function initComponent(vnode, insertedVnodeQueue) {
	    if (isDef(vnode.data.pendingInsert)) {
	      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
	      vnode.data.pendingInsert = null
	    }
	    vnode.elm = vnode.componentInstance.$el
	    invokeCreateHooks(vnode, insertedVnodeQueue)
  	}

  	function createKeyToOldIdx (children, beginIdx, endIdx) {
	    let i, key
	    const map = {}
	    for (i = beginIdx; i <= endIdx; ++i) {
	      key = children[i].key
	      if (isDef(key)) map[key] = i
	    }
	    return map
  	}
  	//新旧虚拟节点树进行比对，只对有差异的地方更新，以节省性能
  	//比较可以组合出四种情况，前后颠倒(2种)，中间往前移(1), 不存在的节点则重新创建(1)
  	function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  		var oldStartIdx = 0
	    var newStartIdx = 0
	    var oldEndIdx = oldCh.length - 1
	    var oldStartVnode = oldCh[0]
	    var oldEndVnode = oldCh[oldEndIdx]
	    var newEndIdx = newCh.length - 1
	    var newStartVnode = newCh[0]
	    var newEndVnode = newCh[newEndIdx]
	    var oldKeyToIdx, idxInOld, vnodeToMove, refElm

	    const canMove = !removeOnly

	    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
	    	if (isUnDef(oldStartVnode)) {
	    		oldStartVnode = oldCh[++oldStartIdx]
	    	} else if (oldEndIdx) {
	    		oldEndIdx = oldCh[--oldEndIdx]
	    	} else if (sameVnode(oldStartVnode, newStartVnode)) {
	    		patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
	    		oldStartVnode = oldCh[++oldStartIdx]
	    		newStartVnode = newCh[++newStartIdx]
	    	} else if (sameVnode(oldEndVnode, newEndVnode)) {
	    		patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
	    		oldEndVnode = oldCh[++oldEndIdx]
	    		newEndVnode = newCh[++newEndIdx]
	    	} else if (sameVnode(oldStartVnode, newEndVnode)) {
	    		patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
		        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
		        oldStartVnode = oldCh[++oldStartIdx]
		        newEndVnode = newCh[--newEndIdx]
	    	} else if (sameVnode(oldEndVnode, newStartVnode)) {
	    		patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
        		nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
        		oldEndVnode = oldCh[--oldEndIdx]
        		newStartVnode = newCh[++newStartIdx]
	    	} else {
	    		if (isUndef(oldKeyToIdx)) {
	    			oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
	    		}
	    		//如果newStartVnode新的VNode节点存在key并且这个key在oldVnode中能找到则返回这个节点的idxInOld(索引)
	    		idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)

	    		if (isUndef(idxInOld)) { 
	    			//newStartVnode没有key或该key没有在旧节点中找到则创建一个新的节点
          			createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
        		} else {
        			//获取同key的旧节点
        			vnodeToMove = oldCh[idxInOld]
			        if (sameVnode(vnodeToMove, newStartVnode)) {
			        	//如果新vnode与同key的节点是同一个节点则进行patchVnode
			            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue)
			            //已patchVnode,所以将这个旧节点赋值undefined,以便后续检测重复
			            oldCh[idxInOld] = undefined
			            //当有标识位canmove时可以直接插入在oldStartVnode对应的真实DOM节点的前面
			            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
			        } else {
			            // same key but different element. treat as new element
			            //当新的VNode与找到的同样key的VNode不是sameVNode的时候,创建一个新节点
			            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
			        }
        		}
        		newStartVnode = newCh[++newStartIdx]
	    	}
	    }
	    // oldStartIdx > oldEndIdx代表旧节点树已遍历完，新节点树没遍历完，需要创建节点
	    // newStartIdx > newEndIdx 代表新节点已遍历完，旧节点书没遍历完，需要移除旧节点
	    if (oldStartIdx > oldEndIdx) {
      		refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
      		addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    	} else if (newStartIdx > newEndIdx) {
      		removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    	}
  	}

  	function findIdxInOld(node, oldCh, start, end) {
  		for (let i = start; i < end; i++) {
  			const c = oldCh[i]
  			if (isDef(c) && sameVnode(node, c)) {
  				return i
  			}
  		}
  	}

  	function insert(parent, elm, ref) {
  		if (isDef(parent)) {
  			if (isDef(ref)) {
  				if (ref.parentNode === parent) {
  					nodeOps.insertBefore(parent, elm, ref)
  				}
  			} else {
  				nodeOps.appendChild(parent, elm)
  			}
  		}
  	}

  	function isPatchable(vnode) {
  		while (vnode.componentInstance) {
  			vnode = vnode.componentInstance._vnode
  		}
  		return isDef(vnode.tag)
  	}

  	function createChildren(vnode, children, insertedVnodeQueue) {
  		if (Array.isArray(children)) {
  			for (let i = 0; i < children.length; ++i) {
  				createElm(children[i], insertedVnodeQueue, vnode.elm, null, true)
  			}
  		} else if (isPrimitive(vnode.text)) {
  			nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(vnode.text))
  		}
  	}

  	function addVnodes(parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
  		for (; startIdx <= endIdx; ++startIdx) {
  			createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm)
  		}
  	}

  	function createRmCb(childElm, listeners) {
  		function remove() {
  			if (--remove.listeners === 0) {
  				removeNode(childElm)
  			}
  		}
  		remove.listeners = listeners
  		return remove
  	}

  	function  removeNode(el) {
  		// body...
  		const parent = nodeOps.patchVnode(el)
  		if (isDef(parent)) {
  			nodeOps.removeChild(parent, el)
  		}
  	}

  	function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  		for (; startIdx <= endIdx; ++startIdx) {
      		const ch = vnodes[startIdx]
		    if (isDef(ch)) {
		        if (isDef(ch.tag)) {
		          removeAndInvokeRemoveHook(ch)
		          invokeDestroyHook(ch)
		        } else { // Text node
		          removeNode(ch.elm)
		        }
		    }
    	}
  	}

  	function removeAndInvokeRemoveHook(vnode, rm) {
  		if (isDef(rm) || isDef(vnode.data)) {
  			let i
      		const listeners = cbs.remove.length + 1
		   	if (isDef(rm)) {
		        // we have a recursively passed down rm callback
		        // increase the listeners count
		        rm.listeners += listeners
		    } else {
		        // 直接移除
		        rm = createRmCb(vnode.elm, listeners)
		   	}
		   	// 在子组件根节点上激活钩子
		   	if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        		removeAndInvokeRemoveHook(i, rm)
      		}

      		for (i = 0; i < cbs.remove.length; ++i) {
        		cbs.remove[i](vnode, rm)
      		}

      		if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        		i(vnode, rm)
      		} else {
        		rm()
      		}
		} else {
			removeNode(vnode.elm)
		}
  	}

  	function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  		//两个节点相同返回
  		if (oldVnode === vnode) {
  			return
  		}

  		let i
  		cnost data = vnode.data
  		if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
  			// i = data.hook.prepatch
  			i(oldVnode, vnode)
  		}

  		const elm = vnode.elm = oldVnode.elm
  		const oldCh = oldVnode.children
  		const ch = vnode.children
  		//激活更新 hook
  		if (isDef(data) && isPatchable(vnode)) {
  			//调用update回调以及钩子
  			for (i = 0; i < cbs.update.length; ++i) {
  				cbs.update[i](oldVnode, vnode)
  			}
  		}
  		//如果这个VNode没有text时
  		if (isUndef(vnode.text)) {
  			if (isDef(oldCh) && isDef(ch)) {
  				//新老节点均有children子节点,则对子节点进行diff操作，调用updateChildren
  				if (oldCh !== ch) {
  					updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
  				}
  			} else if (isDef(ch)) {
  				//如果旧节点没有字节点而新节点有时，先清空elm的文本内容,然后为当前节点加入子节点
  				if (isDef(oldVnode.text)) {
  					nodeOps.setTextContent(elm, '')
  				}
  				addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
  			} else if (isDef(oldCh)) {
  				//当新节点没有子节点而旧节点有时，清空elm的子节点
  				removeVnodes(elm, oldCh, 0, oldCh.length - 1)
  			} else if (isDef(oldVnode.text)) {
  				//新旧节点均无子节点时，只需替换文本，因为本逻辑中新节点没有text，所以直接除去elm的文本
  				nodeOps.setTextContent(elm, '')
  			}
  		} else if (oldVnode.text !== vnode.text) {
  			//新旧节点text不一致时，直接替换文本
  			nodeOps.setTextContent(elm, vnode.text)
  		}
  		//激活 postpatch钩子
  		if (isDef(data)) {
  			if (isDef(i = data.hook) && isDef(i = i.postpatch)) {
  				i(oldVnode, vnode)
  			}
  		}
  	}
  	//激活 create hook
  	function invokeCreateHooks(vnode, insertedVnodeQueue) {
	    for (let i = 0; i < cbs.create.length; ++i) {
	      cbs.create[i](emptyNode, vnode)
	    }
	    i = vnode.data.hook // Reuse variable
	    if (isDef(i)) {
	      if (isDef(i.create)) {
	      	i.create(emptyNode, vnode)
	      }
	      if (isDef(i.insert)) {
	      	insertedVnodeQueue.push(vnode)
	      }
	    }
  	}

  	function invokeInsertHook(vnode, queue) {
  		for (let i = 0; i < queue.length; ++i) {
  			queue[i].data.hook.insert(queue[i])
  		}
  	}

  	function invokeDestroyHook(vnode) {
    	let i, j
    	const data = vnode.data
	    if (isDef(data)) {
	      	if (isDef(i = data.hook) && isDef(i = i.destroy)) {
	      		i(vnode)
	      	}
	      	for (i = 0; i < cbs.destroy.length; ++i) {
	      		cbs.destroy[i](vnode)
	      	}
	    }
	    if (isDef(i = vnode.children)) {
	      	for (j = 0; j < vnode.children.length; ++j) {
	        	invokeDestroyHook(vnode.children[j])
	      	}
	    }
	}

  	return function patch(oldVnode, vnode, parentElm, refElm, removeOnly) {
  		//vnode不存在则直接调用销毁钩子
	    if (isUndef(vnode)) {
	      	if (isDef(oldVnode)) {
	      		invokeDestroyHook(oldVnode)
	    	}
	      return
	    }

    	const insertedVnodeQueue = []

	    if (isUndef(oldVnode)) {
	      // 旧节点未定义时，挂载时创建节点
	      createElm(vnode, insertedVnodeQueue, parentElm, refElm)
	    } else {
		    // only take care of patch existing root node for now
		    //标记旧的vnode是否有nodeType
		    const isRealElement = isDef(oldVnode.nodeType)
		    if (!isRealElement && sameVnode(oldVnode, vnode)) {
		        // patch existing root node
		        //是同一个节点的时候直接修改现有节点	
		        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly)
		    } else {
		        if (isRealElement) {
		          // either not server-rendered, or hydration failed.
		          // create an empty node and replace it
		          // 如果不是服务端渲染或映射到真是DOM失败，则创建一个空节点替换它
		          oldVnode = emptyNodeAt(oldVnode)
		        }
		        // 取代现有节点
		        const oldElm = oldVnode.elm
		        const parentElm = nodeOps.parentNode(oldElm)

		        // 创建一个新节点
		        createElm(
		          vnode,
		          insertedVnodeQueue,
		          parentElm,
		          nodeOps.nextSibling(oldElm)
		        )

	        	// update parent placeholder node element, recursively
	        	if (isDef(vnode.parent)) {
	        		//组件根节点被替换，遍历更新父节点element
	          		let ancestor = vnode.parent
	          		const patchable = isPatchable(vnode)
	          		while (ancestor) {
	            		for (let i = 0; i < cbs.destroy.length; ++i) {
	              			cbs.destroy[i](ancestor)
	            		}
	            		ancestor.elm = vnode.elm
			            if (patchable) {
			            	//调用create回调
			              	for (let i = 0; i < cbs.create.length; ++i) {
			                	cbs.create[i](emptyNode, ancestor)
			            	}
				            // invoke insert hooks that may have been merged by create hooks.
				            // e.g. for directives that uses the "inserted" hook.
				            const insert = ancestor.data.hook.insert
	              			if (insert.merged) {
	                			// start at index 1 to avoid re-invoking component mounted hook
	                			for (let i = 1; i < insert.fns.length; i++) {
	                  				insert.fns[i]()
	                			}
	              			}
	            		}
	            		ancestor = ancestor.parent
	          		}
	       		}

        		// 销毁旧节点
        		if (isDef(parentElm)) {
          			removeVnodes(parentElm, [oldVnode], 0, 0)
        		} else if (isDef(oldVnode.tag)) {
          			console.log(vnode.tag, oldVnode.tag, nodeOps.parentNode(oldVnode.elm))
          			invokeDestroyHook(oldVnode)
        		}
      		}
    	}

    	invokeInsertHook(vnode, insertedVnodeQueue)
    	return vnode.elm
  	}
}
