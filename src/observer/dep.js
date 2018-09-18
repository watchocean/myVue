import { remove } from "../util/index"

let uid = 0;

//dep构造函数
export default function Dep(argument) {
	this.id = uid++
	this.subs = []
}
//添加一个观察者对象
Dep.prototype.addSub = function(sub) {
	this.subs.push(sub)
}
//移除一个观察者对象
Dep.prototype.removeSub = function(sub) {
	remove(this.subs, sub)
}
//依赖收集
Dep.prototype.depend = function() {
	if(Dep.target) {
		Dep.target.addDep(this)
	}
}
//通知所有订阅者
Dep.prototype.notify = function() {
	var subs = this.subs.slice()
	for(var i = 0, l = subs.length; i < l; i++){
		subs[i].update()
	}
}

Dep.target = null

let targetStack = []
//将watcher观察者实例赋给Dep.target，用以依赖收集。同时将该实例存入target栈中
export function pushTarget(_target) {
	if (Dep.target) {
		targetStack.push(Dep.target)
	}
	Dep.target = _target
}
//将观察者实例从target栈中取出并设置给Dep.target
export function popTarget() {
	Dep.target = targetStack.pop()
}
