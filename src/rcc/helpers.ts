export const toPascalCase = (str: string) =>
  str.replace(/^[a-z0-9]|-[a-z0-9]/g, (match) =>
    match.toUpperCase().replace('-', '')
  )

export const toCamelCase = (str: string) =>
  str.replace(/-[a-z0-9]/g, (match) => match.toUpperCase().replace('-', ''))

export const classNamesMapping = <
  T extends Record<string, string | { [K: string]: string }>
>(
  classnames?: T
) => {
  const valuesMapping = Object.entries(classnames || {}).reduce(
    (prev, [key, value]) => {
      const camelKey = toCamelCase(key)
      prev[camelKey] = typeof value === 'string' ? { true: value } : value
      return prev
    },
    {}
  )
  const getClassName = (
    params?: { [K: string]: any } & { className?: string }
  ) => {
    const { className, ...rest } = params || {}
    return Object.entries(rest).reduce((prev, [key, value]) => {
      const cn = valuesMapping[key]?.[String(value)]
      if (!cn) {
        return prev
      }
      const separator = prev ? ' ' : ''
      return prev + separator + cn
    }, className || '')
  }
  return getClassName
}
