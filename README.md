# Typed classnames loader

[![NPM](https://img.shields.io/npm/v/typed-classnames.svg)](https://www.npmjs.com/package/typed-classnames)

> This webpack loader is built to generate types from an imported css module and map its classes in order to use props instead of classNames.
>
> - **type definition for css module classNames**
> - **fast classNames mapping**
> - **easy to debug in React dev tools**

let's suppose to have the following scss file _my-app.module.scss_

```scss
.root {
  background: white;
  color: black;
  &--dark-mode {
    background: black;
    color: white;
  }
}

.btn {
  border: solid 1px black;
  border-radius: 3px;
  cursor: pointer;
  &--sm-size {
    font-size: 10px;
  }
  &--md-size {
    font-size: 12px;
  }
  &--lg-size {
    font-size: 14px;
  }
}

.delete-btn {
  background: red;
  color: white;
  &--disabled {
    pointer-events: none;
    background: gray;
  }
}
```

for a quick test, let's define a test.js file where we can use the **styleCompiler** utility.

## exports option: style

```js
// test.js
const { styleCompiler } = require('typed-css-compponents')
styleCompiler('./my-app.module.scss', __dirname, { exports: { style: true } })
```

if we run **node ./test.js** on the terminal, the following file _my-app.rcc.tsx_ will be generated.

```tsx
import _style from './my-app.module.scss'

export interface ModuleStyle {
  root: string
  'root--dark-mode': string
  btn: string
  'btn--sm-size': string
  'btn--md-size': string
  'btn--lg-size': string
  'delete-btn': string
  'delete-btn--disabled': string
}

export const style: ModuleStyle = _style as any

// ##hash## this hash is used for caching purpose: to not generate this file again if there are no changes
```

## exports option: $cn

now if we change the configuration options to **exports: { $cn: true }**, the generated file will export a utility functions factory (**$cn**) where all classes are already mapped.

```js
// test.js
const { styleCompiler } = require('typed-css-compponents')
styleCompiler('./my-app.module.scss', __dirname, { exports: { $cn: true } })
```

this configuration will generate the following file content

```tsx
import { styleParser } from 'typed-classnames/core'
import { ClassNamesParser, RCCs } from 'typed-classnames/dist/src/typings'
import _style from './my-app.module.scss'

export interface GlobalClasses {
  className?: string
}

export interface RootProps {
  darkMode?: boolean
}

export interface BtnProps {
  smSize?: boolean
  mdSize?: boolean
  lgSize?: boolean
}

export interface DeleteBtnProps {
  disabled?: boolean
}

const data = styleParser(_style)

export const $cn = data.$cn as {
  Root: (props?: RootProps) => string
  Btn: (props?: BtnProps) => string
  DeleteBtn: (props?: DeleteBtnProps) => string
}

const cssComponents = data.rccs as RCCs<typeof $cn>

export default cssComponents

// ##hash##
```

NOTE: in case your IDE lint complains about "typed-classnames/core". you should add a declaration file to your project.

```ts
// index.d.ts
declare module 'typed-classnames/core'
```

now we can use the **$cn** utility in our main component _MyComponent.tsx_

```tsx
import { $cn } from './my-app.rcc'

const MyComponent = ({
  darkMode,
  disabled,
  size
}: {
  darkMode: boolean
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}) => {
  return (
    // pass our classNames values to the "$cn" prop
    <div className={$cn.Root({ darkMode })}>
      <button className={$cn.Btn({ className: 'extra class names' })}>
        I am a button with .btn and .extra .class .names classes
      </button>
      <button
        className={$cn.btn({
          disabled,
          smSize: size === 'sm',
          mdSize: size === 'md'
        })}
      >
        I am a button with variable size
      </button>
      // extending another class
      <button
        className={$cn.DeleteBtn({
          disabled,
          className: $cn.Btn({ smSize: true })
        })}
      >
        DeleteBtn will also have Btn classes
      </button>
    </div>
  )
}
```

or we can use the cssComponents factory instead

```tsx
import S, { $cn } from './my-app.rcc'

const MyComponent = ({
  darkMode,
  disabled,
  size
}: {
  darkMode: boolean
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}) => {
  return (
    // pass our classNames values to the "$cn" prop
    <S.Root.div $cn={{ darkMode }}>
      <S.Btn.button $cn={{ className: 'extra class names' }}>
        I am a button with .btn and .extra .class .names classes
      </S.Btn.button>
      <S.Btn.button
        $cn={{
          disabled,
          smSize: size === 'sm',
          mdSize: size === 'md'
        }}
      >
        I am a button with variable size
      </s.Btn.button>
      // to extend another class, we need to use the $cn factory
      <S.Delete.button
        $cn={{
          disabled,
          className: $cn.Btn({ smSize: true })
        }}
      >
        DeleteBtn will also have Btn classes
      </S.Delete.button>
    </S.Root.div>
  )
}
```

# ClassNames definition

in case we decide to use [$cn](#exports-option-$cn), understanding some special definition can be useful

## Component Class.

the react-css-component name comes from **the root class definition**. Each _component class_ will be transformed to a **PascalCase**.

```scss
.root {
  // => Root
}

.item-wrapper {
  // =>ItemWrapper
}

// Note!!!
// the following classes will create unexpected behaviour because they will have the same component names

.content-wrapper {
  // => ContentWrapper
}
.-content-wrapper {
  // => ContentWrapper
}
// to avoid confusion, we can also directly define our component classes in PascalCase
.Root {
}
.ContentWrapper {
}
```

## component property class

A component property class is the element modifier. It should start with the component root name followed by double dashes. Each _component property_ can be written in **kebab-case** (eg: .Component--**prop-one**).
However, its output will be in **camelCase**

```scss
.Wrapper {
  &--dark-mode {
  }
  &--size {
  }
}
// the $cn.Wrapper component will then have 2 props
// darkMode: that comes from .Wrapper--dark-mode
// size: that comes from .Wrapper--size
```

## ternary property class

some times we define a bunch of classes and want to use only one at the time excluding other ones: A or B or C. to do so, we need to use the special key **\_as\_**

```scss
.Btn {
  &--red_as_color {
    color: green;
  }
  &--yellow_as_color {
    color: yellow;
  }
}

// color will be the props defined by the union type green and yellow
// color?: 'green' | 'yellow'
```

we can then use it in tsx file like this

```tsx
import S, { $cn } from './my-app.rcc'

export const MyApp = ({ color }: { color: 'yellow' | 'green' }) => {
  return <button className={$cn.Btn({ color })}>click me</button>
  // or
  return <S.Btn.button $cn={{ color }}>click me</S.Btn.button>
}
```

## with a custom component

we can bind a component with some css coomponents like this

```tsx
import S from './my-app.rcc'
import Wrapper from './Wrapper'

// Root Wrapper will have .root class and all its relative modifier props
const RootWrapper = S.Root.__with(Wrapper)

const MyApp = ({ color }) => {
  return <RootWrapper $cn={{ color }} />
}
```

# Component name prefix

by default our _css components_ in react dev tools will appear like this: **<S.Root.div />**.
we can set their \_\_prefix\_\_ value to a more specific name, for example to have **<Card.Root.div />**

```tsx

import Card from './my-style.rcc'

Card .__prefix__ = "Card."

export const MyComponent = () => {
  return <Card.Root.div>Hello World</S.Root.div>
}
```

## how to Install

```bash
npm i -D typed-classnames
```

## use and options

see default Configuration example with nextjs

```ts
const nextConfig = {
  // ...
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    const rccLoaderRule = {
      test: /\.module\.scss$/,
      use: [
        {
          loader: 'typed-classnames',
          options: {
            /**
             * enabled: (required) the loader should be enabled only in Dev environment.
             * alternatively we can just, add the rccLoaderRule to webpack only in dev and set enabled to true by default
             */
            enabled: !!dev && isServer,
            /**
             * exports: (required: { rcc: boolean, style: boolean, $cn: boolean } | Function).
             * at least one of the 3 parameters should be true
             * exports.style: false by default. set it to true in case we want to export ModuleStyle definitions.
             * exports.$cn: false by default. set it to true in case we want to export $cn and the cssComponents factories.
             
             *  we can use a function in case we want to set different values for given files/name templates
             * eg: (filename, fileDir) => /-eso\.module\.scss$/.test(filename) ? { style: true } : { $cn: true }
             * in this case, my-style-eso.module.scss for example will export only the ModuleStyle type
             **/
            exports: { style: false, $cn: true },
            // getOutputFileName: (optional), to generate file with different name then the defualt one.
            getOutputFileName: (filename, fileDir) =>
              `awesomename-${filename.replace('.module.scss', '')}`,
            // sassOptions: (optional) - sassOptions to pass to sass compiler
            // => sass.compileString(cssString, sassOptions). for example to resolve absolute imports, etc.
            sassOptions: {}
          }
        }
      ]
    }

    config.module.rules = config.module.rules ?? []
    config.module.rules.push(rccLoaderRule)

    return config
  }
}
```

after setting up the config, we will first use the **styleParser** transformer in our react component. for example in _MyComponent.tsx_

```tsx
import { styleParser } from 'typed-classnames/core'
import style from './my-style.module.scss'

// S type is an index { [key: string]: Record<HtmlTag, RCC<any>> }
const { rccs: S, $cn } = styleParser(style)

export const MyComponent = () => {
  return <div className={$cn.Root()}>Hello world</div>
  // 0r
  return <S.Root.div>Hello World again</S.Root.div>
}
```

after running the project, the _my-style.rcc.tsx_ file will be generated automatically so we can import the $cn and cssComponents directly from there.

```tsx
// here S is fully typed
import S from './my-style.rcc'

export const MyComponent = () => {
  return <S.Root.div>Hello World</S.Root.div>
}
```

# License

MIT © [https://github.com/fernandoem88/typed-classnames](https://github.com/fernandoem88/typed-classnames)
