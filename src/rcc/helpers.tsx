export const toPascalCase = (str: string) =>
  str.replace(/^[a-z0-9]|-[a-z0-9]/g, (match) =>
    match.toUpperCase().replace('-', '')
  )

export const toCamelCase = (str: string) =>
  str.replace(/-[a-z0-9]/g, (match) => match.toUpperCase().replace('-', ''))

type ParseClassKey<K extends string> = K extends `${infer P1}-${infer P2}`
  ? ParseClassKey<`${P1}${Capitalize<P2>}`>
  : K

export const classNamesMapping = <
  T extends Record<string, string | { [K: string]: string }>
>(
  classnames?: T
) => {
  type Params = {
    [K in keyof T as ParseClassKey<K & string>]?: T[K] extends string
      ? boolean
      : keyof T[K]
  }

  const valuesMapping = Object.entries(classnames || {}).reduce(
    (prev, [key, value]) => {
      const camelKey = toCamelCase(key)
      prev[camelKey] = typeof value === 'string' ? { true: value } : value
      return prev
    },
    {}
  )
  const getClassName = (params?: Params & { className?: string }) => {
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
