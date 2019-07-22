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
    const data = values.reduce((acc, d, i) => acc.concat(d.map(e => ({
      group: e.group,
      circleIdx: i,
      value: e.value,
    })), []));

    const margin = {
      top: this.containerWidth / 20,
      right: this.containerWidth / 20,
      bottom: this.containerWidth / 20,
      left: this.containerWidth / 20,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const groups = [...new Set(data.map(d => d.group))];

    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(d3.schemeSet3);

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.caption
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`)
      .text(caption);

    const circleDepth = values.length;
    const maxRadius = Math.min(width / 2, height / 2);
    for (let circleIdx = 0; circleIdx < circleDepth; circleIdx += 1) {
      const circleData = data.filter(d => d.circleIdx === circleIdx);
      const circleThickness = maxRadius / circleDepth;
      const outerRadius = maxRadius - circleIdx * circleThickness;
      const innerRadius = outerRadius - circleThickness;

      const pie = d3.pie()
        .value(d => d.value)
        .sort((a, b) => d3.ascending(a.value, b.value))(circleData);

      const slice = this.svg.selectAll(`.ac-pie-slice .circle-idx-${circleIdx}`)
        .data(pie);

      slice.enter()
        .append('path')
        .attr('class', `ac-pie-slice circle-idx-${circleIdx}`)
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
        .attr('d', d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .attr('fill', d => color(d.data.group))
        .on('click', d => clickCallback(d.data));

      slice.exit()
        .remove();
    }
  }
}
