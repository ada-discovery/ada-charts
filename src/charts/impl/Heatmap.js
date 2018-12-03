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
    function getMatrixIndex(row, col) { return row * colNames.length + col; }
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
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .merge(rowLabels)
      .attr('transform', (d, i) => `translate(0, ${(i + 0.5) * rectSize})rotate(-45)`)
      .text(d => d)
      .on('click', (_, rowIdx) => {
        const sortValues = data.slice(rowIdx * colNames.length, (rowIdx + 1) * colNames.length);
        const sortOrder = d3.range(0, colNames.length, 1)
          .sort((k, l) => {
            if (sortValues[k] < sortValues[l]) return -1;
            if (sortValues[k] > sortValues[l]) return 1;
            return 0;
          });
        const newData = [];
        for (let i = 0; i < rowNames.length; i += 1) {
          sortOrder.forEach((sortIdx) => {
            newData.push(data[getMatrixIndex(i, sortIdx)]);
          });
        }
        const newColNames = sortOrder.map(sortIdx => colNames[sortIdx]);
        this.update({ data: newData, valueRange, rowNames, colNames: newColNames, sequential });
      });

    const colLabels = this.svg.selectAll('text.col-label')
      .data(colNames);

    colLabels.enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('text-anchor', 'end')
      .style('font-size', '10px') // FIXME: needs to be dynamic
      .merge(colLabels)
      .style('transform', (d, i) => `translate(${(i + 0.5) * rectSize}px, 0px)rotate(45deg)`)
      .text(d => d)
      .on('click', (_, colIdx) => {
        const sortValues = rowNames.map((__, i) => data[getMatrixIndex(i, colIdx)]);
        const sortOrder = d3.range(0, rowNames.length, 1)
          .sort((k, l) => {
            if (sortValues[k] < sortValues[l]) return -1;
            if (sortValues[k] > sortValues[l]) return 1;
            return 0;
          });
        const newData = [];
        sortOrder.forEach((sortIdx) => {
          for (let i = 0; i < colNames.length; i += 1) {
            newData.push(data[getMatrixIndex(sortIdx, i)]);
          }
        });
        const newRowNames = sortOrder.map(sortIdx => rowNames[sortIdx]);
        this.update({ data: newData, valueRange, rowNames: newRowNames, colNames, sequential });
      });
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
