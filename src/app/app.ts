import { Component, signal } from '@angular/core';
import { Application, Assets } from 'pixi.js';
import { Field } from './field';
import { getCellSize } from './get-cell-size';
import { Mode } from './mode';
import { CELLS_X, CELLS_Y } from './config';
import { Snake } from './snake';
import { Flower } from './flower';
import { Direction } from './direction';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('snake-1');
  private mode = signal<Mode>('light');

  constructor() {
    (async () => {
      const app = new Application();

      (globalThis as any).__PIXI_APP__ = app;

      await app.init({ background: '#1099bb', resizeTo: window });

      Assets.add({
        alias: 'flowerTop',
        src: 'https://pixijs.com/assets/flowerTop.png',
      });
      Assets.add({
        alias: 'eggHead',
        src: 'https://pixijs.com/assets/eggHead.png',
      });

      const assets = await Assets.load(['flowerTop', 'eggHead']);

      document.body.appendChild(app.canvas);

      const direction: { [key in Direction]: boolean } = {
        left: false,
        right: true,
        up: false,
        down: false,
      };

      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft' && !direction.right) {
          direction.left = true;
          direction.up = false;
          direction.down = false;
        } else if (e.code === 'ArrowRight' && !direction.left) {
          direction.right = true;
          direction.up = false;
          direction.down = false;
        } else if (e.code === 'ArrowUp' && !direction.down) {
          direction.up = true;
          direction.left = false;
          direction.right = false;
        } else if (e.code === 'ArrowDown' && !direction.up) {
          direction.down = true;
          direction.left = false;
          direction.right = false;
        }
      });

      const { cellWidth, cellHeight } = getCellSize(app, CELLS_X, CELLS_Y);
      const field = new Field(app, CELLS_X, CELLS_Y, cellWidth, cellHeight, this.mode());
      const snake = new Snake(app, cellWidth, cellHeight, CELLS_X, CELLS_Y);

      let flower: Flower | null = null;

      const generateFlower = () => {
        const assetsKeys = Object.keys(assets).filter((key) => !key.includes('https'));
        const assetSpriteName = assetsKeys[Math.floor(Math.random() * assetsKeys.length)];
        flower = new Flower(
          app,
          Math.floor(Math.random() * CELLS_X) * cellWidth,
          Math.floor(Math.random() * CELLS_Y) * cellHeight,
          cellWidth,
          cellHeight,
          assetSpriteName,
        );
      };

      generateFlower();

      const move = () => {
        checkIfSubjectIsCollidedWithHead();

        snake.updatePositions(
          Object.entries(direction)
            .filter(([key, value]) => !!value)
            .map(([key]) => key)[0] as Direction,
        );
      };

      const checkIfSubjectIsCollidedWithHead = () => {
        if (!flower) {
          return;
        }

        if (snake.xIndex === flower.xIndex && snake.yIndex === flower.yIndex) {
          flower.container.destroy();
          snake.addTail();
          generateFlower();
        }
      };

      let count = 0;
      let speed = 8;
      app.ticker.add((time) => {
        if (++count > speed) {
          count = 0;
          move();
        }
      });
    })();
  }
}
