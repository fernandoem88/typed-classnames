import { findComponentKeys, findComponentPropsMap } from '../classnames-parsers'

const style = {
  Btn: 's1',
  'btn--large-size': 's2',
  'btn--small-size': 's3',
  'delete-btn--bg-color': 's4'
}
let search = ''

beforeAll(() => {
  search = Object.keys(style).join('\n')
})

describe('css module style parser utils', () => {
  it('should create components data from module style', () => {
    const keys = findComponentKeys(search)
    expect(keys.includes('btn')).toBeTruthy()
    expect(keys.includes('delete-btn')).toBeTruthy()
  })

  it('should parse props properly for a given component', () => {
    const btnProps = findComponentPropsMap(search, 'btn')
    expect(btnProps['largeSize']).toBeDefined()
    expect(btnProps['smallSize']).toBeDefined()
    expect(btnProps['bgColor']).toBeUndefined()

    const deleteBtnProps = findComponentPropsMap(search, 'delete-btn')
    expect(deleteBtnProps['bgColor']).toBeDefined()
    expect(deleteBtnProps['smallSize']).toBeUndefined()
  })
})
