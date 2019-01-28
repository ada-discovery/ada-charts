import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/scatterplot.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.memory = d3.select(document.createElement('memory'));
    this.canvas = d3.select(container)
      .append('canvas')
      .attr('class', 'ac-scatter-canvas');
    this.svg = d3.select(container)
      .append('svg')
      .append('g');

    this.values = [];
  }

  static get name() {
    return 'scatterplot';
  }

  prepareSVGForCapture() {
    return this.svg;
  }

  render({
    values,
  }) {
    this.values = typeof values === 'undefined' ? this.values : values;

    const xValues = [];
    const yValues = [];
    const zValues = [];
    this.values.forEach(d => {
      xValues.push(d.x);
      yValues.push(d.y);
      zValues.push(d.z);
    });

    const margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(xValues))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(yValues))
      .range([height, 0]);

    this.canvas
      .attr('width', width)
      .attr('height', height)
      .style('transform', `translate(${margin.left}px, ${margin.top}px)`);

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-x-axis ac-scatter-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-y-axis ac-scatter-axis')
      .call(yAxis);

    const point = this.memory.selectAll('.ac-scatter-point')
      .data(values);

    point.enter()
      .append('circle')
      .attr('dx', d => x(d.x))
      .attr('dy', d => y(d.y))
      .attr('r', Math.ceil(width / 200))
      .attr('fillStyle', d => '#000');

    point.exit()
      .remove();

    const nodes = this.memory.selectAll('circle').nodes();
    const context = this.canvas.node().getContext('2d');
    context.clearRect(0, 0, width, height);
    nodes.forEach((node) => {
      context.beginPath();
      context.arc(node.getAttribute('dx'), node.getAttribute('dy'), node.getAttribute('r'), 0, 2 * Math.PI, false);
      context.fillStyle = node.getAttribute('fillStyle');
      context.fill();
      context.strokeStyle = context.fillStyle;
      context.lineWidth = 1;
      context.stroke();
    });
  }
}
