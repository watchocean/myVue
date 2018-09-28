# 响应式系统及实现

##　响应式原理

Vue.js的响应式原理依赖于Object.defineProperty，尤大大在Vue.js文档中就已经提到过，这也是Vue.js不支持IE8 以及更低版本浏览器的原因。Vue通过设定对象属性的 setter/getter 方法来监听数据的变化，通过getter进行依赖收集，而每个setter方法就是一个观察者，在数据变更的时候通知订阅者更新视图。

### Let data to observable

首先假定一种最简单的情况，不去考虑其他情况。在initData中会调用observe这个函数将Vue的数据设置成observable的。当_data数据发生改变的时候就会触发set，对订阅者进行回调（在这里是render）。

```javascript
function observe(value, cb) {
    Object.keys(value).forEach((key) => defineReactive(value, key, value[key] , cb))
}

function defineReactive (obj, key, val, cb) {
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: ()=>{
            /*....依赖收集等....*/
            /*Github:https://github.com/answershuto*/
            return val
        },
        set:newVal=> {
            val = newVal;
            cb();/*订阅者收到消息的回调*/
        }
    })
}
```
为了操作方便，我们需要将```_data```上的数据代理到vm实例上.
```javascript
function proxy (data) {
    const that = this;
    Object.keys(data).forEach(key => {
        Object.defineProperty(that, key, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter () {
                return that._data[key];
            },
            set: function proxySetter (val) {
                that._data[key] = val;
            }
        })
    });
}
```

## 依赖收集

### 依赖收集的原因

按照上面的方法进行绑定会出现一个问题——实际模板中未使用的数据被更改后也会进行重新渲染，而这样无疑会消耗性能，因此需要依赖收集来保证只渲染实际模板中使用到的数据。

### Dep

当对data上的对象进行修改值的时候会触发它的setter，那么取值的时候自然就会触发getter事件，所以我们只要在最开始进行一次render，那么所有被渲染所依赖的data中的数据就会被getter收集到Dep的subs中去。在对data中的数据进行修改的时候setter只会触发Dep的subs的函数.

```Dep.prototype.depend```方法是将观察者Watcher实例赋值给全局的Dep.target，然后触发render操作只有被Dep.target标记过的才会进行依赖收集。有Dep.target的对象会将Watcher的实例push到subs中，在对象被修改触发setter操作的时候dep会调用subs中的Watcher实例的update方法来重新获取数据生成虚拟节点，再由服务端将虚拟节点渲染成真实DOM。

src/oberver/dep.js

```javascript
var uid = 0;

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

function remove (arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
    }
}
```

## 实现

上面讲述响应式原理和依赖收集的原因，接下来就来简单实现一下。开始正式编程前，照常先写测试用例。

test/observer/observer.spec.js

```javascript
import {
  Observer,
  observe
} from "../../src/observer/index"
import Dep from '../../src/observer/dep'

describe('Observer test', function() {
  it('observing object prop change', function() {
  	const obj = { a:1, b:{a:1}, c:NaN}
    observe(obj)
    // mock a watcher!
    const watcher = {
      deps: [],
      addDep (dep) {
        this.deps.push(dep)
        dep.addSub(this)
      },
      update: jasmine.createSpy()
    }
    // observing primitive value
    Dep.target = watcher
    obj.a
    Dep.target = null
    expect(watcher.deps.length).toBe(1) // obj.a
  });

});
```

接下来正式实现数据绑定，其中```observe```的作用是返回一个```observer```实例，而```observer```则负责实现数据绑定.

src/observer/index.js

```javascript
import {
  def, //new
  hasOwn,
  isObject
}
from '../util/index'

export function Observer(value) {
  this.value = value
  this.dep = new Dep()
  this.walk(value)
  def(value, '__ob__', this)
}

export function observe (value){
  if (!isObject(value)) {
    return
  }
  var ob
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }
  return ob
}

Observer.prototype.walk = function(obj) {
  var keys = Object.keys(obj)
  for (var i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
  }
}

export function defineReactive (obj, key, val) {
  var dep = new Dep()
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = val
      if (Dep.target) {
        dep.depend()
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value =  val
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
	   val = newVal
      dep.notify()
    }
  })
}
```

在上面的代码中我们用到了一些工具函数，下面我们就把这些工具函数在单独的文件中实现，方便之后其他组件的调用。

src/util/index.js

```javascript
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
```
上面已经简单实现了数据绑定，接下来不妨使用```npm run test```命令来测试下项目吧。