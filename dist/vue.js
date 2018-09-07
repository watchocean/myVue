var Vue = (function () {
	'use strict';

	function initState(vm) {
		// body...
		initData(vm);
	}
	//初始化data
	function initData(vm) {
		var data = vm.$options.data;
		vm._data = data;

		//将data代理到vm实例
		var keys = Object.keys(data);
		var i = keys.length;
		while(i--) {
			proxy(vm, keys[i]);
		}
	}

	function proxy(vm, key) {
		Object.defineProperty(vm, key, {
			configurable: true,
			enumerable: true,
			get: function proxyGetter() {
				return vm._data[key]
			},
			set : function proxySetter(val) {
				vm._data[key] = val;
			}
		});
	}

	//定义vue的原型初始方法
	function initMixin(Vue) {
		Vue.prototype._init = function(options) {
			var vm = this;
			vm.$options = options;
			initState(vm);
		};
	}

	//初始化VUE实例并输出
	function Vue (options) {
		this._init(options);
	}

	initMixin(Vue);

	return Vue;

}());
