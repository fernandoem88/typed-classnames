import React from 'react'
import { render, screen } from '@testing-library/react'
import { styleParser } from '../rcc-core'
import { ClassNamesParser, RCCs } from '../../../core'

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

describe('components classnames and props mapping', () => {
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
