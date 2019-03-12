import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/barplot.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.svg = d3.select(container)
      .append('svg')
      .attr('class', 'ac-box-svg ada-chart')
      .append('g');
  }

  static get name() {
    return 'barplot';
  }

  render({
    title,
    categories,
    series
  }) {
    const margin = {
      top: this.containerWidth / 15,
      right: this.containerWidth / 15,
      bottom: this.containerWidth / 15,
      left: this.containerWidth / 15,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const innerPadding = width / 20;
    const outerPadding = innerPadding;
    const x = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .paddingInner(innerPadding)
      .paddingOuter(outerPadding);

    const ys = series
      .reduce((prev, curr) => prev.concat(curr.data), [])
      .map(d => d.y);
    const y = d3.scaleLinear()
      .domain(d3.extent(ys))
      .range([height, 0]);

    const barGroup = this.svg.selectAll('.bar-group')
      .data(categories);

    barGroup.enter()
      .append('g')
      .attr('class', 'bar-group')
      .x(d => x(d));
  }
}
