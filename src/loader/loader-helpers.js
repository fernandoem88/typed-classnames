const fs = require('fs')
const path = require('path')

const pathSeparator = path.sep

function addParsedClassNameData(className, components) {
  const [cn, ...propsKeys] = className.split('--')
  const componentName = cn || '__'

  components[componentName] = components[componentName] || {
    ...getEmptyComponentData()
  }

  const {
    props: componentProps,
    classNamesMemo,
    classNamesPropsMapping
  } = getComponentByName(components, componentName)

  let memoKey = cn || ''

  propsKeys.forEach((propKey) => {
    memoKey += `--${propKey}`

    const isTernary = propKey.includes('_as_')
    if (classNamesMemo.has(memoKey)) {
      // don't do nothing
    } else if (isTernary) {
      const [ternaryValue, ternaryKey] = propKey.split('_as_')
      const $prop = toCamelCase(ternaryKey)
      const prevValues = componentProps[$prop] || ''
      const separator = prevValues ? ' | ' : ''
      componentProps[$prop] = `${prevValues}${separator}'${ternaryValue}'`
      //  classNamesPropsMapping helper
      classNamesPropsMapping[$prop] = classNamesPropsMapping[$prop] || {}

      classNamesPropsMapping[$prop][ternaryValue] = memoKey
    } else {
      const $prop = toCamelCase(propKey)
      componentProps[$prop] = 'boolean'
      classNamesPropsMapping[$prop] = memoKey
    }
    classNamesMemo.add(memoKey)
  })
}

function cleanCssString(cssString) {
  const separator = '_-||-_'
  const cleanedCssString = cssString
    // replace all new lines new lines with a special separator
    .replaceAll(/(\r\n|\r|\n)/gi, separator)
    // removing block comments /* */
    .replaceAll(/\/\*.*\*\//gi, '')
    // removing css attributes
    .replaceAll(/\{.[^}]*\}/gi, ',')
    // restore new line for .classes
    .replaceAll(separator, '\n')
    // removing inline comments //
    .replaceAll(/\/\/.*/gi, '')

  return cleanedCssString
}

function createStringContent(arr = [], separator = '\n') {
  return arr.join(separator)
}

// css module types
function createStyleType(className, prevContent = '') {
  // const [root] = className.split('--')

  const styleKey = className.includes('-') ? `"${className}"` : className
  const separator = prevContent ? '\n  ' : ''
  return `${prevContent}${separator}${styleKey}: string;`
}

function getClassInterfacesDefinition(components) {
  return Object.entries(components).reduce((prevInterfaceDef, entry) => {
    const [componentKey, componentData] = entry
    const { props, classNamesPropsMapping, hasProps } = componentData

    if (!hasProps || !componentKey) return prevInterfaceDef

    const propsContent = getComponentPropertiesDef(
      props,
      classNamesPropsMapping
    )

    const componentName =
      componentKey === '__' ? componentKey : toKebabCase(componentKey)

    const lastNewLine = propsContent ? '\n' : ''
    const firstNewLine = prevInterfaceDef ? '\n\n' : ''
    return `${prevInterfaceDef}${firstNewLine}export interface ${componentName}Props {${propsContent}${lastNewLine}}`
  }, '')
}

function getClassNamesFromCssString(cssString) {
  const cleanedCssString = cleanCssString(cssString)
  return Array.from(
    new Set(
      cleanedCssString.match(
        /(?<=\.)((?!\.|:|\/|,|\{|\(|\)|\}|\[|\]|\s).)+/gim
      ) || []
    )
  ).sort()
}

function getComponentByName(components, componentName) {
  const component = components[componentName]
  if (!component) {
    console.warn(`component "${componentName}" does not exist`)
  }
  return component || getEmptyComponentData()
}

function getComponentPropertiesDef(props, classNamesPropsMapping) {
  const propsContent = Object.entries(props)
    .map((propEntry) => {
      const [propKey, propType] = propEntry
      const camelCaseProp = toCamelCase(propKey)
      return `\n  ${camelCaseProp}?: ${propType};`
    })
    .join('')
  return propsContent
}

function getEmptyComponentData() {
  return {
    props: {},
    // to help avoiding props duplications in the component interface
    classNamesMemo: new Set([]),
    // { "$props-key": "Component--class-name" }
    classNamesPropsMapping: {},
    hasProps: false
  }
}

function getDevDebugPrefix(resource, options) {
  const { devDebugPrefix = 'S.' } = options
  if (typeof devDebugPrefix === 'function') {
    const paths = resource.split(pathSeparator)
    const fileName = paths.pop()
    return devDebugPrefix(fileName, paths.join(pathSeparator))
  }
  return devDebugPrefix
}

function getExportTypes(resource, options) {
  const { exports = {} } = options
  if (typeof exports === 'function') {
    const paths = resource.split(pathSeparator)
    const fileName = paths.pop()
    const { style = false, $cn = false } = exports(
      fileName,
      paths.join(pathSeparator)
    )
    return { style, $cn }
  }
  return exports || { style: false, $cn: false }
}

function getHasEmptyClassProps(components) {
  return !!Object.keys(components.__?.props ?? {}).length
}

function getHasOwnProps(components, componentName) {
  const componentProps =
    getComponentByName(components, componentName)?.props || {}
  return !!Object.keys(componentProps).length
}

/**
 *
 * @param {*} resource file resource path with extension
 * @param {*} options loader options
 * @returns new file name without extension
 */
function getNewFileName(resource, options) {
  const paths = resource.split(pathSeparator)
  const fileName = paths.pop()
  if (options.getOutputFileName) {
    return options.getOutputFileName(fileName, paths.join(pathSeparator))
  }
  const newFileName = fileName.replace(
    /(\.module)?\.(css|less|scss|sass)/g,
    '.rcc'
  )
  return newFileName
}

function getShouldCompileFromHash({ classNames, options, resource, rootDir }) {
  const esoHash = options._exportable.style ? '#stl_expo; ' : ''
  const rccHash = options._exportable.rccs ? '#rccs_expo; ' : ''
  const $cnHash = options._exportable.$cn ? '#$cn_expo; ' : ''
  const classesHash = `#clases=${classNames.join('|')};`
  const outputFilenameHash = `#ofn=${options._outputFileName};`
  const newHash = `##hash## ${esoHash}${$cnHash}${rccHash}${classesHash}${outputFilenameHash}`
  if (fs.existsSync(options._outputFilePath)) {
    const fileContent = fs.readFileSync(options._outputFilePath, 'utf8')
    const oldHash = fileContent
      .replaceAll(/(\r\n|\r|\n)/gi, '')
      .replace(/.*##hash##/g, '##hash##')
    return [oldHash !== newHash, newHash]
  }
  return [true, newHash]
}

const toKebabCase = (str) =>
  str.replace(/^[a-z0-9]|-[a-z0-9]/g, (match) =>
    match.toUpperCase().replace('-', '')
  )

const toCamelCase = (str) =>
  str.replace(/-[a-z0-9]/g, (match) => match.toUpperCase().replace('-', ''))

module.exports = {
  addParsedClassNameData,
  cleanCssString,
  createStringContent,
  createStyleType,
  getClassInterfacesDefinition,
  getClassNamesFromCssString,
  getComponentByName,
  getComponentPropertiesDef,
  getDevDebugPrefix,
  getEmptyComponentData,
  getExportTypes,
  getHasEmptyClassProps,
  getHasOwnProps,
  getNewFileName,
  getShouldCompileFromHash,
  toKebabCase
}
