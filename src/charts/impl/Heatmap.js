import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/heatmap.css';

const ANIMATION_DURATION = 1000;

const margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};
const width = 1000 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

export default class extends Chart {
  constructor({ container }) {
    super({ container });
    this.memory = d3.select(document.createElement('memory'));
    this.canvas = d3.select(container)
      .append('canvas')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('transform', `translate(${margin.left}px, ${margin.top}px)`)
      .style('position', 'absolute')
      .node();
    this.svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    this.data = [];
  }

  static get name() {
    return 'heatmap';
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

    this.databind({ data: this.data, rows, cols, valueRange, sequential });
    // eslint-disable-next-line func-names
    const nodes = this.memory.selectAll('rect').nodes();
    const timer = d3.timer((elapsed) => {
      this.draw(nodes);
      if (elapsed > ANIMATION_DURATION) timer.stop();
    });
  }

  databind({ rows, cols, valueRange, sequential }) {
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

    const rect = this.memory.selectAll('rect')
      .data(this.data, d => `${d.row}-${d.col}`);

    rect.enter()
      .append('rect')
      .attr('width', rectSize)
      .attr('height', rectSize)
      .attr('x', d => colMapping[d.col] * rectSize)
      .attr('y', d => rowMapping[d.row] * rectSize)
      .attr('fillStyle', d => colorScale(d.value));

    rect
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('width', rectSize)
      .attr('height', rectSize)
      .attr('x', d => colMapping[d.col] * rectSize)
      .attr('y', d => rowMapping[d.row] * rectSize)
      .attr('fillStyle', d => colorScale(d.value));

    rect.exit()
      .remove();

    const rowLabels = this.svg.selectAll('text.row-label')
      .data(rows, d => d);

    rowLabels.enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('text-anchor', 'end')
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .merge(rowLabels)
      .attr('transform', d => `translate(0, ${(rowMapping[d] + 0.5) * rectSize})rotate(-45)`)
      .text(d => d)
      .on('click', (row) => {
        const newCols = this.data
          .filter(d => d.row === row)
          .sort((a, b) => b.value - a.value)
          .map(d => d.col);
        this.update({ rows, cols: newCols, valueRange, sequential });
      });

    const colLabels = this.svg.selectAll('text.col-label')
      .data(cols, d => d);

    colLabels.enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('text-anchor', 'end')
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .merge(colLabels)
      .style('transform', d => `translate(${(colMapping[d] + 0.5) * rectSize}px, 0px)rotate(45deg)`)
      .text(d => d)
      .on('click', (col) => {
        const newRows = this.data
          .filter(d => d.col === col)
          .sort((a, b) => b.value - a.value)
          .map(d => d.row);
        this.update({ rows: newRows, cols, valueRange, sequential });
      });
  }

  draw(nodes) {
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    nodes.forEach((node) => {
      context.fillStyle = node.getAttribute('fillStyle');
      context.fillRect(
        node.getAttribute('x'),
        node.getAttribute('y'),
        node.getAttribute('width'),
        node.getAttribute('height'),
      );
    });
  }
}
