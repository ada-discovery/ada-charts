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
      .attr('class', 'ac-canvas')
      .attr('width', width)
      .attr('height', height)
      .style('transform', `translate(${margin.left}px, ${margin.top}px)`)
      .node();
    this.svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    this.vertHL = d3.select(container)
      .append('div')
      .attr('class', 'ac-vert-hl');
    this.horiHL = d3.select(container)
      .append('div')
      .attr('class', 'ac-hori-hl');
    this.tooltip = d3.select(container)
      .append('div')
      .attr('class', 'ac-tooltip');
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

    const rowMapping = {};
    const colMapping = {};
    this.rows.forEach((d, i) => { rowMapping[d] = i; });
    this.cols.forEach((d, i) => { colMapping[d] = i; });

    this.xScale = d3.scaleBand()
      .domain(this.cols)
      .range([0, width]);

    this.yScale = d3.scaleBand()
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

    this.horiHL
      .style('left', `${margin.left}px`)
      .style('width', `${width}px`)
      .style('height', `${this.yScale.bandwidth()}px`);

    this.vertHL
      .style('top', `${margin.top}px`)
      .style('width', `${this.xScale.bandwidth()}px`)
      .style('height', `${height}px`);

    const rect = this.memory.selectAll('rect')
      .data(this.data, d => `${d.row}-${d.col}`);

    rect.enter()
      .append('rect')
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .attr('x', d => this.xScale(d.col))
      .attr('y', d => this.yScale(d.row))
      .attr('fillStyle', d => colorScale(d.value));

    rect
      .attr('fillStyle', (d) => d.highlight ? 'black' : colorScale(d.value))
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .attr('x', d => this.xScale(d.col))
      .attr('y', d => this.yScale(d.row));

    rect.exit()
      .remove();

    const rowLabels = this.svg.selectAll('text.ac-row-label')
      .data(this.rows, d => d);

    rowLabels.enter()
      .append('text')
      .attr('class', 'ac-row-label')
      .attr('text-anchor', 'end')
      .attr('transform', d => `translate(0, ${this.yScale(d) + 0.5 * this.yScale.bandwidth()})rotate(-45)`)
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
      .attr('transform', d => `translate(0, ${this.yScale(d) + 0.5 * this.yScale.bandwidth()})rotate(-45)`)
      .text(d => d);

    rowLabels.exit()
      .remove();

    const colLabels = this.svg.selectAll('text.ac-col-label')
      .data(this.cols, d => d);

    colLabels.enter()
      .append('text')
      .attr('class', 'ac-col-label')
      .attr('text-anchor', 'end')
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .style('transform', d => `translate(${this.xScale(d) + 0.5 * this.xScale.bandwidth()}px, 0px)rotate(45deg)`)
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
      .style('transform', d => `translate(${this.xScale(d) + 0.5 * this.xScale.bandwidth()}px, 0px)rotate(45deg)`)
      .text(d => d);

    colLabels.exit()
      .remove();

    d3.select(this.canvas)
      .on('mousemove', (_, i, arr) => {
        const [x, y] = d3.mouse(arr[i]);

        const xBands = this.xScale.step();
        const xBandIdx = Math.floor(x / xBands);
        const col = this.xScale.domain()[xBandIdx];

        const yBands = this.yScale.step();
        const yBandIdx = Math.floor(y / yBands);
        const row = this.yScale.domain()[yBandIdx];

        this.highlight({ row, col });
      })
      .on('mouseleave', () => this.highlight({}));

    const nodes = this.memory.selectAll('rect').nodes();
    const timer = d3.timer((elapsed) => {
      this.draw(nodes);
      if (elapsed > ANIMATION_DURATION) timer.stop();
    });
  }

  highlight({ row, col }) {
    this.horiHL
      .style('visibility', typeof row === 'undefined' ? 'hidden' : 'visible')
      .style('top', `${this.yScale(row) + margin.top}px`);
    this.vertHL
      .style('visibility', typeof col === 'undefined' ? 'hidden' : 'visible')
      .style('left', `${this.xScale(col) + margin.left}px`);
    this.tooltip
      .style('left', `${this.xScale(col) + margin.left}px`)
      .style('top', `${this.yScale(row) + margin.top}px`);
    this.svg.selectAll('text.ac-row-label')
      .classed('highlight', false)
      .filter(d => d === row && typeof row !== 'undefined')
      .classed('highlight', true);
    this.svg.selectAll('text.ac-col-label')
      .classed('highlight', false)
      .filter(d => d === col && typeof col !== 'undefined')
      .classed('highlight', true);
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
