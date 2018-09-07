import Vue from "../../src/index";
import Watcher from "../../src/observer/watcher";

describe('watcher test', function() {
	it('should call callback when simple data change', function() {
		var vm = new Vue({
			data: {
				a:3
			}
		})
		const cb = jasmine.createSpy('callback');
		var watcher = new Watcher(vm, function() {
			var a = vm.a
		}, cb)
		vm.a = 5;
	});
});