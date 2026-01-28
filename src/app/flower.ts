import { Application, Container, Sprite } from 'pixi.js';

export class Flower {
  container: Container;
  cellWidth: number;
  cellHeight: number;
  constructor(app: Application, x: number, y: number, cellWidth: number, cellHeight: number,
    sprite: string
  ) {
    this.container = new Container();
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;

    const flower = Sprite.from(sprite);
    flower.width = cellWidth;
    flower.height = cellHeight;
    this.container.addChild(flower);

    this.container.x = x;
    this.container.y = y;

    app.stage.addChild(this.container);
  }

  get xIndex() {
    return Math.floor(this.container.x / this.cellWidth);
  }

  get yIndex() {
    return Math.floor(this.container.y / this.cellHeight);
  }
}
