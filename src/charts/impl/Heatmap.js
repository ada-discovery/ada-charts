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
    this.valueRange = [];
    this.rows = [];
    this.cols = [];
    this.title = '';
    this.sequential = true;
  }

  static get name() {
    return 'heatmap';
  }

  prepareValues({ values, rows, cols }) {
    const data = [];
    rows.forEach((row, i) => {
      cols.forEach((col, j) => {
        data.push({ value: values[i * rows.length + j], row, col });
      });
    });
    return data;
  }

  update({ values, valueRange, title, rows, cols, sequential }) {
    this.title = typeof title === 'undefined' ? this.title : title;
    this.valueRange = typeof valueRange === 'undefined' ? this.valueRange : valueRange;
    this.rows = typeof rows === 'undefined' ? this.rows : rows;
    this.cols = typeof cols === 'undefined' ? this.cols : cols;
    this.sequential = typeof sequential === 'undefined' ? this.sequential : sequential;

    if (typeof values !== 'undefined') {
      this.data = this.prepareValues({ values, rows: this.rows, cols: this.cols });
    }

    this.databind();
    const nodes = this.memory.selectAll('rect').nodes();
    const timer = d3.timer((elapsed) => {
      this.draw(nodes);
      if (elapsed > ANIMATION_DURATION) timer.stop();
    });
  }

  databind() {
    const rowMapping = {};
    const colMapping = {};
    this.rows.forEach((d, i) => { rowMapping[d] = i; });
    this.cols.forEach((d, i) => { colMapping[d] = i; });

    const xScale = d3.scaleBand()
      .domain(this.cols)
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(this.rows)
      .range([0, height]);

    let colorScale = null;
    if (this.sequential) {
      colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain(this.valueRange);
    } else {
      colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(this.valueRange);
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
      .attr('fillStyle', (d) => d.highlight ? 'black' : colorScale(d.value))
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('x', d => xScale(d.col))
      .attr('y', d => yScale(d.row));

    rect.exit()
      .remove();

    const rowLabels = this.svg.selectAll('text.row-label')
      .data(this.rows, d => d);

    rowLabels.enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('text-anchor', 'end')
      .attr('transform', d => `translate(0, ${yScale(d) + 0.5 * yScale.bandwidth()})rotate(-45)`)
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .text(d => d)
      .on('click', (row) => {
        this.cols = this.data
          .filter(d => d.row === row)
          .sort((a, b) => b.value - a.value)
          .map(d => d.col);
        this.update({});
      });

    rowLabels
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('transform', d => `translate(0, ${yScale(d) + 0.5 * yScale.bandwidth()})rotate(-45)`)
      .text(d => d);

    rowLabels.exit()
      .remove();

    const colLabels = this.svg.selectAll('text.col-label')
      .data(this.cols, d => d);

    colLabels.enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('text-anchor', 'end')
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .style('transform', d => `translate(${xScale(d) + 0.5 * xScale.bandwidth()}px, 0px)rotate(45deg)`)
      .text(d => d)
      .on('click', (col) => {
        this.rows = this.data
          .filter(d => d.col === col)
          .sort((a, b) => b.value - a.value)
          .map(d => d.row);
        this.update({});
      });

    colLabels
      .transition()
      .duration(ANIMATION_DURATION)
      .style('transform', d => `translate(${xScale(d) + 0.5 * xScale.bandwidth()}px, 0px)rotate(45deg)`)
      .text(d => d);

    colLabels.exit()
      .remove();

    const that = this;
    d3.select(this.canvas).on('mousemove', function () {
      const [x, y] = d3.mouse(this);

      const xBands = xScale.step();
      const xBandIdx = Math.floor(x / xBands);
      const col = xScale.domain()[xBandIdx];

      const yBands = yScale.step();
      const yBandIdx = Math.floor(y / yBands);
      const row = yScale.domain()[yBandIdx];

      that.highlight({ row, col });
    });
  }

  highlight({ row, col }) {
    this.data.forEach((d) => {
      d.highlight = (d.row === row && typeof d.row !== 'undefined')
        || (d.col === col && typeof d.col !== 'undefined');
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
