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

    const xScale = d3.scaleBand()
      .domain(cols)
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(rows)
      .range([0, height]);

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
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('x', d => xScale(d.col))
      .attr('y', d => yScale(d.row))
      .attr('fillStyle', d => colorScale(d.value));

    rect
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('x', d => xScale(d.col))
      .attr('y', d => yScale(d.row))
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
      .attr('transform', d => `translate(0, ${yScale(d) + 0.5 * yScale.bandwidth()})rotate(-45)`)
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
      .style('transform', d => `translate(${xScale(d) + 0.5 * xScale.bandwidth()}px, 0px)rotate(45deg)`)
      .text(d => d)
      .on('click', (col) => {
        const newRows = this.data
          .filter(d => d.col === col)
          .sort((a, b) => b.value - a.value)
          .map(d => d.row);
        this.update({ rows: newRows, cols, valueRange, sequential });
      });

    d3.select(this.canvas).on('mousemove', function() {
      const [x, y] = d3.mouse(this);

      const xBands = xScale.step();
      const xBandIdx = Math.floor(x / xBands);
      const col = yScale.domain()[xBandIdx];

      const yBands = yScale.step();
      const yBandIdx = Math.floor(y / yBands);
      const row = yScale.domain()[yBandIdx];

      console.log([col, row]);
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
