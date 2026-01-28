import { Application, Graphics } from 'pixi.js';
import { COLORS } from './config';
import { Direction } from './direction';

export class Snake {
  app: Application;
  parts: { graphics: Graphics; nextCell: { x: number; y: number } }[] = [];
  cellWidth: number;
  cellHeight: number;
  cellsX: number;
  cellsY: number;

  direction: Direction = 'right';

  constructor(
    app: Application,
    cellWidth: number,
    cellHeight: number,
    cellsX: number,
    cellsY: number,
  ) {
    this.app = app;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.cellsX = cellsX;
    this.cellsY = cellsY;

    this.addTail();
  }

  addTail() {
    const tail = this.parts[this.parts.length - 1];
    const tailX = tail?.graphics?.x || 0;
    const tailY = tail?.graphics?.y || 0;
    const rect = new Graphics()
      .rect(0, 0, this.cellWidth, this.cellHeight)
      .fill({ color: COLORS[Math.floor(Math.random() * COLORS.length)] })
      .stroke({ width: 1, color: 0x000000 });
    this.parts.push({ graphics: rect, nextCell: { x: tailX, y: tailY } });
  }

  updatePositions(direction: Direction) {
    const head = this.parts[0].graphics;

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
          (el, ind) => ind !== 0 && el.graphics.x === head.x && el.graphics.y === head.y,
        )
      : -1;

    if (partThatCollidedWithHeadIndex !== -1) {
      this.parts = this.parts.filter((part, index) => {
        if (index < partThatCollidedWithHeadIndex) {
          return true;
        }
        this.app.stage.removeChild(part.graphics);
        return false;
      });
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

    this.parts.forEach((part) => {
      part.graphics.removeFromParent();

      this.app.stage.addChild(part.graphics);
    });
  }

  get xIndex() {
    return Math.floor(this.parts[0]?.graphics?.x / this.cellWidth);
  }

  get yIndex() {
    return Math.floor(this.parts[0]?.graphics?.y / this.cellHeight);
  }
}
