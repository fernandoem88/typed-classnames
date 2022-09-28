export interface LoaderComponentData {
  props: { [key: string]: any }

  // to help avoiding props duplications in the component interface
  classNamesMemo: Set<string>
  // { "$props-key": "Component--class-name" }
  classNamesPropsMapping: { [key: string]: any }
  hasProps: boolean
}

export declare const styleParser: (style: any) => {
  $cn: {
    [component: string]: ClassNamesParser<any>
  }
}

export type ClassNamesParser<P = {}> = (
  $cn?: P & { className?: string }
) => string

export declare const classNamesMapping: <
  T extends Record<
    string,
    | string
    | {
        [K: string]: string
      }
  >
>(
  classnames?: T | undefined
) => (
  params?:
    | (Params & {
        className?: string | undefined
      })
    | undefined
) => string
