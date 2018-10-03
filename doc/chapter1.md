# 项目搭建

## Vue概述

Vue.js是一套构建用户界面的渐进式框架。与其他重量级框架不同的是，Vue 采用自底向上增量开发的设计。Vue 的核心库只关注视图层，它不仅易于上手，还便于与第三方库或既有项目整合。另一方面，当与单文件组件和 Vue 生态系统支持的库结合使用时，Vue 也完全能够为复杂的单页应用程序提供驱动。
由于上述优点，Vue的使用在业界越来越广泛，截至本文写作时Vue在github上的star已经高达113322。

## Vue的中间件

### 生命周期

一个Vue实例具有许多阶段，例如observing data、initializing events、compiling template 及render，在这些阶段我们可以注册相应的钩子函数。

```javascript
  /*初始化生命周期*/
    initLifecycle(vm)
    /*初始化事件*/
    initEvents(vm)
    /*初始化render*/
    initRender(vm)
    /*调用beforeCreate钩子函数并且触发beforeCreate钩子事件*/
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    /*初始化props、methods、data、computed与watch*/
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    /*调用created钩子函数并且触发created钩子事件*/
    callHook(vm, 'created')
```

### 响应式

之所以称为响应式，是因为Vue.js实现了数据和视图的双向绑定，即数据发生变化后视图也随之变化。
其中Vue实现响应式的核心函数是Object.defineProperty,而且因为Object.defineProperty最低支持IE8,所以导致Vue只兼容到IE8。Vue使用Object.defineProperty来实现响应式的具体原理会在接下来的内容中进行详细讲解。

### 虚拟DOM

虚拟DOM是真实DOM的抽象,Vue的主要操作先是在虚拟DOM上进行的,最后再根据不同的平台来映射到真实DOM上，其中的核心是diff算法.

## 部署开发环境

本项目使用npm作为包管理器，因此构建myVue项目的第一件事，便是在空文件夹下使用```npm init```命令初始化项目。
项目初始化之后,在正式编写项目前，我们海需要下载和配置第三方工具，其中包括模块构建工具和测试工具。

### 设置Rollup

在该项目中我们使用Rollup作为打包工具。Rollup作为一款javascript打包工具，其支持ES2015语法，同时它也是Vue的打包工具。

使用Rollup前，首先是使用```npm install rollup rollup-watch --save-dev```命令安装Rollup相关包，安装完成后在根目录下创建```rollup.config.js```文件并进行一些基础配置。关于Rollup的进一步使用，请自行前往官网。

```javascript
export default {
  input: 'src/instance/index.js',
  output: {
    name: 'Vue',
    file: 'dist/vue.js',
    format: 'iife'
  },
};
```

### 配置测试工具Karma和jasmine

本项目采用karma作为自动化测试工具，jasmine作为单元测试工具，同样要想使用这两个工具，使用前需下载相关包并进行配置。
```javascript
npm install karma jasmine karma-jasmine karma-chrome-launcher buble --save-dev
npm install karma-rollup-plugin karma-rollup-preprocessor rollup-plugin-buble --save-dev
```
下载相关包后在根目录下创建```karma.conf.js```并配置。
```javascript
module.exports = function(config) {
  config.set({
    files: [{ pattern: 'test/**/*.spec.js', watched: false }],
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    preprocessors: {
      './test/**/*.js': ['rollup']
    },
    rollupPreprocessor: {
      plugins: [
        require('rollup-plugin-buble')(),
      ],
      output: {
        format: 'iife',
        name: 'Vue',
        sourcemap: 'inline'
      }
    }
  })
}
```

### 项目结构
项目搭建好的结构如下。

```javascript
- package.json
- rollup.config.js
- node_modules
- dist
- test
- src
	- observer
	- instance
	- util
	- vdom
```

### 配置启动命令

项目搭建好后，要想启动项目，我们可以在npm的配置文件中进行配置。
package.json
```javascript
"scripts": {
   "build": "rollup -c",
   "watch": "rollup -c -w",
   "test": "karma start"
}
```

## 起步

要想编写出高质量的代码，正式编程前我们最好养成编写代码前先编写测试用例进行单元测试的好习惯，下面我们就开始编写测试用例吧。

test/options/options.spec.js
```javascript
import Vue from "../src/instance/index";

describe('Proxy test', function() {
  it('should proxy vm._data.a = vm.a', function() {
  	var vm = new Vue({
  		data:{
  			a:2
  		}
  	})
    expect(vm.a).toEqual(2);
  });
});
```

编写测试用例后，我们的准备工作就全部完成了，我们就可以开始编写真正的代码了，此时是不是感到很激动。(毕竟特烦配置什么的了，特别是javaweb项目,想到当年被javaweb三大框架配置支配的恐惧就不禁内牛满面啊...)

要想实现Vue，自然是先编写Vue的构造函数，然后再一步一步的实现其他功能。

src/instance/index.js
```javascript
import { initMixin } from './init'

function Vue (options) {
  this._init(options)
}

initMixin(Vue)

export default Vue
```
上面只是Vue的构造器调用了```this._init```方法来初始化一个Vue的实例，而```initMixin``` 的作用便是给Vue定义原型方法，具体代码如下。

src/instance/init.js
```javascript
import { initState } from './state'

export function initMixin (Vue) {
  Vue.prototype._init = function (options) {
  	var vm = this
  	vm.$options = options
  	initState(vm)
  }
}
```
initMixin方法只是在Vue的原型上定义了```_init```方法，而```_init```方法则是调用了```initState```方法来初始化data。

src/instance/state.js
```javascript
export function initState(vm) {
  initData(vm)
}

function initData(vm) {
  var data = vm.$options.data
  vm._data = data
  // proxy data on instance
  var keys = Object.keys(data)

  var i = keys.length
  while (i--) {
    proxy(vm, keys[i])
  }
}

function proxy(vm, key) {
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter() {
        return vm._data[key]
      },
      set: function proxySetter(val) {
        vm._data[key] = val
      }
    })
}
```
如上```initState```方法只是调用了```initData```方法,而```initData```方法则是初始化了data并使用```proxy```方法将```vm._data.a```代理成```vm.a```。代理后能够降低数据结构深度，从而减少数据存取时的性能消耗。

```proxy```在```vm```上使用同样的key定义了一个属性,并通过 get/set 从```vm._data```上获取data。

最后使用```npm run test```命令启动项目。








