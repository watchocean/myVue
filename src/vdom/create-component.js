import VNode from './vnode'
import {isUndef, isObject } from '../util/index'
import { extractPropsFromVNodeData} from './helpers/index'

export 	function createComponent(Ctor, data, context, children, tag) {
	if (isUndef(Ctor)){
		return
	}

	const baseCtor = context.$options._base
	//将options object转为构造函数
	if (isObject(Ctor)) {
		Ctor = baseCtor.extend(Ctor)
	}

	data = data || {}
	//extract props
	const propsData = extractPropsFromVNodeData(data, Ctor, tag)
	// extract listeners, since these needs to be treated as
  	// child component listeners instead of DOM listeners
	const listeners = data.on
	data.on = data.nativeOn
	// return a placeholder vnode
	const name = Ctor.options.name || tag
	const vnode = new VNode(
	    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
	    data, undefined, undefined, undefined, context,
	    { Ctor, propsData, listeners, tag, children }
    )
    return vnode
}