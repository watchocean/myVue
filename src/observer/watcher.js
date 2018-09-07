import Dep, { pushTarget, popTarget } from './dep'

let uid = 0

export default function Watcher(vm, expOrFn, cb, options) {
	options = options ? options : {}
	this.vm = vm
	vm._watchers.push(this)
	this.cb = cb
	this.id = ++uid

	//options
	this.deep = !!options.deep
  	this.user = !!options.user
  	this.lazy = !!options.lazy
  	this.sync = !!options.sync
	this.deps = []
	this.newDeps = []
	this.depIds = new Set()
	this.newDepIds = new Set()
	if (typeof expOrFn === 'function') {
		this.getter = expOrFn
	}
	this.value = this.lazy ? undefined : this.get()
}

Watcher.prototype.get = function() {
	// body...
	pushTarget(this)
	var value = this.getter.call(this.vm, this.vm)
	popTarget()
	this.cleanupDeps()
	return value
};
// 将依赖添加进依赖集， 将观察者添加进订阅列表
Watcher.prototype.addDep = function(dep) {
	var id = dep.id
	if (!this.newDepIds.has(id)) {
		this.newDepIds.add(id)
		this.newDeps.push(dep)
		if (!this.depIds.has(id)) {
			dep.addSub(this)
		}
	}
}

Watcher.prototype.cleanupDeps = function() {
	var i = this.deps.length
	while (i--) {
		var dep = this.deps[i]
		if (!this.newDepIds.has(dep.id)) {
			dep.removeSub(this)
		}
	}

	var tmp = this.depIds
	this.depIds = this.newDepIds
	this.newDepIds = tmp
	this.newDepIds.clear()
	tmp = this.deps
	this.deps = this.newDeps
	this.newDeps = []
}

Watcher.prototype.update = function() {
	this.run()
}

Watcher.prototype.run = function() {
	var value = this.get()
	var oldValue = this.value
	this.value = value
	this.cb.call(this.vm, value, oldValue)
}