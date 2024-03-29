
// Wrapper for the cropme plugin to display a cropper with a circle viewport

import Cropme from 'cropme'

export class CircleCropme {
  private cropme: Cropme
  
  constructor(element: HTMLElement, componentHeight: number, viewportDiameter: number) {
    this.cropme = new Cropme(element, {
      container: {
        width: '100%',
        height: componentHeight,
      },
      viewport: {
        width: viewportDiameter,
        height: viewportDiameter,
        type: 'circle',
        border: {
          width: 2,
          enable: true,
          color: '#fff',
        },
      },
      zoom: {
        min: 0.5,
        max: 12,
        enable: true,
        mouseWheel: true,
        slider: true,
      },
      rotation: {
        slider: false,
        enable: false,
        position: 'left',
      },
      transformOrigin: 'viewport',
    })
  }
  
  public bind(image: Blob) {
    this.cropme.bind({
      url: URL.createObjectURL(image),
    })
  }
  
  public async cropImage(width: number): Promise<string> {
    return this.cropme.crop({
      type: 'blob',
      mimetype: 'image/webp',
      width,
    })
  }
  
  public destroy() {
    this.cropme.destroy()
  }
}
