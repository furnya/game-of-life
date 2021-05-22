import { Component, OnInit } from '@angular/core';
import { FormControl } from '@ngneat/reactive-forms';
import { interval, Subscription } from 'rxjs';
import { filter, startWith, switchMap } from 'rxjs/operators';

interface Cell {
  alive: boolean;
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  cells: Cell[][] = [];
  sizeFC = new FormControl<number>(50);
  timeFC = new FormControl<number>(200);
  pauseFC = new FormControl<boolean>(false);
  size: number;
  generation = 0;
  birthRule = [false, false, false, true, false, false, false, false, false];
  deathRule = [false, false, true, true, false, false, false, false, false];
  sub: Subscription;

  resetBoard(): void {
    this.cells = [];
    for (let i = 0; i < this.size; i++) {
      this.cells.push([]);
      for (let j = 0; j < this.size; j++) {
        this.cells[i].push({
          alive: false,
        });
      }
    }
    this.cells[0][2].alive = true;
    this.cells[1][3].alive = true;
    this.cells[2][1].alive = true;
    this.cells[2][2].alive = true;
    this.cells[2][3].alive = true;
  }

  ngOnInit(): void {
    this.size = this.sizeFC.value;
    this.resetBoard();
    this.startGame();
    this.sizeFC.valueChanges.subscribe((v) => {
      this.size = v;
      this.resetBoard();
      this.startGame();
    });
  }

  getNeighborCoords(x, y): number[][] {
    return [
      [x - 1, y - 1],
      [x - 1, y],
      [x - 1, y + 1],
      [x, y - 1],
      [x, y + 1],
      [x + 1, y - 1],
      [x + 1, y],
      [x + 1, y + 1],
    ];
  }

  getNeighbors(coords): Cell[] {
    return coords
      .filter(
        ([x, y]) => 0 <= x && x <= this.size - 1 && 0 <= y && y <= this.size - 1
      )
      .map(([x, y]) => this.cells[x][y]);
  }

  onClickCell(cell): void {
    cell.alive = !cell.alive;
  }

  setBirthRule(i, value): void {
    this.birthRule[i] = value;
  }

  startGame(): void {
    this.generation = 0;
    this.sub?.unsubscribe();
    this.sub = this.timeFC.valueChanges
      .pipe(
        startWith(this.timeFC.value),
        switchMap((period) => interval(period)),
        filter(() => !this.pauseFC.value)
      )
      .subscribe(() => {
        this.generation++;
        const newCells: Cell[][] = this.cells.map((r) =>
          r.map((c) => ({ alive: c.alive }))
        );
        for (const [x, row] of this.cells.entries()) {
          for (const [y, cell] of row.entries()) {
            const neighbors = this.getNeighbors(this.getNeighborCoords(x, y));
            const aliveNeighborCount = neighbors
              .map((neighbor) => neighbor.alive)
              .reduce((p, c) => p + Number(c), 0);
            if (
              (cell.alive && this.deathRule[aliveNeighborCount]) ||
              (!cell.alive && this.birthRule[aliveNeighborCount])
            ) {
              newCells[x][y].alive = true;
              // console.log(x, y, aliveNeighborCount, newCells[x][y].alive);
            } else {
              newCells[x][y].alive = false;
            }
          }
        }
        this.cells = newCells;
        console.log('END');
      });
  }

  reset(): void {
    this.resetBoard();
    this.startGame();
  }
}
