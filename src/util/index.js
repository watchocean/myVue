import { camelize, capitalize, isPlainObject } from '../shared/util'

const hasOwnProperty = Object.prototype.hasOwnProperty
//必须对传入的参数进行判断，不然obj为null时会报错
export function hasOwn(obj, key) {
  if (!isObject(obj) && !Array.isArray(obj)) {
    return
  }
  return hasOwnProperty.call(obj, key)
}

export function isObject(obj) {
	return obj !== null && typeof obj === 'object'
}
//给要观察的对象的_ob_属性存放Observer对象，标记已观察
export function def(obj, key, val, enumerable) {
	Object.defineProperty(obj, key, {
		value: val,
		enumerable: !!enumerable,
		writable: true,
		configurable: true
	})
}
// Mix properties into target object.
export function extend(to, _from) {
  	for (const key in _from) {
      	to[key] = _from[key]
  	}
  	return to
}

export function isUndef(v) {
	return v === undefined || v === null
}

export function isDef(v) {
	return v !== undefined || v === null 
}

export function isReserved(str) {
	var c = (str + '').charCodeAt(0)
	return c === 0x24 || c === 0x5F
}

export function isTrue(v) {
	return v === true
}

export function isPrimitive(value) {
	return (  
		typeof value === 'string' ||
    	typeof value === 'number' ||
    	typeof value === 'boolean'
    )
}

export function resolveAsset(options, type, id, warnMissing) {
  //当id非字符串和options不存在type时返回
	if (typeof id !== 'string' || isUndef(options[type])) {
		return
	}
	const assets = options[type]
	//首先检查本地注册的变化
	if (hasOwn(assets, id)) {
		return assets[id]
	}
	const camelizedId = camelize(id)
	if (hasOwn(assets, camelizedId)) {
		return assets[camelizedId]
	}
	const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) {
  	return assets[PascalCaseId]
  }
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  return res
}

export function noop () {}

export var hasProto = '__proto__' in {};

const bailRE = /[^\w.$]/
export function parsePath (path) {
	if (bailRE.test(path)) {
	    return
	} else {
	    const segments = path.split('.')
	    return function (obj) {
	      	for (let i = 0; i < segments.length; i++) {
	        	if (!obj) {
	        		return obj = obj[segments[i]]
	        	}
	      	}
	      	return obj
	    }
	}
}

var strats = Object.create(null);
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

function mergeData (to, from) {
  	if (!from) {
  		return to
  	}
  	let key, toVal, fromVal
  	const keys = Object.keys(from)
  	for (let i = 0; i < keys.length; i++) {
    	key = keys[i]
    	toVal = to[key]
    	fromVal = from[key]
    	if (!hasOwn(to, key)) {
      		set(to, key, fromVal)
    	} else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      		mergeData(toVal, fromVal)
    	}
  	}
  	return to
}

export function mergeDataOrFn ( parentVal, childVal, vm) {
  	if (!vm) {
    	// in a Vue.extend merge, both should be functions
	    if (!childVal) {
	      return parentVal
	    }
	    if (!parentVal) {
	      return childVal
	    }
	    // when parentVal & childVal are both present,
	    // we need to return a function that returns the
	    // merged result of both functions... no need to
	    // check if parentVal is a function here because
	    // it has to be a function to pass previous merges.
	    return function mergedDataFn () {
	      return mergeData(
	        typeof childVal === 'function' ? childVal.call(this) : childVal,
	        typeof parentVal === 'function' ? parentVal.call(this) : parentVal
	      )
	    }
  	} else {
	    return function mergedInstanceDataFn () {
	      // instance merge
	    	const instanceData = typeof childVal === 'function'
	        	? childVal.call(vm)
	        	: childVal
	    	const defaultData = typeof parentVal === 'function'
	        	? parentVal.call(vm)
	        	: parentVal
	      	if (instanceData) {
	        	return mergeData(instanceData, defaultData)
	      	} else {
	        	return defaultData
	      	}
    	}	
  	}
}
//序列化 props
function normalizeProps (options, vm) {
  	const props = options.props
  	if (!props) {
  		return
  	}
  	const res = {}
  	let i, val, name
  	if (Array.isArray(props)) {
    	i = props.length
    	while (i--) {
      		val = props[i]
      		if (typeof val === 'string') {
        		name = camelize(val)
        		res[name] = { type: null }
      		} 
    	}
  	} else if (isPlainObject(props)) {
    	for (const key in props) {
      		val = props[key]
      		name = camelize(key)
      		res[name] = isPlainObject(val)
        		? val
        		: { type: val }
    	}
  	} 
  	options.props = res
}

export function mergeOptions(parent, child, vm){
  	if (typeof child === 'function') {
    	child = child.options
  	}
  	normalizeProps(child, vm)
  	const extendsFrom = child.extends
  	if (extendsFrom) {
    	parent = mergeOptions(parent, extendsFrom, vm)
  	}
  	if (child.mixins) {
    	for (let i = 0, l = child.mixins.length; i < l; i++) {
      		parent = mergeOptions(parent, child.mixins[i], vm)
    	}
  	}
  	const options = {}
  	let key
  	for (key in parent) {
    	mergeField(key)
  	}
  	for (key in child) {
    	if (!hasOwn(parent, key)) {
      		mergeField(key)
    	}
  	}
  	function mergeField(key) {
    	const strat = strats[key] || defaultStrat
    	options[key] = strat(parent[key], child[key], vm, key)
  	}
  	return options
}