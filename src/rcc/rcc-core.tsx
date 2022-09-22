import { RCC } from '../typings'
import { htmlTagsProxy, prefixProxy, toPascalCase } from './proxy-helpers'

import { createComponentsData } from './create-components-data'

export const styleParser = (style: any) => {
  const { $cn, createCSSCompponent, componentsKeys } =
    createComponentsData(style)

  const prefixRef = { value: 'S.' }

  const rccsData = componentsKeys.reduce((prev, componentKey) => {
    ;(createCSSCompponent as any).__prefix__ = prefixRef
    return {
      ...prev,
      [toPascalCase(componentKey)]: htmlTagsProxy(
        (tag, prefixValue) =>
          createCSSCompponent(componentKey, tag, prefixValue),
        prefixRef
      )
    }
  }, {} as any)

  return {
    $cn,
    rccs: prefixProxy(rccsData, prefixRef) as {
      [Key: string]: any
    }
  }
}
