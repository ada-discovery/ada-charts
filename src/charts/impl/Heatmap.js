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

  update({
           data, title, rowNames, colNames,
         }) {
    this.databind(data, rowNames, colNames);
    this.draw(this.canvas);

  }

  databind(data, rowNames, colNames) {
    const rectSize = Math.floor(width / rowNames.length);

    const rect = this.memory.selectAll('rect')
      .data(data);

    rect.enter()
      .append('rect')
      .merge(rect)
      .attr('width', rectSize)
      .attr('height', rectSize)
      .attr('x', (d, i) => (i % rowNames.length) * rectSize)
      .attr('y', (d, i) => Math.floor(i / rowNames.length) * rectSize)
      .attr('fillRect', 'black');

    rect.exit()
      .remove();
  }

  draw(canvas) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    this.memory.selectAll('rect') // FIXME: save this selection to improve performance
      .each(function () {
        const node = d3.select(this);
        context.fillStyle = node.attr('fillStyle');
        context.strokeRect(node.attr('x'), node.attr('y'), node.attr('width'), node.attr('height'));
      });
  }
}
