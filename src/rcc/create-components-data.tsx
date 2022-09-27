import React from 'react'
import { toPascalCase } from './proxy-helpers'
import { findComponentKeys, findComponentPropsMap } from './classnames-parsers'

const parseInputClassName = (
  className?: string,
  initialClassName: string = ''
) => {
  return className ? initialClassName + ' ' + className : initialClassName
}

export const createComponentsData = (style: any) => {
  const search = Object.keys(style).join('\n') // multilines

  const componentsKeys = findComponentKeys(search)
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
        parseInputClassName(inputClassName, rootClass)
      )
      return componentClassName
    }

    prev[componentName] = getClassNames
    return prev
  }, {} as any)

  const createCSSCompponent = (
    Element: string,
    getClassName: (props: any) => string
  ) => {
    const CSSComponent: React.FC = React.forwardRef(function (props: any, ref) {
      //
      const { $cn, ...rest } = props
      const computedClassName = getClassName($cn)

      return <Element {...rest} ref={ref} className={computedClassName} />
    })

    return CSSComponent
  }

  return {
    $cn,
    createCSSCompponent,
    componentsKeys
  }
}
