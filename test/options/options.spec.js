import Vue from "../../src/index";

//提前编写测试用例，测试是否代理成功
describe('Proxy test', function() {
	it('should Proxy vm._data.a = vm.a', function() {
		var vm = new Vue({
			data: {
				a: 2
			}
		})
		expect(vm.a).toEqual(2);
	});
}); 