const fs = require('fs')
const path = require('path')
const sass = require('sass')

const helpers = require('./loader-helpers')

const pathSeparator = path.sep

const utils = { fs, path }

function rccLoader(content, map, meta) {
  const options = this.getOptions()

  if (!options.enabled) return

  const paths = this.resource.split(pathSeparator)
  const resourceFileName = paths.pop()

  options._exportable = helpers.getExportTypes(this.resource, options)
  options._logger = this.getLogger()
  const { style: exportableStyle, $cn: exportableCN } = options._exportable

  if (!exportableStyle && !exportableCN) {
    options._logger('rcc loader disabled')
    return content
  }

  options._getFSModule = () => this.fs
  options._resource = this.resource.replace(this.rootContext, '.')
  options._outputFileName = helpers.getNewFileName(this.resource, options)

  options._outputFilePath = utils.path.resolve(
    paths.join(pathSeparator),
    `${options._outputFileName}.tsx`
  )

  const cssString = sass.compileString(content, options.sassOptions || {}).css
  const classNamesArray = helpers.getClassNamesFromCssString(cssString)

  const [shouldCompile, hashTag] = helpers.getShouldCompileFromHash({
    classNames: classNamesArray,
    rootDir: this.rootContext,
    resource: this.resource,
    options
  })

  if (!shouldCompile) return

  const components = { __: helpers.getEmptyComponentData() }

  let styleModuleType = ''
  classNamesArray.forEach((className) => {
    styleModuleType = helpers.createStyleType(className, styleModuleType)
    if (exportableCN) {
      helpers.addParsedClassNameData(className, components)
    }
  })

  const hasEmptyClassProps = helpers.getHasEmptyClassProps(components)
  if (!hasEmptyClassProps) delete components.__

  const styleContent = exportableStyle
    ? helpers.createStringContent([
        '\n\nexport interface ModuleStyle {',
        `  ${styleModuleType}`,
        '};',
        '\nexport const style: ModuleStyle = _style as any;'
      ])
    : ''

  const getItemsDefinition = () => {
    return Object.entries(components).reduce((prev, entry) => {
      const [componentKey, componentData] = entry

      const isEmptyComponent = componentKey === '__'
      const componentName = isEmptyComponent
        ? componentKey
        : helpers.toKebabCase(componentKey)

      const separator = prev ? ';\n  ' : ''

      const hasProps = helpers.getHasOwnProps(components, componentKey)
      componentData.hasProps = hasProps

      const jjTypeDef = hasProps
        ? `ClassNamesParser<${componentName}Props>`
        : 'ClassNamesParser'
      const jjContent = `${separator}${componentName}: ${jjTypeDef}`

      return `${prev}${jjContent}`
    }, '')
  }

  const rccComponentsImplementation = exportableCN
    ? helpers.createStringContent([
        '\nexport const $cn = data.$cn as {',
        `  ${getItemsDefinition()}`,
        '};',
        `\nconst cssComponents = data.rccs as RCCs<typeof $cn>;`,
        '\nexport default cssComponents;'
      ])
    : ''

  const componentsPropsDefinition = exportableCN
    ? '\n' + helpers.getClassInterfacesDefinition(components)
    : ''

  const rccSeparator = componentsPropsDefinition ? '\n' : ''

  const rccContent = exportableCN
    ? helpers.createStringContent([
        `${rccSeparator}${componentsPropsDefinition}`,
        '\nconst data = styleParser(_style);',
        rccComponentsImplementation
      ])
    : ''

  const rccImport = exportableCN
    ? helpers.createStringContent([
        `import { styleParser } from 'typed-classnames/core';`,
        `import { ClassNamesParser, RCCs } from 'typed-classnames/dist/src/typings';\n`
      ])
    : ''

  const styleImport = `import _style from "./${resourceFileName}";`

  utils.fs.writeFileSync(
    options._outputFilePath,
    `${rccImport}${styleImport}${styleContent}${rccContent}\n\n// ${hashTag}`
  )
  return content
}

const compile = (filePath, rootContext, options) => {
  const { enabled = true } = options
  if (rootContext === false) {
    console.log('please pass __dirname as rootContext params')
    return
  }
  const resource = path.resolve(rootContext, filePath)
  console.log('compiling resource ===>', resource)

  const content = fs.readFileSync(resource, 'utf-8')
  const thisCtx = {
    resource,
    rootContext,
    getLogger: () => console.log,
    getOptions: () => ({
      ...options,
      enabled,
      fs: options.fs || fs
    })
  }

  rccLoader.bind(thisCtx)(content)
}

rccLoader.compile = compile
module.exports = rccLoader
