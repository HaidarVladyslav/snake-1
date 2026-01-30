import { Component, signal } from '@angular/core';
import { Application, Assets } from 'pixi.js';
import { Field } from './field';
import { getCellSize } from './get-cell-size';
import { Mode } from './mode';
import { CELLS_X, CELLS_Y, INITIAL_SPEED, MAX_SPEED, SPEED_DIFF } from './config';
import { Snake } from './snake';
import { Flower } from './flower';
import { Direction } from './direction';
import { sound } from '@pixi/sound';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private mode = signal<Mode>('dark');

  constructor() {
    (async () => {
      const app = new Application();

      (globalThis as any).__PIXI_APP__ = app;

      await app.init({ background: '#1099bb', resizeTo: window });

      const soundNames = ['breeze-of-blood', 'creepy-fall', 'monster-growl', 'wet-and-squelchy'];
      const speedUpSoundName = 'speed-up';
      const panicSqueakSoundName = 'panic-squeak';
      const movingRandomSoundNames = [
        'evil-dwarf-laugh',
        'cartoon-fart',
        'girl-saying-no-no-no',
        'whistling',
        'monkey-mocking-laugh',
        'little-cat-meow',
      ];

      soundNames.forEach((s) => sound.add(s, s + '.mp3'));
      movingRandomSoundNames.forEach((s) => sound.add(s, s + '.mp3'));
      sound.add(speedUpSoundName, speedUpSoundName + '.mp3');
      sound.add(panicSqueakSoundName, panicSqueakSoundName + '.mp3');

      Assets.add({
        alias: 'flowerTop',
        src: 'https://pixijs.com/assets/flowerTop.png',
      });
      Assets.add({
        alias: 'eggHead',
        src: 'https://pixijs.com/assets/eggHead.png',
      });
      Assets.add({
        alias: 'helmlok',
        src: 'https://pixijs.com/assets/helmlok.png',
      });
      Assets.add({
        alias: 'skully',
        src: 'https://pixijs.com/assets/skully.png',
      });
      Assets.add({
        alias: 'panda',
        src: 'https://pixijs.com/assets/panda.png',
      });
      // Assets.add({
      //   alias: 'maggot',
      //   src: 'https://pixijs.com/assets/maggot.png',
      // });
      // Assets.add({
      //   alias: 'bunny',
      //   src: 'https://pixijs.com/assets/bunny.png',
      // });

      const assets = await Assets.load([
        'flowerTop',
        'eggHead',
        'panda',
        // 'maggot',
        // 'bunny',
        'helmlok',
        'skully',
      ]);

      document.body.appendChild(app.canvas);

      const direction: { [key in Direction]: boolean } = {
        left: false,
        right: true,
        up: false,
        down: false,
      };

      let speed = INITIAL_SPEED;

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
      const snake = new Snake(app, cellWidth, cellHeight, CELLS_X, CELLS_Y, this.mode());

      snake.isCollidedObs$.subscribe((d) => {
        reduceSpeed();
      });

      let flowers: Flower[] = [];

      const generateFlower = () => {
        flowers.length = 0;

        const assetsKeys = Object.keys(assets).filter((key) => !key.includes('https'));
        for (let i = 0; i <= Math.floor(Math.random() * assetsKeys.length); i++) {
          const assetSpriteName = assetsKeys[Math.floor(Math.random() * assetsKeys.length)];
          const flower = new Flower(
            app,
            Math.floor(Math.random() * CELLS_X) * cellWidth,
            Math.floor(Math.random() * CELLS_Y) * cellHeight,
            cellWidth,
            cellHeight,
            assetSpriteName,
          );
          flowers.push(flower);
        }
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
        if (!flowers.length) {
          return;
        }

        if (
          flowers.some((flower) => snake.xIndex === flower.xIndex && snake.yIndex === flower.yIndex)
        ) {
          sound.play(soundNames[Math.floor(Math.random() * soundNames.length)], { speed: 2 });
          flowers.forEach((flower) => flower.container.destroy());
          snake.addTail();
          generateFlower();
          updateSpeed();
        }
      };

      const updateSpeed = () => {
        if (speed === MAX_SPEED) {
          return;
        }
        if (snake.getLength % 4 === 0) {
          speed -= SPEED_DIFF;
          sound.play(speedUpSoundName, { speed: 2 });
        }
      };

      const reduceSpeed = () => {
        speed += SPEED_DIFF * 2;
        sound.play(panicSqueakSoundName);
      };

      let count = 0;
      let countForRandomSoundToBePlayed = 0;
      app.ticker.add((time) => {
        if (++count > speed) {
          count = 0;
          move();
        }

        if (++countForRandomSoundToBePlayed > Math.random() * 200 + 550) {
          countForRandomSoundToBePlayed = 0;
          sound.play(
            movingRandomSoundNames[Math.floor(Math.random() * movingRandomSoundNames.length)],
          );
        }
      });
    })();
  }
}
