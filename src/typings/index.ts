import { ComponentProps, ElementType } from 'react'

export interface LoaderComponentData {
  props: { [key: string]: any }
  extensions: Set<string>
  // to help avoiding props duplications in the component interface
  classNamesMemo: Set<string>
  // { "$props-key": "Component--class-name" }
  classNamesPropsMapping: { [key: string]: any }
  hasProps: boolean
}

export interface ComponentData {
  extensions: string[]
  propClassMapping: { [$prop: string]: string }
}

export type RCCElement<Props, Tag extends ElementType = 'div'> = (
  props: { $cn?: Props & { className?: string } } & Omit<
    ComponentProps<Tag>,
    'className'
  >
) => JSX.Element

export type RCC<Props> = {
  [K in keyof JSX.IntrinsicElements]: RCCElement<Props, K>
} & { __with: <C extends ElementType>(Component: C) => RCCElement<Props, C> }

export declare const styleParser: (style: any) => {
  $cn: {
    [component: string]: (props?: any) => string
  }
  rccs: {
    [component: string]: RCC<any>
  } & { __prefix__?: string }
}

export type RCCs<R extends Record<string, (props: any) => string>> = {
  [K in keyof R]: RCC<Parameters<R[K]>[0]>
} & { __prefix__?: string }

export type ClassNamesParser<P = {}> = (
  $cn?: P & { className?: string }
) => string
