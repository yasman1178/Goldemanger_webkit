declare module 'react-barcode' {
  import { type ComponentType } from 'react'

  interface BarcodeProps {
    value: string
    format?: string
    width?: number
    height?: number
    displayValue?: boolean
    margin?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    background?: string
    lineColor?: string
    fontSize?: number
    font?: string
    textAlign?: string
    fontOptions?: string
    textMargin?: number
  }

  const Barcode: ComponentType<BarcodeProps>
  export default Barcode
}
