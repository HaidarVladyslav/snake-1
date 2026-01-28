import { Container, Application, Graphics } from 'pixi.js';
import { Mode } from './mode';

export class Field {
  container: Container;
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
        this.container.addChild(rect);
        rects.push(rect);
      }
    }

    app.stage.addChild(this.container);
  }
}
