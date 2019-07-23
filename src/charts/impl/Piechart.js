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
      bottom: this.containerWidth / 8,
      left: this.containerWidth / 20,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const groups = [...new Set(values.reduce((acc, cur) => acc.concat(cur.map(d => d.group)), []))];

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

    const circleNum = values.length;
    const maxRadius = Math.min(width / 2, height / 2);
    this.svg.selectAll('.ac-pie-slice').remove();
    this.svg.selectAll('.ac-pie-legend-element').remove();
    for (let circleIdx = 0; circleIdx < circleNum; circleIdx += 1) {
      const circleData = values[circleIdx];
      const circleGroups = circleData.map(d => d.group);
      const circleThickness = maxRadius / circleNum;
      const outerRadius = maxRadius - circleIdx * circleThickness;
      const innerRadius = outerRadius - circleThickness;

      const pie = d3.pie()
        .value(d => d.value)
        .sort(() => {})(circleData);

      const slice = this.svg.selectAll(`.ac-pie-slice.ac-pie-circle-idx-${circleIdx}`)
        .data(pie, d => `${circleNum}:${d.data.group}`);

      slice.enter()
        .append('path')
        .merge(slice)
        .attr('class', `ac-pie-slice ac-pie-circle-idx-${circleIdx}`)
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
        .attr('d', d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .attr('fill', d => color(d.data.group))
        .on('click', d => clickCallback(d.data));

      const legendX = d3.scalePoint()
        .domain(circleGroups)
        .range([0, width])
        .padding(0.1);

      const legendY = d3.scalePoint()
        .domain([...Array(circleNum).keys()])
        .range([height + margin.bottom, height])
        .padding(0.3);

      const legendElement = this.svg.selectAll(`.ac-pie-legend-element.ac-pie-circle-idx-${circleIdx}`)
        .data(circleGroups, d => d);

      legendElement.enter()
        .append('text')
        .attr('class', `ac-pie-legend-element ac-pie-circle-idx-${circleIdx}`)
        .attr('x', d => legendX(d))
        .attr('y', legendY(circleIdx))
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .attr('fill', color)
        .text(d => d)
        .on('mouseenter', (d) => {
          this.svg.selectAll('.ac-pie-slice')
            .filter(e => e.data.group === d)
            .style('fill', '#f00');
        })
        .on('mouseleave', () => {
          this.svg.selectAll('.ac-pie-slice')
            .style('fill', e => color(e.data.group));
        });
    }
  }
}
