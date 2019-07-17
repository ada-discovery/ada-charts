import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/piechart.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.svg = d3.select(container)
      .append('svg')
      .attr('class', 'ac-pie-svg ada-chart')
      .append('g');

    this.caption = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .attr('class', 'ac-pie-caption');
  }

  static get name() {
    return 'piechart';
  }

  render({
    caption,
    clickCallback,
    values,
  }) {
    const margin = {
      top: this.containerWidth / 20,
      right: this.containerWidth / 20,
      bottom: this.containerWidth / 20,
      left: this.containerWidth / 20,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const color = d3.scaleOrdinal()
      .domain(values.map(d => d.group))
      .range(d3.schemeSet3);

    const data = d3.pie()
      .value(d => d.value)
      .sort((a, b) => d3.ascending(a.value, b.value))(values);

    const radius = Math.min(width / 2, height / 2);

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.caption
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`)
      .text(caption);

    const slice = this.svg.selectAll('.ac-pie-slice')
      .data(data);

    slice.enter()
      .append('path')
      .attr('class', 'ac-pie-slice')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
      .attr('fill', d => color(d.value))
      .on('click', clickCallback);

    slice.exit()
      .remove();
  }
}
