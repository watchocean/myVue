import Vue from '../instance/index'
import { initExtend } from './extend'
import { ASSET_TYPES } from '../shared/constants'
import { extend } from '../shared/util'

export function initGlobalAPI(vue) {
	Vue.options = Object.create(null)
  	ASSET_TYPES.forEach(type => {
    	Vue.options[type + 's'] = Object.create(null)
  	})

  	Vue.options._base = Vue

  	initExtend(Vue)
}