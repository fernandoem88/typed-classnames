import React from 'react'
import { toPascalCase } from './proxy-helpers'
import { findComponentKeys, findComponentPropsMap } from './classnames-parsers'
import { IS_DEV } from './constants'

export const createComponentsData = (style: any) => {
  const search = Object.keys(style).join('\n') // multilines

  const componentsKeys = findComponentKeys(search)
  // const componentPropsKeys = {} as { [componentName: string]: string[] }
  const emptyClassNamesMap = findComponentPropsMap(search, '')

  if (Object.keys(emptyClassNamesMap).length) componentsKeys.push('__')

  const $cn: Record<
    string,
    (props: { className?: string; [k: string]: any }) => string
  > = componentsKeys.reduce((prev, componentKey) => {
    //
    const isEmptyKey = componentKey === '__'
    const componentName = isEmptyKey ? componentKey : toPascalCase(componentKey)
    const propClassMapping = isEmptyKey
      ? emptyClassNamesMap
      : findComponentPropsMap(search, componentKey)
    // componentPropsKeys[componentName] = Object.keys(propClassMapping)

    const rootClass = style[componentKey] || ''
    const getClassNames = ({ className: inputClassName, ...$cn }: any = {}) => {
      //

      const componentClassName = Object.entries($cn || {}).reduce(
        (finalClassName, [$prop, propValue]: any) => {
          //
          const dirtyClass = propClassMapping[$prop]
          if (!propValue || !dirtyClass) return finalClassName

          const styleKey = dirtyClass.replace('[?]', propValue) || ''
          const cleanClass = style[styleKey]
          return cleanClass ? finalClassName + ' ' + cleanClass : finalClassName
        },
        rootClass
      )
      return inputClassName
        ? componentClassName + ' ' + inputClassName
        : componentClassName
    }

    prev[componentName] = getClassNames
    return prev
  }, {} as any)

  const createCSSCompponent = (
    componentKey: string,
    Element: string,
    prefix: string = 'S.'
  ) => {
    const isEmptyKey = componentKey === '__'
    const componentName = isEmptyKey ? componentKey : toPascalCase(componentKey)
    // const PROPS_KEYS_ARR = componentPropsKeys[componentName]
    const CSSComponent: React.FC = React.forwardRef(function (props: any, ref) {
      //
      const { children, $cn: jj$CN, ...rest } = props
      const computedClassName = $cn[componentName](jj$CN)

      return (
        <Element {...rest} ref={ref} className={computedClassName}>
          {children}
        </Element>
      )
    })

    CSSComponent.displayName = `${prefix}${componentName}`
    if (IS_DEV) {
      CSSComponent.defaultProps = {
        'data-rcc-name': CSSComponent.displayName
      }
    }
    return CSSComponent
  }

  const withCreator = createCSSCompponent as any
  withCreator.__with = (component: any) =>
    createCSSCompponent(component, withCreator.__prefix__.value)

  return {
    $cn,
    createCSSCompponent,
    componentsKeys
  }
}
