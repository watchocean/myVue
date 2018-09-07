import { createElement } from '../vdom/create-element'
//初始化渲染函数
export function initRender (vm) {
	vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  	vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
}

export function renderMixin (Vue) {
  	Vue.prototype.$nextTick = function (fn) {

  	}
  	Vue.prototype._render = function () {

  	}
}