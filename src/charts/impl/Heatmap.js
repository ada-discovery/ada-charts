import * as d3 from 'd3';
import Chart from '../Chart';

const margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

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
  }

  static get name() {
    return 'heatmap';
  }

  update({ data, valueRange, title, rowNames, colNames, sequential }) {
    this.databind(data, valueRange, rowNames, colNames, sequential);
    this.draw(this.canvas);
  }

  databind(data, valueRange, rowNames, colNames, sequential) {
    const rectSize = Math.floor(height / rowNames.length); // FIXME: this is just a placeholder

    let colorScale = null;
    if (sequential) {
      colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain(valueRange || d3.extent(data));
    } else {
      colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(valueRange || d3.extent(data));
    }

    const rect = this.memory.selectAll('rect')
      .data(data);

    rect.enter()
      .append('rect')
      .merge(rect)
      .attr('width', rectSize)
      .attr('height', rectSize)
      .attr('x', (d, i) => (i % colNames.length) * rectSize)
      .attr('y', (d, i) => Math.floor(i / colNames.length) * rectSize)
      .attr('fillStyle', d => colorScale(d));

    rect.exit()
      .remove();

    const rowLabels = this.svg.selectAll('text.row-label')
      .data(rowNames);

    rowLabels.enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('text-anchor', 'end')
      .attr('transform', (d, i) => `translate(0, ${(i + 0.5) * rectSize})rotate(-45)`)
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .text(d => d)
      .on('click', (_, i) => {
        const sortedData = data
          .map((d, j) => [d, j])
          .sort((a, b) => {
            const rowIdxA = Math.floor(a[1] / colNames.length);
            const rowIdxB = Math.floor(b[1] / colNames.length);
            if (rowIdxA < rowIdxB) {
              return -1;
            }
            if (rowIdxA > rowIdxB) {
              return 1;
            }
            const valA = data[(i * colNames.length) + (b[1] % rowNames.length)];
            const valB = data[(i * colNames.length) + (a[1] % rowNames.length)];
            return valB - valA;
          })
          .map(d => d[0]);
        this.update({ data: sortedData, valueRange, rowNames, colNames, sequential });
      });

    const colLabels = this.svg.selectAll('text.col-label')
      .data(colNames);

    colLabels.enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('text-anchor', 'end')
      .style('transform', (d, i) => `translate(${(i + 0.5) * rectSize}px, 0px)rotate(45deg)`)
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .text(d => d);
  }

  draw(canvas) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    this.memory.selectAll('rect') // FIXME: save this selection to improve performance
    // eslint-disable-next-line func-names
      .each(function () {
        const node = d3.select(this);
        context.fillStyle = node.attr('fillStyle');
        context.fillRect(node.attr('x'), node.attr('y'), node.attr('width'), node.attr('height'));
      });
  }
}
