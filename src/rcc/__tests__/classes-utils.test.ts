import {
  findComponentKeys,
  findComponentPropsMap,
  checkRecursiveExtensions
} from '../classnames-parsers'

const style = {
  Btn: 's1',
  'Btn--large-size': 's2',
  'Btn--small-size': 's3',
  DeleteBtn_ext_Btn: 's4',
  'DeleteBtn--bg-color': 's5'
}
let search = ''

beforeAll(() => {
  search = Object.keys(style).join('\n')
})

describe('css module style parser utils', () => {
  it('should create components data from module style', () => {
    const keys = findComponentKeys(search)
    expect(keys.Btn).toBeDefined()
    expect(keys.DeleteBtn).toBeDefined()
    expect(keys.DeleteBtn.extensions.length).toBe(1)
    expect(keys.DeleteBtn.extensions).toEqual(['Btn'])
  })

  it('should parse props properly for a given component', () => {
    const btnProps = findComponentPropsMap(search, 'Btn')
    expect(btnProps['largeSize']).toBeDefined()
    expect(btnProps['smallSize']).toBeDefined()
    expect(btnProps['bgColor']).toBeUndefined()

    const deleteBtnProps = findComponentPropsMap(search, 'DeleteBtn')
    expect(deleteBtnProps['bgColor']).toBeDefined()
    expect(deleteBtnProps['smallSize']).toBeUndefined()
  })

  it('should check recursive extension for the Btn component', () => {
    const root = 'Btn'

    expect(
      checkRecursiveExtensions(root, {
        Btn: { extensions: ['BaseBtn'] },
        BaseBtn: { extensions: [] }
      })
    ).toBeTruthy()

    expect(() => {
      checkRecursiveExtensions(root, {
        Btn: { extensions: [root] }
      })
    }).toThrowError()

    expect(() => {
      checkRecursiveExtensions(root, {
        Btn: { extensions: ['BaseBtn'] },
        BaseBtn: { extensions: [root] }
      })
    }).toThrowError()

    expect(() => {
      checkRecursiveExtensions(root, {
        Btn: { extensions: ['BaseBtn'] },
        BaseBtn: { extensions: ['DeleteBtn'] },
        DeleteBtn: { extensions: [root] }
      })
    }).toThrowError()
  })
})
