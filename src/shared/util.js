export function makeMap(str, expectsLowerCase) {
	const map = Object.create(null)
	const list = str.split(',')
	for (let i = 0; i < list.length; i++) {
		map[list[i]] = true
	}
	return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val]
}

export const identity = (_) => _

export function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

//创建一个函数的缓存版本
export function cached(fn) {
	const cache = Object.create(null)
	return (function cachedFn(str) {
		const hit = cache[str]
		return hit || (cache[str] = fn(str))
	})
}
//Hyphenate a camelCase string
const hyphenateRE = /\B[A-Z]/g
export const hyphenate = cached((str) => {
	return str.replace(hyphenateRE, '-$1').toLowerCase()
})

// Camelize a hyphen-delimited string.
const camelizeRE = /-(\w)/g
export const camelize = cached((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

// Capitalize a string.
export const capitalize = cached((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

// Mix properties into target object.
export function extend(to, _from) {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}