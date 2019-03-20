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

    this.title = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .attr('class', 'ac-bar-title');

    this.axisBottom = this.svg
      .append('g')
      .attr('class', 'ac-bar-bottom-axis ac-bar-axis');

    this.axisLeft = this.svg
      .append('g')
      .attr('class', 'ac-bar-left-axis ac-bar-axis');

    this.axisRight = this.svg
      .append('g')
      .attr('class', 'ac-bar-right-axis ac-bar-axis');
  }

  static get name() {
    return 'barplot';
  }

  render({
    title,
    categories,
    series,
  }) {
    const groups = series.map(d => d.name);
    const data = [];
    series.forEach((d) => {
      d.data.forEach((e) => {
        e.category = e.name;
        e.group = d.name;
        delete e.name;
        delete e.key;
        data.push(e);
      });
    });

    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(d3.schemeSet3);

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

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.title
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`)
      .text(title);

    const x = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .paddingInner(0.1)
      .paddingOuter(0.05);

    const xSub = d3.scaleBand()
      .domain(groups)
      .range([0, x.bandwidth()]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data.map(d => d.y)))
      .range([height, 0]);

    this.axisBottom
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    this.axisLeft
      .attr('transform', `translate(${0}, ${0})`)
      .call(d3.axisLeft(y));

    this.axisRight
      .attr('transform', `translate(${width}, ${0})`)
      .call(d3.axisLeft(y).tickSizeInner(width).tickFormat(''));

    const barGroup = this.svg.selectAll('.ac-bar-group')
      .data(categories);

    barGroup.enter()
      .append('g')
      .attr('class', 'ac-bar-group')
      .merge(barGroup)
      .attr('transform', d => `translate(${x(d)}, 0)`);

    barGroup.exit()
      .remove();

    const bar = this.svg.selectAll('.ac-bar-group').selectAll('rect')
      .data(category => data.filter(d => d.category === category));

    bar.enter()
      .append('rect')
      .merge(bar)
      .attr('x', d => xSub(d.group))
      .attr('y', d => y(d.y))
      .attr('width', xSub.bandwidth())
      .attr('height', d => height - y(d.y))
      .attr('fill', d => color(d.group));

    bar.exit()
      .remove();

    const text = this.svg.selectAll('.ac-bar-group').selectAll('text')
      .data(category => data.filter(d => d.category === category));

    text.enter()
      .append('text')
      .merge(text)
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${xSub(d.group) + xSub.bandwidth() / 2}, ${y(d.y) - 1})`)
      .text(d => d.y);

    text.exit()
      .remove();
  }
}
