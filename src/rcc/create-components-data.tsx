import { findComponentKeys, findComponentPropsMap } from './classnames-parsers'

const toPascalCase = (str: string) =>
  str.replace(/^[a-z0-9]|-[a-z0-9]/g, (match) =>
    match.toUpperCase().replace('-', '')
  )

const mergeClassnames = (className?: string, initialClassName: string = '') => {
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
        rootClass
      )
      return mergeClassnames(inputClassName, componentClassName)
    }

    prev[componentName] = getClassNames
    return prev
  }, {} as any)

  return $cn
}
