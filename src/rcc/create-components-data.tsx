import React from 'react'
import { toPascalCase } from './proxy-helpers'
import { findComponentKeys, findComponentPropsMap } from './classnames-parsers'

export const createComponentsData = (style: any) => {
  const search = Object.keys(style).join('\n') // multilines

  const componentsKeys = findComponentKeys(search)
  const componentPropsKeys = {} as { [componentName: string]: string[] }
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
    componentPropsKeys[componentName] = Object.keys(propClassMapping)

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
    const PROPS_KEYS_ARR = componentPropsKeys[componentName]
    const CSSComponent: React.FC = React.forwardRef(function (props: any, ref) {
      //
      const { children, $cn: jj$CN, ...rest } = props
      const { className, ...$cnProps } = jj$CN || { className: undefined }
      const inputClassName = className ? className + ' ' : ''
      const classDeps = PROPS_KEYS_ARR.map((k) => $cnProps?.[k])

      const computedClassName = React.useMemo(
        () => $cn[componentName]($cnProps),
        // eslint-ignore-next-line react-hooks/exhaustive-deps
        classDeps as React.DependencyList
      )

      return (
        <Element
          {...rest}
          ref={ref}
          className={inputClassName + computedClassName}
        >
          {children}
        </Element>
      )
    })

    CSSComponent.displayName = `${prefix}${componentName}`
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
