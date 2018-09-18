import Watcher from '../observer/watcher'
import Dep from '../observer/dep'
import { observe } from '../observer/index'
import { isReserved } from '../util/index'

export function initState(vm) {
	// body...
	vm._watchers = []
	initData(vm)
}
//初始化data
function initData(vm) {
	let data = vm.$options.data
	data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {}

	//将data代理到vm实例
	const keys = Object.keys(data)
	let i = keys.length
	while(i--) {
		proxy(vm, keys[i])
	}

	observe(data)
}

function getData(data, vm) {
  return data.call(vm, vm)
}

export function stateMixin(Vue) {

}
//对不是保留tag的节点进行数据代理
export function proxy(vm, key) {
	if (!isReserved(key)) {
		Object.defineProperty(vm, key, {
			configurable: true,
			enumerable: true,
			get: function proxyGetter() {
				return vm._data[key]
			},
			set : function proxySetter(val) {
				vm._data[key] = val
			}
		})
	}
}