import React from 'react'
import { EMPTY_HTML_TAGS, EMPTY_SVG_TAGS } from './constants'

const isHTMLTag = (tag: string) =>
  tag in EMPTY_HTML_TAGS || tag in EMPTY_SVG_TAGS

export const toPascalCase = (str: string) =>
  str.replace(/^[a-z0-9]|-[a-z0-9]/g, (match) =>
    match.toUpperCase().replace('-', '')
  )

export const htmlTagsProxy = (
  createRCCWithTag: (tag: string, prefix: string) => React.FC,
  prefixRef: { value: string }
) => {
  if (typeof Proxy === 'undefined') {
    return createRCCWithTag as any
  }

  const getHtmlTag = (target: any, prop: any) => {
    if (isHTMLTag(prop)) {
      const newFC = createRCCWithTag(prop, prefixRef.value)
      newFC.displayName = `${newFC.displayName}.${prop}`
      target[prop] = newFC
      return newFC
    }
    return undefined
  }

  return new Proxy({} as any, {
    get(target, prop: string) {
      return target[prop] || getHtmlTag(target, prop)
    }
  })
}
/**
 * @example
 * rccs.__prefix__ = "Card." // => all components displayName should start with Card.
 */
export const prefixProxy = (rccs: any, prefixRef: { value: string }) => {
  return new Proxy(rccs, {
    set(_, prop, value) {
      if (prop === '__prefix__' && typeof value === 'string') {
        prefixRef.value = value
        return true
      }
      console.warn('only __prefix__ attribute can be changed')
      return false
    }
  })
}
