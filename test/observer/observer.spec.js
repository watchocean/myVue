import { Observer, observe, set as setProp, del as delProp } from "../../src/observer/index"
import { hasOwn, isObject} from '../../src/util/index'
import Dep from "../../src/observer/dep"

describe('Observer test', function() {
  it('observing set/del', function() {
  	const obj1 = { a:1}
    
    const ob1 = observe(obj1)
    const dep1 = ob1.dep
    spyOn(dep1, 'notify')
    setProp(obj1, 'b', 2)
    expect(obj1.b).toBe(2)
    expect(dep1.notify.calls.count()).toBe(1)
    delProp(obj1, 'a')
    expect(hasOwn(obj1, 'a')).toBe(false)
    expect(dep1.notify.calls.count()).toBe(2)

    setProp(obj1, 'b', 3)
    expect(obj1.b).toBe(3)
    expect(dep1.notify.calls.count()).toBe(2)
    // should ignore deleting non-existing key
    delProp(obj1, 'a')
    expect(dep1.notify.calls.count()).toBe(2)
  });

  	it('observing array mutation', () => {
	    const arr = [];
	    const ob = observe(arr)
	    const dep = ob.dep
	    spyOn(dep, 'notify')
	    const objs = [{}, {}, {}]
	    arr.push(objs[0])
	    arr.pop()
	    arr.unshift(objs[1])
	    arr.shift()
	    arr.splice(0, 0, objs[2])
	    arr.sort()
	    arr.reverse()
	    expect(dep.notify.calls.count()).toBe(7)
	    // inserted elements should be observed
	    objs.forEach(obj => {
	      expect(obj._ob_ instanceof Observer).toBe(true)
	    })
  });

});