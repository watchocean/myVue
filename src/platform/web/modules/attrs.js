import { isDef, isUndef } from '../../../util/index'
import { isBooleanAttr, isEnumeratedAttr, isFalsyAttrValue } from '../util'

function updateAttrs(oldVnode, vnode) {
  const opts = vnode.componentOptions
  let key, cur, old
  const elm = vnode.elm
  const oldAttrs = oldVnode.data.attrs || {}
  let attrs = vnode.data.attrs || {}

  for (key in attrs) {
    cur = attrs[key]
    old = oldAttrs[key]
    if (old !== cur) {
      setAttr(elm, key, cur)
    }
  }

  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      elm.removeAttribute(key)
    }
  }
}

function setAttr(el, key, value) {
  if (isBooleanAttr(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key)
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED'
        ? 'true'
        : key
      el.setAttribute(key, value)
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true')
  } else {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs
}