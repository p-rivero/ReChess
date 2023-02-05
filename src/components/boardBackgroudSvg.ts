// Generate a chess board, with the given number of rows and columns

const HASH_CHAR = '%23'
const DARK_COLOR = HASH_CHAR+'F0D9B5';
const LIGHT_COLOR = HASH_CHAR+'B58863';

export function chessboardSvg(width: number, height: number): string {
  const svg = [];
  svg.push(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' shape-rendering='crispEdges'>`);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const color = (row + column) % 2 === 0 ? DARK_COLOR : LIGHT_COLOR;
      svg.push(`<rect x='${column}' y='${row}' width='1' height='1' fill='${color}'/>`);
    }
  }
  svg.push('</svg>');
  return svg.join('');
}
