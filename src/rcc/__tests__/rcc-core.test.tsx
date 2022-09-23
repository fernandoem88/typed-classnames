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

  const data = styleParser(style as any)

  const $cn = data.$cn as {
    Wrapper: ClassNamesParser<{ darkMode?: boolean }>
    Btn: ClassNamesParser<{ size?: 'sm' | 'lg' }>
    DeleteBtn: ClassNamesParser<{ borderRadius2px?: boolean }>
  }

  const S = data.rccs as RCCs<typeof $cn>

  it('should test $cn', () => {
    //
    expect($cn.Btn()).toContain('btn')

    expect($cn.Btn({ size: 'lg' })).toBe('btn btn--lg_as_size')
    expect($cn.Btn({ className: 'pippo' })).toContain('pippo')

    expect(
      $cn.Btn({ size: 'sm', className: $cn.Wrapper({ className: 'pippo' }) })
    ).toBe('btn btn--sm_as_size wrapper pippo')
  })

  it('should render Wrapper component with the correct classname', async () => {
    render(<S.Wrapper.div>I am a wrapper</S.Wrapper.div>)
    const el = await screen.findByText('I am a wrapper')

    expect(el.className).toContain('wrapper')
    expect(el.tagName).toBe('DIV')
  })

  it('should render Wrapper component as a span element', async () => {
    render(<S.Wrapper.span>I am a span</S.Wrapper.span>)

    const el = await screen.findByText('I am a span')
    expect(el.className).toContain('wrapper')
    expect(el.tagName).toBe('SPAN')
  })

  it('should map Wrapper components props properly', async () => {
    render(
      <React.Fragment>
        <S.Wrapper.div $cn={{ darkMode: true }}>dark mode</S.Wrapper.div>
        <S.Wrapper.div>no dark mode</S.Wrapper.div>
      </React.Fragment>
    )
    const darkModeEl = await screen.findByText('dark mode')
    expect(darkModeEl.className).toContain('wrapper')
    expect(darkModeEl.className).toContain('wrapper--dark-mode')

    const noDarkModeEl = await screen.findByText('no dark mode')
    expect(noDarkModeEl.className).toContain('wrapper')
    expect(noDarkModeEl.className.includes('wrapper--dark-mode')).toBeFalsy()
  })

  it('should handle ternary class props properly', async () => {
    render(
      <React.Fragment>
        <S.Btn.button $cn={{ size: 'sm' }}>small button</S.Btn.button>
        <S.Btn.button $cn={{ size: 'lg' }}>large button</S.Btn.button>
      </React.Fragment>
    )
    const smBtn = await screen.findByText('small button')
    expect(smBtn.className).toContain('btn')
    expect(smBtn.className).toContain('btn--sm_as_size')
    expect(smBtn.className.includes('btn--lg_as_size')).toBeFalsy()

    const lgBtn = await screen.findByText('large button')
    expect(lgBtn.className).toContain('btn')
    expect(lgBtn.className).toContain('btn--lg_as_size')
    expect(lgBtn.className.includes('btn--sm_as_size')).toBeFalsy()
  })

  it('should handle extension props properly', async () => {
    render(
      <React.Fragment>
        <S.DeleteBtn.button>I am a button</S.DeleteBtn.button>
        <S.DeleteBtn.button $cn={{ className: $cn.Btn({ size: 'lg' }) }}>
          button with size
        </S.DeleteBtn.button>
      </React.Fragment>
    )
    const btn = await screen.findByText('I am a button')
    expect(btn.className).toContain('delete-btn')
    expect(btn.className.split(' ').includes('btn')).toBeFalsy()

    const btnWithSize = await screen.findByText('button with size')
    expect(btnWithSize.className).toContain('delete-btn')
    // Btn extends base-btn so it should have also base-btn class
    expect(btnWithSize.className).toContain('btn')
    expect(btnWithSize.className).toContain('btn--lg_as_size')
  })
})
