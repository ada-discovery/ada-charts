import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/barplot.css';
import textUtils from '../../utils/textwrappers';

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
    barClickCallback,
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
      top: this.containerWidth / 12,
      right: this.containerWidth / 5,
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
      .paddingInner(0.2)
      .paddingOuter(0.05);

    const xSub = d3.scaleBand()
      .domain(groups)
      .range([0, x.bandwidth()]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data.map(d => d.y))])
      .range([height, 0]);

    this.axisBottom
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    this.axisLeft
      .attr('transform', `translate(${0}, ${0})`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .call(textUtils.axisShrinkFitText, margin.left);

    this.axisRight
      .attr('transform', `translate(${width}, ${0})`)
      .call(d3.axisLeft(y).tickSizeInner(width).tickFormat(''));

    const barCollection = this.svg.selectAll('.ac-bar-collection')
      .data(categories);

    barCollection.enter()
      .append('g')
      .attr('class', 'ac-bar-collection')
      .merge(barCollection)
      .attr('transform', d => `translate(${x(d)}, 0)`);

    barCollection.exit()
      .remove();

    const barGroup = this.svg.selectAll('.ac-bar-collection').selectAll('.ac-bar-group')
      .data(category => data.filter(d => d.category === category), d => `${d.group}:${d.category}`);

    barGroup.enter()
      .append('g')
      .attr('class', 'ac-bar-group')
      .call((parent) => {
        parent.append('rect')
          .attr('x', d => xSub(d.group))
          .attr('y', height)
          .transition()
          .duration(1000)
          .attr('x', d => xSub(d.group))
          .attr('y', d => y(d.y) - 2)
          .attr('width', xSub.bandwidth())
          .attr('height', d => height - y(d.y) + 2)
          .attr('fill', d => color(d.group));

        parent.append('text')
          .attr('text-anchor', 'end')
          .style('dominant-baseline', 'central')
          .attr('transform', d => `translate(${xSub(d.group) + xSub.bandwidth() / 2}, ${y(d.y) - 4})rotate(90)`)
          .style('visibility', 'hidden')
          .text(d => d.y);
      })
      .merge(barGroup)
      .on('click', d => barClickCallback(d))
      .on('mouseenter', (d) => {
        this.svg.selectAll('.ac-bar-group')
          .filter(e => d.group !== e.group)
          .transition()
          .duration(1000)
          .style('opacity', 0.2);
        this.svg.selectAll('.ac-bar-group')
          .filter(e => d.group === e.group)
          .call((parent) => {
            parent.select('text')
              .style('visibility', 'visible');
          });
      })
      .on('mouseleave', () => {
        this.svg.selectAll('.ac-bar-group')
          .transition()
          .duration(1000)
          .style('opacity', 1)
          .call((parent) => {
            parent.select('text')
              .style('visibility', 'hidden');
          });
      });

    barGroup
      .call((parent) => {
        parent.select('rect')
          .transition()
          .duration(1000)
          .attr('x', d => xSub(d.group))
          .attr('y', d => y(d.y) - 2)
          .attr('width', xSub.bandwidth())
          .attr('height', d => height - y(d.y) + 2)
          .attr('fill', d => color(d.group));

        parent.select('text')
          .attr('transform', d => `translate(${xSub(d.group) + xSub.bandwidth() / 2}, ${y(d.y) - 4})rotate(90)`)
          .style('visibility', 'hidden')
          .text(d => d.y);
      });

    barGroup.exit()
      .call((parent) => {
        parent.select('rect')
          .remove();

        parent.select('text')
          .remove();
      })
      .transition()
      .delay(1000)
      .remove();

    const legendElementSize = height / 30;

    const legend = this.svg.selectAll('.ac-bar-legend-element')
      .data(groups);

    const selectedGroups = [];
    legend.enter()
      .append('g')
      .attr('class', 'ac-bar-legend-element')
      .call((parent) => {
        parent
          .append('rect')
          .attr('width', legendElementSize)
          .attr('height', legendElementSize)
          .attr('fill', color);

        parent
          .append('text')
          .attr('text-anchor', 'start')
          .style('dominant-baseline', 'central')
          .attr('transform', `translate(${legendElementSize + 2}, ${legendElementSize / 2})`)
          .text(d => d);
      })
      .merge(legend)
      .attr('transform', (d, i) => `translate(${width + legendElementSize}, ${(legendElementSize + legendElementSize / 2) * i})`)
      .on('click', (group) => {
        const idx = selectedGroups.indexOf(group);
        if (idx >= 0) {
          selectedGroups.splice(idx, 1);
        } else {
          selectedGroups.push(group);
        }
        this.svg.selectAll('.ac-bar-group')
          .each((d, i, arr) => {
            d3.select(arr[i])
              .transition()
              .duration(1000)
              .style('opacity', selectedGroups.length === 0 || selectedGroups.includes(d.group) ? 1 : 0.2);
          });
        this.svg.selectAll('.ac-bar-legend-element')
          .each((d, i, arr) => {
            d3.select(arr[i])
              .transition()
              .duration(1000)
              .style('opacity', selectedGroups.length === 0 || selectedGroups.includes(d) ? 1 : 0.2);
          });
      });

    legend.exit()
      .remove();
  }
}
