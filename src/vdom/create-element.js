import VNode, { createEmptyVNode } from "./vnode";
import config from "../config";
import { createComponent } from "./create-component";
import { isDef, isUndef, isTrue, isPrimitive, resolveAsset } from "../util/index";

export function createElement(context, tag, data, children) {
	let vnode;
	if (isDef(data) && isDef(data._ob_)) {
		return createEmptyVNode()
	}

	if (!tag) {
		return createEmptyVNode()
	}

	if (typeof tag === "string") {
		let Ctor;
		// 判断是否是一个保留标签
		if (config.isReservedTag(tag)) {
			//是保留标签则创建一个相应的节点
			vnode = new VNode(config.parsePlatformTagName(tag), data, children, undefined, undefined, context);
		} else if(isDef((Ctor = resolveAsset(context.$options, "components", tag)))) {
			//Ctor为组件构造类
			//从vm实例中的options查询该tag,如果存在则是组件并创建相应节点
			vnode = createComponent(Ctor, data, context, children, tag);
		} else {
			//未知元素，运行时检查创建， 因为父组件可能在序列化子组件的时候分配一个名字空间
			vnode = new VNode(tag, data, children, undefined, undefined, context)
		}
	} else {
		//tag不是字符串的时候则是组件的构造类
		vnode = createComponent(tag, data, context, children);
	}
	if (!isDef(vnode)) {
		//如果节点没有创建成功则返回一个空节点
		return createEmptyVNode();
	}
	return vnode;
}