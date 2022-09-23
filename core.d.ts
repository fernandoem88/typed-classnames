import { ComponentProps, ElementType } from 'react'

export interface LoaderComponentData {
  props: { [key: string]: any }

  // to help avoiding props duplications in the component interface
  classNamesMemo: Set<string>
  // { "$props-key": "Component--class-name" }
  classNamesPropsMapping: { [key: string]: any }
  hasProps: boolean
}

export type RCCElement<Props, Tag extends ElementType = 'div'> = (
  props: { $cn?: Props } & Omit<ComponentProps<Tag>, 'className'>
) => JSX.Element

export type RCC<Props> = {
  [K in keyof JSX.IntrinsicElements]: RCCElement<Props, K>
} & { __with: <C extends ElementType>(Component: C) => RCCElement<Props, C> }

export declare const styleParser: (style: any) => {
  $cn: {
    [component: string]: ClassNamesParser<any>
  }
  rccs: any
}

export type RCCs<R extends Record<string, ClassNamesParser>> = {
  [K in keyof R]: RCC<Parameters<R[K]>[0]>
} & { __prefix__?: string }

export type ClassNamesParser<P = {}> = (
  $cn?: P & { className?: string }
) => string
