import { def, hasOwn, isObject, hasProto} from '../util/index'
import { arrayMethods } from './array'
import Dep from "./dep"

var arrayKeys = Object.getOwnPropertyNames(arrayMethods)
//每个被观察到对象被附加上观察者实例，一旦被添加，观察者将为目标对象加上getter\setter属性，进行依赖收集以及调度更新。
export function Observer(value) {
	this.value = value
	this.dep = new Dep()

	//this.walk(value)
	if (Array.isArray(value)) {
		//使用修改原生数组方法替换原生数组方法以实现监听数组数据变化
		//如果浏览器支持__proto__属性，则直接覆盖数组原型方法，否则遍历重写数组方法
		var augment = hasProto ? protoAugment : copyAugment
			augment(value, arrayMethods, arrayKeys)
		/*如果是数组则需要遍历数组的每一个成员进行observe*/
		this.observeArray(value)
	}else {
		/*如果是对象则直接walk进行绑定*/
		this.walk(value)
	}
	//将Observer实例绑定到data的__ob__属性上面去，之前说过observe的时候会先检测是否已经有__ob__对象存放Observer实例了
	def(value, '_ob_', this)
}
//遍历每一个对象并且在它们上面绑定getter与setter。这个方法只有在value的类型是对象的时候才能被调用
Observer.prototype.walk = function(obj) {
	var keys = Object.keys(obj)
	for (var i = 0; i < keys.length; i++) {
		defineReactive(obj, keys[i], obj[keys[i]])
	}
}
/*对一个数组的每一个成员进行observe*/
Observer.prototype.observeArray = function(items) {
	for (let i = 0, l = items.length; i < l; i++) {
		observe(items[i])
	}
}

//尝试创建一个Observer实例（__ob__），如果成功创建Observer实例则返回新的Observer实例，如果已有Observer实例则返回现有的Observer实例
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