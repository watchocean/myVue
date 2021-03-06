import { ASSET_TYPES } from '../shared/constants'
import { extend, mergeOptions } from '../util/index'
import { proxy } from '../instance/state'

export function initExtend(Vue) {
	/**
   	* Each instance constructor, including Vue, has a unique
   	* cid. This enables us to create wrapped "child
   	* constructors" for prototypal inheritance and cache them.
   	*/
   	Vue.cid = 0
  	let cid = 1
  	//扩展基础构造器, 制造一个可复用且有指定选项功能的子构造器
  	Vue.extend = function (extendOptions){
    	extendOptions = extendOptions || {}
    	//父类的构造器
	    const Super = this
	    const SuperId = Super.cid
	    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
	    //如果构造函数中已经存在了该id，则代表已extend，直接返回
	    if (cachedCtors[SuperId]) {
	      return cachedCtors[SuperId]
	    }

	    const name = extendOptions.name || Super.options.name

	    const Sub = function VueComponent (options) {
	      this._init(options)
	    }
	    Sub.prototype = Object.create(Super.prototype)
	    Sub.prototype.constructor = Sub
	    Sub.cid = cid++
	    Sub.options = mergeOptions(
	      Super.options,
	      extendOptions
	    )
	    Sub['super'] = Super

	    // For props and computed properties, we define the proxy getters on
	    // the Vue instances at extension time, on the extended prototype. This
	    // avoids Object.defineProperty calls for each instance created.
	    if (Sub.options.props) {
	      initProps(Sub)
	    }

	    // allow further extension/mixin/plugin usage
	    Sub.extend = Super.extend
	    Sub.mixin = Super.mixin
	    Sub.use = Super.use

	    // create asset registers, so extended classes
	    // can have their private assets too.
	    ASSET_TYPES.forEach(function (type) {
	      Sub[type] = Super[type]
	    })
	    // enable recursive self-lookup
	    if (name) {
	      Sub.options.components[name] = Sub
	    }

	    // keep a reference to the super options at extension time.
	    // later at instantiation we can check if Super's options have
	    // been updated.
	    Sub.superOptions = Super.options
	    Sub.extendOptions = extendOptions
	    Sub.sealedOptions = extend({}, Sub.options)

	    // cache constructor
	    cachedCtors[SuperId] = Sub
	    return Sub
  	}
}

function initProps (Comp) {
  	const props = Comp.options.props
  	for (const key in props) {
    	proxy(Comp.prototype, `_props`, key)
  	}
}