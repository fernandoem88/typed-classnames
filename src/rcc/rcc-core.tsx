import { htmlTagsProxy, prefixProxy, toPascalCase } from './proxy-helpers'
import { createComponentsData } from './create-components-data'
import { ClassNamesParser, RCCs } from '../../core'
import { ElementType } from 'react'
import { IS_DEV } from './constants'

export const styleParser = (style: any) => {
  const { $cn, createCSSCompponent, componentsKeys } =
    createComponentsData(style)

  const prefixRef = { value: 'S.' }

  const rccsData = componentsKeys.reduce((prev, componentKey) => {
    ;(createCSSCompponent as any).__prefix__ = prefixRef
    const isEmptyKey = componentKey === '__'
    const componentName = isEmptyKey ? componentKey : toPascalCase(componentKey)
    const getClassName = $cn[componentName]
    const rcc = htmlTagsProxy((tag) => {
      const newFC = createCSSCompponent(tag, getClassName)
      newFC.displayName = ''
      return newFC
    })
    rcc.__with = (tag: ElementType) => {
      const newFC = createCSSCompponent(tag as any, getClassName)
      if (IS_DEV) {
        newFC.defaultProps = {
          'data-rcc-name': newFC.displayName
        }
      }
      return newFC
    }
    return {
      ...prev,
      [toPascalCase(componentKey)]: rcc
    }
  }, {} as any)

  return {
    $cn,
    rccs: prefixProxy(rccsData, prefixRef) as RCCs<
      Record<string, ClassNamesParser>
    >
  }
}
