import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/heatmap.css';

const width = 1000;
const height = 1000;

export default class extends Chart {
  constructor({ container }) {
    super({ container });
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('width', `${width}px`);
    this.canvas.setAttribute('height', `${height}px`);
    container.appendChild(this.canvas);
    this.data = [];
  }

  static get name() {
    return 'heatmap-canvas';
  }

  prepareData({ values, rows, cols }) {
    this.data = [];
    rows.forEach((row, i) => {
      cols.forEach((col, j) => {
        this.data.push({ value: values[i * rows.length + j], row, col });
      });
    });
  }

  update({ values, valueRange, title, rows, cols, sequential }) {
    if (typeof values !== 'undefined') {
      this.prepareData({ values, rows, cols });
    }

    const rowMapping = {};
    const colMapping = {};
    rows.forEach((d, i) => { rowMapping[d] = i; });
    cols.forEach((d, i) => { colMapping[d] = i; });

    const rectSize = Math.floor(height / rows.length); // FIXME: this is just a placeholder

    let colorScale = null;
    if (sequential) {
      colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain(valueRange);
    } else {
      colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(valueRange);
    }
    const t0 = performance.now();
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    this.data.forEach((d) => {
      ctx.fillStyle = colorScale(d.value);
      ctx.fillRect(colMapping[d.col] * rectSize, rowMapping[d.row] * rectSize, rectSize, rectSize);
    });
    const t1 = performance.now();
    console.log(t1 - t0);
  }
}
