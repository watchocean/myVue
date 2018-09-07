import { def, hasOwn, isObject, hasProto} from '../util/index'
import { arrayMethods } from './array'
import Dep from "./dep"

var arrayKeys = Object.getOwnPropertyNames(arrayMethods)
//Observer的构造函数
export function Observer(value) {
	this.value = value
	this.dep = new Dep()

	//this.walk(value)
	if (Array.isArray(value)) {
		//使用修改原生数组方法替换原生数组方法以实现监听数组数据变化
		//如果浏览器支持__proto__属性，则直接覆盖数组原型方法，否则遍历重写数组方法
		var augment = hasProto ? protoAugment : copyAugment
			augment(value, arrayMethods, arrayKeys)
		this.observeArray(value)
	}else {
		this.walk(value)
	}

	def(value, '_ob_', this)
}

Observer.prototype.walk = function(obj) {
	var keys = Object.keys(obj)
	for (var i = 0; i < keys.length; i++) {
		defineReactive(obj, keys[i], obj[keys[i]])
	}
}
//双向绑定数组类型数据
Observer.prototype.observeArray = function(items) {
	for (let i = 0, l = items.length; i < l; i++) {
		observe(items[i])
	}
}

//观察value
export function observe(value) {
	//判断传入的参数是否为对象
	if (!isObject(value)) {
		return
	}
	var ob
	//判断传入的对象是否是Observer, 不是则重新创建
	if (hasOwn(value, '_ob_') && value._ob_ instanceof Observer) {
		ob = value._ob_
	} else {
		ob = new Observer(value)
	}
	return ob
}
//双向绑定数据
export function defineReactive(obj, key, val) {
	var dep = new Dep()
	var childOb = observe(val)
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter() {
			var value = val
			if (Dep.target){
				dep.depend()
				if (childOb){
					childOb.dep.depend()
				}
			}
			return value
		},
		set: function reactiveSetter(newVal) {
			var value = val
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return
			}
			val = newVal
			childOb = observe(newVal)
			dep.notify()
		}
	})
}

export function set(obj, key, val) {
	if (hasOwn(obj, key)) {
		obj[key] = val
		return
	}
	const ob = obj._ob_
	if (!ob) {
		obj[key] = val
		return
	}

	defineReactive(ob.value, key, val)
	ob.dep.notify()
	return val
}

export function del (obj, key) {
	const ob = obj._ob_
	if(!hasOwn(obj, key)) {
		return
	}
	delete obj[key]
	if(!ob){
		return
	}
	ob.dep.notify()
}

function protoAugment (target, src) {
	target.__proto__ = src
}

function copyAugment (target, src, keys) {
	for (let i = 0, l = keys.length; i < l; i++) {
		var key = keys[i]
		def(target, key, src[key])
	}
}

function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e._ob_ && e._ob_.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}