declare module 'cropme' {
  
  type Integer = number
  
  export type CropmeOutputType = 'blob' | 'base64'
  
  export interface CropmeOptions {
    container?: {
      width?: Integer | string
      height?: Integer
    }
    viewport?: {
      width?: Integer
      height?: Integer
      type?: 'circle' | 'square'
      border?: {
        enable?: boolean
        width?: Integer
        color?: string
      }
    }
    zoom?: {
      min?: number
      max?: number
      enable?: boolean
      mouseWheel?: boolean
      slider?: boolean
    }
    rotation?: {
      enable?: boolean
      slider?: boolean
      position?: 'left' | 'right'
    }
    transformOrigin?: 'viewport' | 'image'
    customClass?: string
  }
  
  
  export interface CropmePosition {
    x?: Integer
    y?: Integer
    scale?: number
    angle?: Integer
    origin?: {
      // If origin is set, transformOrigin will be set to 'image',
      // leave it undefined if you want to use 'viewport'
      x: number
      y: number
    }
  }
    
  export interface CropmeBindOptions {
    url: string
    position?: CropmePosition
  }
  
  export interface CropmeCropOptions {
    type?: CropmeOutputType
    width?: Integer
    scale?: number // If scale is set, width will be ignored
    mimetype?: string
    quality?: number // Between 0 and 1, works only with image/jpeg or image/webp
  }
  
  
  declare class Cropme {
    constructor(element: HTMLElement, options?: CropmeOptions)
    bind(bindOptions: CropmeBindOptions): Promise<void>
    rotate(absoluteAngleDegrees: Integer)
    crop(cropOptions: CropmeCropOptions | CropmeOutputType): Promise<string>
    position(): CropmePosition
    reload(CropmeOptions)
    destroy()
  }
  export = Cropme
}
