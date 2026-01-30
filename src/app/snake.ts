import { Application, Container, Graphics } from 'pixi.js';
import { COLORS, HEAD_Z_INDEX } from './config';
import { Direction } from './direction';
import { Subject } from 'rxjs';
import { Mode } from './mode';

export class Snake {
  app: Application;
  parts: { graphics: Container; nextCell: { x: number; y: number } }[] = [];
  cellWidth: number;
  cellHeight: number;
  cellsX: number;
  cellsY: number;
  mode: Mode;
  direction: Direction = 'right';

  private isCollided$ = new Subject<void>();
  public readonly isCollidedObs$ = this.isCollided$.asObservable();

  constructor(
    app: Application,
    cellWidth: number,
    cellHeight: number,
    cellsX: number,
    cellsY: number,
    mode: Mode,
  ) {
    this.app = app;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.cellsX = cellsX;
    this.cellsY = cellsY;
    this.mode = mode;

    this.addTail();
  }

  addTail() {
    const tail = this.parts[this.parts.length - 1];
    const isHead = this.parts.length === 0;
    const tailX = tail?.graphics?.x || 0;
    const tailY = tail?.graphics?.y || 0;
    const rect = new Graphics()
      .rect(0, 0, this.cellWidth, this.cellHeight)
      .fill({ color: this.getRandomColor() })
      .stroke({ width: 1, color: this.mode === 'light' ? 0x000000 : 0xffffff });
    const container = new Container();

    if (isHead) {
      const eyeRadius = rect.height / 8;
      const eyeTop = rect.height / 3;
      const mouthTop = (rect.height * 3) / 4;
      const tongueHeight = rect.height / 8;
      rect
        // left eye
        .circle(rect.width / 3, eyeTop, eyeRadius)
        .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff })
        .stroke({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
        // inner left eye
        .circle(rect.width / 3, eyeTop, eyeRadius * 0.75)
        .fill({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
        .stroke({ color: this.mode === 'light' ? 0x000000 : 0xffffff })
        // right eye
        .circle((rect.width * 2) / 3, eyeTop, eyeRadius * 1.5)
        .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff })
        .stroke({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
        // inner right eye
        .circle((rect.width * 2) / 3, eyeTop, eyeRadius * 0.9)
        .fill({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
        .stroke({ color: this.mode === 'light' ? 0x000000 : 0xffffff })
        // mouth
        .roundRect(rect.width / 8, mouthTop, (rect.width * 6) / 8, rect.height / 6, rect.width / 20)
        .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff })
        .stroke({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
        // tongue
        .roundRect(
          rect.width / 2,
          mouthTop + tongueHeight / 2,
          (rect.width * 1) / 6,
          rect.height / 10,
          rect.width / 20,
        )
        .fill({ color: 'red' });
    }

    container.addChild(rect);

    this.parts.push({ graphics: container, nextCell: { x: tailX, y: tailY } });
  }

  updatePositions(direction: Direction) {
    const head = this.parts[0].graphics;

    head.zIndex = HEAD_Z_INDEX;

    if (direction === 'right') {
      head.x += this.cellWidth;
    }
    if (direction === 'left') {
      head.x -= this.cellWidth;
    }
    if (direction === 'up') {
      head.y -= this.cellHeight;
    }
    if (direction === 'down') {
      head.y += this.cellHeight;
    }

    if (head.x >= this.cellsX * this.cellWidth) {
      head.x = 0;
    }
    if (head.x < 0) {
      head.x = this.cellsX * this.cellWidth;
    }

    if (head.y >= this.cellsY * this.cellHeight) {
      head.y = 0;
    }
    if (head.y < 0) {
      head.y = this.cellsY * this.cellHeight;
    }

    const partThatCollidedWithHeadIndex = head
      ? this.parts.findIndex(
          (el, ind, array) =>
            ind !== 0 &&
            ind !== array.length - 1 &&
            el.graphics.x === head.x &&
            el.graphics.y === head.y,
        )
      : -1;

    if (partThatCollidedWithHeadIndex !== -1) {
      this.parts = this.parts.filter((part, index, array) => {
        if (index === array.length - 1) {
          return true;
        }
        if (index < partThatCollidedWithHeadIndex) {
          return true;
        }
        this.app.stage.removeChild(part.graphics);
        return false;
      });
      this.isCollided$.next();
    }

    this.parts = this.parts.map((part, index) => {
      if (index === 0) {
        return { graphics: head, nextCell: { x: 0, y: 0 } };
      }

      part.graphics.x = part.nextCell.x;
      part.graphics.y = part.nextCell.y;
      return {
        ...part,
        nextCell: { x: this.parts[index - 1].graphics.x, y: this.parts[index - 1].graphics.y },
      };
    });

    this.parts.forEach((part, index, array) => {
      part.graphics.removeFromParent();

      const container = part.graphics;

      if (index === array.length - 1 && array.length > 1 && container.children.length === 1) {
        const polygon = this.generatePolygon(
          this.cellWidth,
          this.cellHeight,
          { x: part.graphics.x, y: part.graphics.y },
          { x: part.nextCell.x, y: part.nextCell.y },
        );

        part.graphics.addChild(polygon);
      } else if (index !== 0 && index !== array.length - 1) {
        if (container.children.length === 2) {
          part.graphics.removeChildAt(1);
        }
        if (container.children.length === 1) {
          const width = part.graphics.width;
          const height = part.graphics.height;
          const leftStripe = new Graphics()
            .poly([
              (width * 3) / 32,
              (height * 28) / 32,
              (width * 10) / 32,
              (height * 28) / 32,
              (width * 7) / 32,
              (height * 20) / 32,
              (width * 1) / 32,
              (height * 24) / 32,
            ])
            .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff });
          const middleStripe = new Graphics()
            .poly([
              (width * 12) / 32,
              (height * 28) / 32,
              (width * 19) / 32,
              (height * 28) / 32,
              (width * 14) / 32,
              (height * 11) / 32,
              (width * 7) / 32,
              (height * 15) / 32,
            ])
            .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff });
          const rightStripe = new Graphics()
            .poly([
              (width * 21) / 32,
              (height * 28) / 32,
              (width * 28) / 32,
              (height * 28) / 32,
              (width * 22) / 32,
              (height * 3) / 32,
              (width * 15) / 32,
              (height * 7) / 32,
            ])
            .fill({ color: this.mode === 'light' ? 0x000000 : 0xffffff });

          part.graphics.addChild(leftStripe, middleStripe, rightStripe);
        }
      } else if (part.graphics.children.length === 2) {
        const polygon = this.generatePolygon(
          this.cellWidth,
          this.cellHeight,
          { x: part.graphics.x, y: part.graphics.y },
          { x: part.nextCell.x, y: part.nextCell.y },
        );
        part.graphics.removeChildAt(1);
        part.graphics.addChild(polygon);
      }

      this.app.stage.addChild(part.graphics);
    });
  }

  get xIndex() {
    return Math.floor(this.parts[0]?.graphics?.x / this.cellWidth);
  }

  get yIndex() {
    return Math.floor(this.parts[0]?.graphics?.y / this.cellHeight);
  }

  get getLength() {
    return this.parts.length;
  }

  private generatePolygon(
    width: number,
    height: number,
    currentCoordinates: { x: number; y: number },
    nextCoordinates: { x: number; y: number },
  ) {
    const downLeft = [0, 0, width / 2, 0, 0, height];
    const downRight = [width / 2, 0, width, 0, width, height];

    const upLeft = [0, height, width / 2, height, 0, 0];
    const upRight = [width, height, width, 0, width / 2, height];

    const leftTop = [0, 0, width, height / 2, width, 0];
    const leftBottom = [0, height, width, height / 2, width, height];

    const rightTop = [width, 0, 0, 0, 0, height / 2];
    const rightBottom = [width, height, 0, height, 0, height / 2];

    const currentXIndex = Math.floor(currentCoordinates.x / this.cellWidth);
    const currentYIndex = Math.floor(currentCoordinates.y / this.cellHeight);
    const nextXIndex = Math.floor(nextCoordinates.x / this.cellWidth);
    const nextYIndex = Math.floor(nextCoordinates.y / this.cellHeight);

    const dx = nextXIndex - currentXIndex;
    const dy = nextYIndex - currentYIndex;

    const toRight = dx === 1 || dx === -(this.cellsX - 1);
    const toBottom = dy === 1 || dy === -(this.cellsY - 1);
    const toTop = dy === -1 || dy === this.cellsX;

    const first = toRight ? rightTop : toBottom ? downLeft : toTop ? upLeft : leftTop;
    const second = toRight ? rightBottom : toBottom ? downRight : toTop ? upRight : leftBottom;

    const polygon = new Graphics()
      .poly(first)
      .fill({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
      .stroke({ width: 1, color: this.mode === 'light' ? 0x000000 : 0xffffff })
      .poly(second)
      .fill({ color: this.mode === 'light' ? 0xffffff : 0x000000 })
      .stroke({ width: 1, color: this.mode === 'light' ? 0x000000 : 0xffffff });

    return polygon;
  }

  private getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
}
