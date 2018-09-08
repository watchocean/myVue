import Vue from '../instance/index'
import { initExtend } from './extend'
import { ASSET_TYPES } from '../shared/constants'
import { extend } from '../shared/util'

export function initGlobalAPI(vue) {
	Vue.options = Object.create(null)
  	ASSET_TYPES.forEach(type => {
    	Vue.options[type + 's'] = Object.create(null)
  	})
  	//_base被用来标识基本构造函数(vue), 以便在多场景下添加组件扩展
  	Vue.options._base = Vue

  	initExtend(Vue)
}