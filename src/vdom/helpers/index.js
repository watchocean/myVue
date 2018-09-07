import { hasOwn, isDef, isUndef} from '../../util/index'
import { hyphenate } from '../../shared/util'

export function extractPropsFromVNodeData(data, Ctor, tag) {
	//处理额外的原始值和组件自身
	const propOptions = Ctor.options.props
	if (isUndef(propOptions)) {
		return
	}
	const res = {}
	const { attrs, props} = data
	if (isDef(attrs) || isDef(props)) {
		for (const key in propOptions) {
			const altKey = hyphenate(key)
			checkProp(res, props, key, altKey, true) || checkProp(res, attrs, key, altKey, false)

		}
	}
	return res
}

function checkProp(res, hash, key, altKey, preserve) {
	if (isDef(hash)) {
		if (hasOwn(hash, key)) {
			res[key] = hash[key]
			if (!preserve) {
				delete hash[key]
			}
			return true
		} else if (hasOwn(hash, altKey)) {
			res[key] = hash[altKey]
      		if (!preserve) {
        		delete hash[altKey]
      		}
      		return true
		}
	}
	return false
}