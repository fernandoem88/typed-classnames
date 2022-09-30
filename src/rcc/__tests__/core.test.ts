import { styleParser, classNamesMapping } from '../core'
import { ClassNamesParser } from '../../../core'

const styleArr = [
  '--DEFAULT',
  'wrapper',
  'wrapper--dark-mode',
  'base-btn',
  'base-btn--size',
  'btn_ext_base-btn',
  'btn',
  'btn--sm_as_size',
  'btn--lg_as_size',
  'delete-btn',
  'delete-btn_ext_btn',
  'delete-btn--border-radius-2px',
  '--fs-12px_as_font-size',
  '--fs-15px_as_font-size'
]

describe('classnames $cn', () => {
  const style = styleArr.reduce((prev, key) => {
    return { ...prev, [key]: key }
  }, {} as { [key: string]: string })

  const $cn = styleParser(style as any) as {
    Wrapper: ClassNamesParser<{ darkMode?: boolean }>
    Btn: ClassNamesParser<{ size?: 'sm' | 'lg' }>
    DeleteBtn: ClassNamesParser<{ borderRadius2px?: boolean }>
  }

  it('should test $cn', () => {
    // main class
    expect($cn.Btn()).toBe('btn')
    // lisoko does not exist in style object so it should be ignored
    expect($cn.Btn({ lisoko: true } as any)).toBe('btn')

    // ternary values test
    expect($cn.Btn({ size: 'lg' })).toBe('btn btn--lg_as_size')
    // external className
    expect($cn.Btn({ className: 'pippo' })).toBe('btn pippo')

    expect(
      $cn.Btn({ size: 'sm', className: $cn.Wrapper({ className: 'pippo' }) })
    ).toBe('btn btn--sm_as_size wrapper pippo')
  })
})

describe('classnamesMapping', () => {
  it('should test the classnamesMapping utility', () => {
    const mui = classNamesMapping({
      bgColor: 'mui--backgound',
      flex: 'mui--flex',
      color: {
        primary: 'mui--color-primary',
        secondary: 'mui--color-secondary'
      }
    })

    expect(mui({ bgColor: true })).toBe('mui--backgound')
    // should ignore a falsy value
    expect(mui({ bgColor: true, flex: false })).toBe('mui--backgound')
    // should resolve more than one truphy values correctly
    expect(mui({ bgColor: true, flex: true })).toBe('mui--backgound mui--flex')
    // should resolve the ternary value correctly
    expect(mui({ color: 'primary' })).toBe('mui--color-primary')
    // should append the classname string value
    expect(mui({ color: 'secondary', className: 'mui mui--bold' })).toBe(
      'mui mui--bold mui--color-secondary'
    )
  })
})
