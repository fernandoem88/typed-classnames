// return a dictionary of component keys which value is its extensions array
export const findComponentKeys = (globalSearch: string) => {
  const componentsKeys = new Set<string>([])
  // starts with a-Z,
  // not contains double dashes (zero or more) or is before double dashes
  const reg = /^[a-z]((?!--|_ext_).)*(?=--|_ext_)?/gim

  globalSearch.replace(reg, (...args) => {
    const [componentName] = args
    componentsKeys.add(componentName)
    return ''
  })

  return Array.from(componentsKeys)
}

const toCamelCase = (str: string) =>
  str.replace(/-[a-z0-9]/g, (match) => match.toUpperCase().replace('-', ''))

/**
 *
 * @param globalSearch
 * @param component
 * @returns
 *
 * @example // example of a returned map
 * const RootClassesMap = {
 *  red_as_color: 'Root--red_as_color',
 *   green_as_color: 'Root--green_as_color',
 *   yellow_as_color: 'Root--yellow_as_color',
 *   'dark-yellow': 'Root--yellow_as_color--dark-yellow',
 *   'sub-dark-yellow': 'Root--yellow_as_color--dark-yellow--sub-dark-yellow',
 *   'border-radius': 'Root--border-radius'
 * }
 */
export const findComponentPropsMap = (
  globalSearch: string,
  component: string
) => {
  // ($0 = starts with Component--) ($1 = maybe some string with double dashes) ($2 = ends with property part)
  // const reg = new RegExp(`(?<=${component}--)(.+--)*(.+)$`, "gm");
  const reg = new RegExp(`^(${component}--)(.+--)*(.+)$`, 'gm')

  const propsMap: { [$prop: string]: string } = {}

  globalSearch.replace(reg, (...classParts) => {
    const [, prefix, mainClass = '', suffix] = classParts
    const [tValue, tProp] = suffix.split('_as_')
    const isTernary = suffix.indexOf('_as_') !== -1
    const $prop = isTernary ? tProp : suffix
    const placeholder = isTernary ? suffix.replace(tValue, '[?]') : suffix
    propsMap[toCamelCase($prop)] = `${prefix}${mainClass}${placeholder}`
    return ''
  })

  return propsMap
}
