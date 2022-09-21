import React from 'react'

import { toPascalCase } from './proxy-helpers'
import { findComponentKeys, findComponentPropsMap } from './classnames-parsers'

export const createComponentsData = (style: any) => {
  const search = Object.keys(style).join('\n') // multilines

  const componentsKeys = findComponentKeys(search)
  const componentPropsKeys = {} as { [componentName: string]: string[] }
  const emptyClassNamesMap = findComponentPropsMap(search, '')

  const emptyKey = Object.keys(emptyClassNamesMap).length ? ['__'] : []

  const $cn: Record<
    string,
    ($cn: { className?: string; [k: string]: any }) => string
  > = componentsKeys.concat(emptyKey).reduce((prev, componentKey) => {
    //
    const isEmptyKey = componentKey === '__'
    const componentName = isEmptyKey ? componentKey : toPascalCase(componentKey)
    const propClassMapping = isEmptyKey
      ? emptyClassNamesMap
      : findComponentPropsMap(search, componentKey)
    componentPropsKeys[componentName] = Object.keys(propClassMapping)
    //
    const getClassNames = ({ className: inputClassName, ...$cn }: any) => {
      //
      const componentClassName = Object.entries($cn || {}).reduce(
        (finalClassName, [$prop, propValue]) => {
          const dirtyClass = propClassMapping[$prop as string]
          const cleanClass =
            style[dirtyClass.replace('[?]', propValue as string) || '']
          return cleanClass ? finalClassName + ' ' + cleanClass : finalClassName
        },
        style[componentKey]
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
      const {
        children,
        $cn: { className, ...$cnProps } = { className: undefined },
        ...rest
      } = props

      const classDeps = PROPS_KEYS_ARR.map(
        (k) => $cnProps?.[k]
      ) as React.DependencyList

      const computedClassName = React.useMemo(
        () => $cn[componentName]($cnProps),
        // eslint-ignore-next-line react-hooks/exhaustive-deps
        classDeps
      )

      const inputClassName = className ? className + ' ' : ''

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
    createCSSCompponent
  }
}
