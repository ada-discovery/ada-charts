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

    this.title = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .attr('class', 'ac-pie-title');
  }

  static get name() {
    return 'piechart';
  }

  render({
    title,
    values
  }) {
    const margin = {
      top: this.containerWidth / 12,
      right: this.containerWidth / 5,
      bottom: this.containerWidth / 15,
      left: this.containerWidth / 12,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.title
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`)
      .text(title);
  }
}
