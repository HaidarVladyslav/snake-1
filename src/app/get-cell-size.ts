import { Application } from 'pixi.js';

export function getCellSize(app: Application, xCells: number, yCells: number) {
  const x = xCells;
  const y = yCells;
  const width = app.screen.width;
  const height = app.screen.height;
  const cellWidth = Math.fround(width / x);
  const cellHeight = Math.fround(height / y);
  return { cellWidth, cellHeight };
}
