import { styleParser } from '../dist/rcc-core'
import { ClassNamesParser, RCCs } from '../dist/src/typings'
import _style from './style.scss'

export interface BtnProps {
  darkMode?: boolean
  yolo?: boolean
}

export interface ContentProps {
  status?: 'collapsed' | 'expanded'
}

export interface HeaderTitleProps {
  centered?: boolean
}

export interface RootProps {
  borderRadius?: boolean
  color?: 'green' | 'red' | 'yellow'
  darkYellow?: boolean
  subDarkYellow?: boolean
}
const data = styleParser(_style)

export const $cn = data.$cn as {
  Btn: ClassNamesParser<BtnProps>
  BtnWrapper: ClassNamesParser
  ColorPicker: ClassNamesParser
  Content: ClassNamesParser<ContentProps>
  ExpandedBtn: ClassNamesParser
  HeaderTitle: ClassNamesParser<HeaderTitleProps>
  Item: ClassNamesParser
  Root: ClassNamesParser<RootProps>
  Selected: ClassNamesParser
}

const cssComponents = data.rccs as RCCs<typeof $cn>

export default cssComponents

// ##hash## #$cn_expo; #clases=btn|btn--dark-mode|btn--dark-mode--yolo|btn-wrapper|color-picker|content|content--collapsed_as_status|content--expanded_as_status|expanded-btn|expanded-btn_ext_btn|header-title|header-title--centered|item|root|root--border-radius|root--green_as_color|root--red_as_color|root--yellow_as_color|root--yellow_as_color--dark-yellow|root--yellow_as_color--dark-yellow--sub-dark-yellow|selected;#ofn=style.rcc;
