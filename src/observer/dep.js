var uid = 0;

//dep构造函数
export default function Dep(argument) {
	this.id = uid++
	this.subs = []
}

Dep.prototype.addSub = function(sub) {
	this.subs.push(sub)
}

Dep.prototype.removeSub = function(sub) {
	remove(this.subs, sub)
}

Dep.prototype.depend = function() {
	if(Dep.target) {
		Dep.target.addDep(this)
	}
}

Dep.prototype.notify = function() {
	var subs = this.subs.slice()
	for(var i = 0, l = subs.length; i < l; i++){
		subs[i].update()
	}
}

Dep.target = null

var targetStack = []

export function pushTarget(_target) {
	if (Dep.target) {
		targetStack.push(Dep.target)
	}
	Dep.target = _target
}

export function popTarget() {
	Dep.target = targetStack.pop()
}