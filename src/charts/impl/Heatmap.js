import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/heatmap.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });
    this.ANIMATION_DURATION = 1000;
    this.memory = d3.select(document.createElement('memory'));
    this.canvas = d3.select(container)
      .append('canvas')
      .attr('class', 'ac-canvas');
    this.svg = d3.select(container).append('svg')
      .append('g');
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
    this.sequential = true;
    this.height = 0;
    this.width = 0;
    this.margin = {};
  }

  static get name() {
    return 'heatmap';
  }

  prepareSVGForCapture() {
    return this.svg;
  }

  prepareValues({ values, rows, cols }) {
    this.data = [];
    rows.forEach((row, i) => {
      cols.forEach((col, j) => {
        const value = values[i * cols.length + j];
        this.data.push({ value, row, col });
      });
    });
  }

  render({ values, valueRange, rows, cols, sequential }) {
    this.valueRange = typeof valueRange === 'undefined' ? this.valueRange : valueRange;
    this.rows = typeof rows === 'undefined' ? this.rows : rows;
    this.cols = typeof cols === 'undefined' ? this.cols : cols;
    this.sequential = typeof sequential === 'undefined' ? this.sequential : sequential;

    if (typeof values !== 'undefined') {
      this.prepareValues({ values, rows: this.rows, cols: this.cols });
    }

    this.margin = {
      top: this.containerWidth / 10,
      right: 10,
      bottom: 10,
      left: this.containerWidth / 10,
    };
    this.width = this.containerWidth - this.margin.left - this.margin.right;
    this.height = this.containerWidth - this.margin.top - this.margin.bottom;

    this.xScale = d3.scaleBand()
      .domain(this.cols)
      .range([0, this.width]);

    this.yScale = d3.scaleBand()
      .domain(this.rows)
      .range([0, this.height]);

    let colorScale = null;
    if (this.sequential) {
      colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain(this.valueRange);
    } else {
      colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(this.valueRange);
    }

    this.canvas
      .attr('width', this.width)
      .attr('height', this.height)
      .style('transform', `translate(${this.margin.left}px, ${this.margin.top}px)`);

    d3.select(this.container).select('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.svg
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);


    this.horiHL
      .style('left', `${this.margin.left}px`)
      .style('width', `${this.width}px`)
      .style('height', `${this.yScale.bandwidth()}px`);

    this.vertHL
      .style('top', `${this.margin.top}px`)
      .style('width', `${this.xScale.bandwidth()}px`)
      .style('height', `${this.height}px`);

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
      .transition()
      .duration(this.ANIMATION_DURATION)
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .attr('x', d => this.xScale(d.col))
      .attr('y', d => this.yScale(d.row))
      .attr('fillStyle', d => colorScale(d.value));

    rect.exit()
      .remove();

    const wrap = (d, i, arr) => {
      const node = d3.select(arr[i]);
      let textLength = node.node().getComputedTextLength();
      let text = node.text();
      while (textLength > (this.margin.left) && text.length > 0) {
        text = text.slice(0, -1);
        node.text(`${text}..`);
        textLength = node.node().getComputedTextLength();
      }
    };

    const rowLabels = this.svg.selectAll('text.ac-row-label')
      .data(this.rows, d => d);

    rowLabels.enter()
      .append('text')
      .attr('class', 'ac-row-label')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle')
      .style('transform', d => `translate(-5px, ${this.yScale(d) + 0.5 * this.yScale.bandwidth()}px)`)
      .text(d => d)
      .on('click', (row) => {
        this.cols = this.data
          .filter(d => d.row === row)
          .sort((a, b) => {
            if (typeof a.value === 'undefined') return 1;
            if (typeof b.value === 'undefined') return 0;
            return b.value - a.value;
          })
          .map(d => d.col);
        this.update({});
      })
      .merge(rowLabels)
      .each(wrap);

    rowLabels
      .transition()
      .duration(this.ANIMATION_DURATION)
      .style('transform', d => `translate(-5px, ${this.yScale(d) + 0.5 * this.yScale.bandwidth()}px)`);

    rowLabels.exit()
      .remove();

    const colLabels = this.svg.selectAll('text.ac-col-label')
      .data(this.cols, d => d);

    colLabels.enter()
      .append('text')
      .attr('class', 'ac-col-label')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle')
      .style('transform', d => `translate(${this.xScale(d) + 0.5 * this.xScale.bandwidth()}px, -5px)rotate(45deg)`)
      .text(d => d)
      .on('click', (col) => {
        this.rows = this.data
          .filter(d => d.col === col)
          .sort((a, b) => {
            if (typeof a.value === 'undefined') return 1;
            if (typeof b.value === 'undefined') return 0;
            return b.value - a.value;
          })
          .map(d => d.row);
        this.update({});
      })
      .merge(colLabels)
      .each(wrap);

    colLabels
      .transition()
      .duration(this.ANIMATION_DURATION)
      .style('transform', d => `translate(${this.xScale(d) + 0.5 * this.xScale.bandwidth()}px, -5px)rotate(45deg)`);

    colLabels.exit()
      .remove();

    this.canvas
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
    const context = this.canvas.node().getContext('2d');
    const t = d3.timer((elapsed) => {
      setTimeout(() => {
        context.clearRect(0, 0, this.width, this.height);
        nodes.forEach((node) => {
          context.fillStyle = node.getAttribute('fillStyle');
          context.fillRect(
            node.getAttribute('x'),
            node.getAttribute('y'),
            node.getAttribute('width'),
            node.getAttribute('height'),
          );
        });
      }, 0);
      if (elapsed > this.ANIMATION_DURATION) t.stop();
    }, 0);
  }

  highlight({ row, col }) {
    this.horiHL
      .style('visibility', typeof row === 'undefined' ? 'hidden' : 'visible')
      .style('top', `${this.yScale(row) + this.margin.top}px`);
    this.vertHL
      .style('visibility', typeof col === 'undefined' ? 'hidden' : 'visible')
      .style('left', `${this.xScale(col) + this.margin.left}px`);
    this.tooltip
      .style('visibility', (typeof row === 'undefined' && typeof row === 'undefined') ? 'hidden' : 'visible')
      .style('left', `${this.xScale(col) + this.margin.left + this.xScale.bandwidth()}px`)
      .style('top', `${this.yScale(row) + this.margin.top + this.yScale.bandwidth()}px`);

    if (typeof row !== 'undefined' && typeof col !== 'undefined') {
      // FIXME: this could be made faster by building an index
      const hoveredData = this.memory.selectAll('rect')
        .filter(d => d.row === row && d.col === col).data()[0];
      this.tooltip.html(() => `
Value &nbsp; ${hoveredData.value}</br>
Row &nbsp; &nbsp; ${row}</br>
Col &nbsp; &nbsp; &nbsp; ${col}</br>
`);
    }

    this.svg.selectAll('text.ac-row-label')
      .classed('highlight', false)
      .filter(d => d === row && typeof row !== 'undefined')
      .classed('highlight', true);
    this.svg.selectAll('text.ac-col-label')
      .classed('highlight', false)
      .filter(d => d === col && typeof col !== 'undefined')
      .classed('highlight', true);
  }
}
