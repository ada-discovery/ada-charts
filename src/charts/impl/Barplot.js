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

    const innerPadding = 0;
    const outerPadding = innerPadding;
    const x = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .paddingInner(innerPadding)
      .paddingOuter(outerPadding);

    const xSub = d3.scaleBand()
      .domain(groups)
      .range([0, x.bandwidth()]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data.map(d => d.y)))
      .range([height, 0]);

    const barGroup = this.svg.selectAll('.bar-group')
      .data(categories);

    barGroup.enter()
      .append('g')
      .attr('class', 'bar-group')
      .merge(barGroup)
      .attr('transform', d => `translate(${x(d)}, 0)`);

    barGroup.exit()
      .remove();

    const bar = this.svg.selectAll('.bar-group').selectAll('rect')
      .data(category => data.filter(d => d.category === category));

    bar.enter()
      .append('rect')
      .merge(bar)
      .attr('x', d => xSub(d.group))
      .attr('y', d => y(d.y))
      .attr('width', xSub.bandwidth())
      .attr('height', d => height - y(d.y));

    bar.exit()
      .remove();
  }
}
