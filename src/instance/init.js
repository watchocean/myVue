import { initState } from './state'
import { initRender } from './render'
import { initLifecycle } from './lifecycle'
import { mergeOptions } from '../util/index'
//定义vue的原型初始方法
export function initMixin(Vue) {
	Vue.prototype._init = function(options) {
		const vm = this
		//vm.$options = options
		vm.$options = mergeOptions(
      		resolveConstructorOptions(vm.constructor),
      		options || {},
      		vm
    	)
    	//console.log(resolveConstructorOptions(vm.constructor))
    	// should be in global api
		vm.$options._base = Vue

		initLifecycle(vm)
    	initState(vm)
    	initRender(vm)

    	vm.$mount(options)
	}
}

export function resolveConstructorOptions(Ctor) {
	const options = Ctor.options
	return options
}