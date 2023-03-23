// Generate a chess board, with the given number of rows and columns

export function chessboardSvg(width: number, height: number, light_color: string, dark_color: string): string {
  light_color = light_color.replace('#', '%23')
  dark_color = dark_color.replace('#', '%23')
  const svg = []
  svg.push(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' shape-rendering='crispEdges'>`)
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const color = (row + column) % 2 === 0 ? light_color : dark_color
      svg.push(`<rect x='${column}' y='${row}' width='1' height='1' fill='${color}'/>`)
    }
  }
  svg.push('</svg>')
  return svg.join('')
}
