import { Container, Application, Graphics, ColorMatrixFilter, FillGradient } from 'pixi.js';
import { Mode } from './mode';

export class Field {
  container: Container;
  filter = new ColorMatrixFilter();
  count = 0;

  constructor(
    app: Application,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    mode: Mode = 'light',
  ) {
    this.container = new Container();
    const rects = [];

    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        const rect = new Graphics()
          .rect(i * cellWidth, j * cellHeight, cellWidth, cellHeight)
          .fill({ color: mode === 'light' ? 0xffffff : 0x000000 })
          .stroke({ width: 1, color: mode === 'light' ? 0x000000 : 0xffffff });
        const lines = new Graphics()
          .moveTo(i * cellWidth + (cellWidth * 2) / 6, j * cellHeight + (j % 8 === 0 ? 1 : 0))
          .lineTo(i * cellWidth + (cellWidth * 4) / 6, j * cellHeight + (j % 8 === 0 ? 1 : 0))
          .stroke({ color: 'red' })
          .moveTo(i * cellWidth, j * cellHeight + (cellHeight * 2) / 6)
          .lineTo(i * cellWidth, j * cellHeight + (cellHeight * 4) / 6)
          .stroke({ color: 'red' });
        lines.filters = [this.filter];
        rect.addChild(lines);

        this.container.addChild(rect);
        rects.push(rect);
      }
    }

    app.stage.addChild(this.container);
  }

  public updateFilter() {
    const { matrix } = this.filter;
    const count = this.count;

    matrix[1] = Math.sin(count) * 3;
    matrix[2] = Math.cos(count);
    matrix[3] = Math.cos(count) * 1.5;
    matrix[4] = Math.sin(count / 3) * 2;
    matrix[5] = Math.sin(count / 2);
    matrix[6] = Math.sin(count / 4);

    this.count += 1;
  }
}
