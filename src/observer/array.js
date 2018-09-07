import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

;[
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse'
]
.forEach(function (method) {
	//保证数组原生功能的实现
	const original = arrayProto[method]
	//重写数组方法，实现对新添加的数组数据变化监听
	def(arrayMethods, method, function mutator() {
		let i = arguments.length
		const args = new Array(i)
		while(i--) {
			args[i] = arguments[i]
		}
		const result = original.apply(this, args)
		const ob = this._ob_
		let inserted
		switch (method) {
			case 'push':
				inserted = args
				break
			case 'unshift':
				inserted = args
				break
			case 'splice':
				inserted = args.slice(2)
				break
		}
		if (inserted) ob.observeArray(inserted)

		ob.dep.notify()
		return result
	})
})