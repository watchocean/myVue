# 抽象DOM树

在前端早期我们通常是通过直接操作DOM来达到修改视图的目的，这样虽然十分简单，但一当应用变大时就会显得十分臃肿，给后续的维护带来了非常大的困扰。

随着前端框架技术的不断发展，修改DOM带来的性能、繁琐等问题逐渐得到解决。解决办法就是对DOM树进行抽象，一系列的操作都在DOM的抽象树上进行，直到最后再进行渲染真实DOM。

简单粗暴的渲染真实DOM会浪费许多性能，而每次只针对修改后的差异进行更新无疑会提升性能。为此，Vue采用了diff算法去计算一些需要修改的最小单位，然后再将这些小单位的视图进行更新，这样自然就减少了对DOM的操作，极大的提升了性能。

## VNode基类

Vue使用抽象节点VNode对DOM进行抽象，VNode作为真实DOM的抽象避免了对平台的依赖，而这为跨浏览器跨平台提供了可能。下面就看下VNode的简单实现。

src/vdom/vnode.js
```javascript
export default function VNode(tag, data, children, text, elm, context, componentOptions) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.context = context
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.isComment = false
}
```
这只是最基础的VNode节点，是派生其他Vnode的基类。相比于Vue.js中的Vnode类，本文去掉了许多暂时用不上的数据，用以减少干扰，以便更好的理解源码。

tag: 当前节点的标签名。
data: 当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息。
children: 当前节点的子节点，是一个数组。 
text: 当前节点的文本。 
elm: 当前虚拟节点对应的真实dom节点。 
context: 当前节点的编译作用域。 
key: 节点的key属性，被当作节点的标志，用以优化。 
componentOptions: 组件的option选项。 
componentInstance: 当前节点对应的组件的实例。 
parent: 当前节点的父节点。 
isComment: 是否为注释节点。

## 实现

上面介绍了抽象树的来由和VNode节点，下面我们就开始实现一些相应的API吧。正式编写前，我们照常先编好测试用例。

test/vdom/create-element.spec.js

```javascript
import Vue from "../../src/index"
import { createEmptyVNode } from '../../src/vdom/vnode'

describe('create-element', function() {
	it('render vnode with basic reserved tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const vnode = h('p', {})
    expect(vnode.tag).toBe('p')
    expect(vnode.data).toEqual({})
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
  })

  it('render vnode with component using createElement', () => {
    const vm = new Vue({
      data: { message: 'hello world' },
      components: {
        'my-component': {
          props: ['msg']
        }
      }
    })
    const h = vm.$createElement
    const vnode = h('my-component', { props: { msg: vm.message }})
    expect(vnode.tag).toMatch(/vue-component-[0-9]+/)
    expect(vnode.componentOptions.propsData).toEqual({ msg: vm.message })
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
  })

  it('render empty vnode with falsy tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const vnode = h(null, {})
    expect(vnode).toEqual(createEmptyVNode())
  })
  
  it('render vnode with custom tag using createElement', () => {
     const vm = new Vue({
       data: { msg: 'hello world' }
     })
     const h = vm.$createElement
     const tag = 'mytag'
     const vnode = h(tag, {})
     expect(vnode.tag).toBe('mytag')
     expect(vnode.data).toEqual({})
     expect(vnode.children).toBeUndefined()
     expect(vnode.text).toBeUndefined()
     expect(vnode.elm).toBeUndefined()
     expect(vnode.ns).toBeUndefined()
     expect(vnode.context).toEqual(vm)
     expect(vnode.componentOptions).toBeUndefined()
   })
});
```
Vue.js里相关API有5个，这里为了方便理解，我们暂时先实现其中的createEmptyVNode、createTextVNode、createComponent、createElement。

src/vdom/vnode.js
```javascript
export function createEmptyVNode() {
	const node = new VNode()
	node.text = ''
	node.isComment = true
	return node
}

export function createTextVNode(val) {
	return new VNode(undefined, undefined, undefined, String(val))
}
```

createEmptyVNode、createTextVNode这两个函数较为简单，需要重点理解createComponent、createElement这两个函数。

src/vdom/create-component.js
```javascript
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
```

src/vdom/create-element.js
```javascript
import VNode, { createEmptyVNode } from "./vnode";
import config from "../config";
import { createComponent } from "./create-component";
import { isDef, isUndef, isTrue, isPrimitive, resolveAsset } from "../util/index";

export function createElement(context, tag, data, children) {
	let vnode;
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
```

createElement是根据传入的参数类型来判断要创建什么类型的虚拟节点。当data上已经绑定_ob_的时候，代表该对象已经被Oberver过了，所以创建一个空节点。tag不存在的时候也同样创建一个空节点。如果tag不是String或者能在vm的options的components中找的到，则创建一个组件，否则统一用 new VNode创建。