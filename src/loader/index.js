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
  const {
    style: exportableStyle,
    $cn: exportableCN,
    rccs: exportableRCCs
  } = options._exportable

  if (!exportableRCCs && !exportableStyle && !exportableCN) {
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
    if (exportableRCCs || exportableCN) {
      helpers.addParsedClassNameData(className, components)
    }
  })

  try {
    Object.keys(components).forEach((root) =>
      helpers.getRecursiveErrorMessage({ options, root, components, hashTag })
    )
  } catch (error) {
    utils.fs.writeFileSync(
      options._outputFilePath,
      `${error.message}\n\n// ${hashTag}`
    )
    return content
  }

  const hasEmptyClassProps = helpers.getHasEmptyClassProps(components)
  components.__.hasProps = hasEmptyClassProps

  const styleContent = exportableStyle
    ? helpers.createStringContent([
        '\n\nexport interface ModuleStyle {',
        `  ${styleModuleType}`,
        '};',
        '\nexport const style: ModuleStyle = _style as any;'
      ])
    : ''

  const getItemsDefinition = (type = 'RCC') => {
    return Object.entries(components).reduce((prev, entry) => {
      const [componentName, componentData] = entry
      if (componentName === 'GlobalClasses') {
        return prev
      }

      const separator = prev ? ';\n  ' : ''

      const hasProps = helpers.getHasOwnProps(components, componentName)
      // updating component Data with hasProps
      componentData.hasProps = hasProps

      const ownTypeDefinition = hasProps
        ? `${helpers.toKebabCase(componentName)}Props`
        : '{}'

      const jjContent = `${separator}${helpers.toKebabCase(
        componentName
      )}: ${type}<${ownTypeDefinition}>`

      return `${prev}${jjContent}`
    }, '')
  }
  const rccNewLine = exportableCN ? '\n' : ''

  const rccComponentsImplementation = exportableRCCs
    ? helpers.createStringContent([
        `${rccNewLine}const cssComponents = data.rccs as {`,
        `  ${getItemsDefinition('RCC')}`,
        '};',
        '\nexport default cssComponents;'
      ])
    : ''

  const $cnImplementation = exportableCN
    ? helpers.createStringContent([
        '\nexport const $cn = data.$cn as {',
        `  ${getItemsDefinition('CN')}`,
        '};'
      ])
    : ''

  const cnTtypeDef = exportableCN
    ? '\ntype CN<P> = (props?: P) => string;\n'
    : ''
  const gcpTypeDef =
    exportableRCCs || exportableCN ? '\n\ntype GCP = GlobalClassesProps;' : ''

  const componentsPropsDefinition =
    exportableRCCs || exportableCN
      ? '\n' + helpers.getClassInterfacesDefinition(components)
      : ''

  const rccSeparator =
    !!componentsPropsDefinition || !!gcpTypeDef || cnTtypeDef ? '\n' : ''

  const rccContent =
    exportableRCCs || exportableCN
      ? helpers.createStringContent([
          `${rccSeparator}${componentsPropsDefinition}${gcpTypeDef}${cnTtypeDef}`,
          'const data = styleParser(_style);',
          $cnImplementation,
          rccComponentsImplementation
        ])
      : ''

  const rccImport =
    exportableRCCs || exportableCN
      ? helpers.createStringContent([
          `import { styleParser } from 'typed-classnames/core';`,
          exportableRCCs
            ? `import { RCC } from 'typed-classnames/dist/src/typings';\n`
            : ''
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
