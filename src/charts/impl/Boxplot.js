import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/boxplot.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.svg = d3.select(container)
      .append('svg')
      .attr('class', 'ada-chart')
      .append('g');

    this.axisRight = this.svg
      .append('g')
      .attr('class', 'ac-box-axis-right ac-box-axis');

    this.axisBottom = this.svg
      .append('g')
      .attr('class', 'ac-box-axis-bottom ac-box-axis');

    this.axisLeft = this.svg
      .append('g')
      .attr('class', 'ac-box-axis-left ac-box-axis');
  }

  static get name() {
    return 'boxplot';
  }

  render({
    caption, xAxisLabel, yAxisLabel, data, max, min,
  }) {
    const margin = {
      top: this.containerWidth / 10,
      right: this.containerWidth / 10,
      bottom: this.containerWidth / 10,
      left: this.containerWidth / 10,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const groups = data.map(d => d.group);

    const x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .paddingInner(0.5)
      .paddingOuter(0.5);

    const maxValue = (() => {
      const maxUpperWhisker = d3.max(data.map(d => d.upperWhisker));
      if (typeof max === 'undefined') {
        return maxUpperWhisker;
      }
      return d3.max(maxUpperWhisker, max);
    })();

    const minValue = (() => {
      const minLowerWhisker = d3.min(data.map(d => d.lowerWhisker));
      if (typeof min === 'undefined') {
        return minLowerWhisker;
      }
      return d3.min(minLowerWhisker, min);
    })();

    const y = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([height, 0]);

    const axisBottom = d3.axisBottom(x);
    const axisRight = d3.axisLeft(y)
      .tickSizeInner(width)
      .tickFormat('');
    const axisLeft = d3.axisLeft(y);

    this.axisBottom
      .attr('transform', `translate(0, ${height})`)
      .call(axisBottom)
      .selectAll('text')
      .attr('transform', 'rotate(45)')
      .attr('text-anchor', 'start')
      .attr('x', 8);
    this.axisRight
      .attr('transform', `translate(${width}, 0)`)
      .call(axisRight);
    this.axisLeft
      .call(axisLeft);

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    const box = this.svg.selectAll('.ac-box-box')
      .data(data, d => d.group);

    box.enter()
      .append('rect')
      .attr('class', 'ac-box-box')
      .attr('x', d => x(d.group))
      .attr('y', d => y(d.upperQuartile))
      .attr('width', x.bandwidth())
      .attr('height', d => y(d.lowerQuartile) - y(d.upperQuartile));

    box
      .transition()
      .duration(500)
      .attr('x', d => x(d.group))
      .attr('y', d => y(d.upperQuartile))
      .attr('width', x.bandwidth())
      .attr('height', d => y(d.lowerQuartile) - y(d.upperQuartile));

    box.exit()
      .remove();

    const line = this.svg.selectAll('.ac-box-line')
      .data(data);

    line.enter()
      .append('line')
      .attr('class', 'ac-box-line')
      .attr('x1', d => x(d.group) + x.bandwidth() / 2)
      .attr('y1', d => y(d.upperWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() / 2)
      .attr('y2', d => y(d.lowerWhisker));

    line
      .transition()
      .duration(500)
      .attr('x1', d => x(d.group) + x.bandwidth() / 2)
      .attr('y1', d => y(d.upperWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() / 2)
      .attr('y2', d => y(d.lowerWhisker));

    line.exit()
      .remove();

    const upperWhisker = this.svg.selectAll('.ac-box-upper-whisker')
      .data(data);

    upperWhisker.enter()
      .append('line')
      .attr('class', 'ac-box-upper-whisker')
      .attr('x1', d => x(d.group) + x.bandwidth() / 3)
      .attr('y1', d => y(d.upperWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
      .attr('y2', d => y(d.upperWhisker));

    upperWhisker
      .transition()
      .duration(500)
      .attr('x1', d => x(d.group) + x.bandwidth() / 3)
      .attr('y1', d => y(d.upperWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
      .attr('y2', d => y(d.upperWhisker));

    upperWhisker.exit()
      .remove();

    const lowerWhisker = this.svg.selectAll('.ac-box-lower-whisker')
      .data(data);

    lowerWhisker.enter()
      .append('line')
      .attr('class', 'ac-box-lower-whisker')
      .attr('x1', d => x(d.group) + x.bandwidth() / 3)
      .attr('y1', d => y(d.lowerWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
      .attr('y2', d => y(d.lowerWhisker));

    lowerWhisker
      .transition()
      .duration(500)
      .attr('x1', d => x(d.group) + x.bandwidth() / 3)
      .attr('y1', d => y(d.lowerWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
      .attr('y2', d => y(d.lowerWhisker));

    lowerWhisker.exit()
      .remove();

    const median = this.svg.selectAll('.ac-box-median')
      .data(data);

    median.enter()
      .append('line')
      .attr('class', 'ac-box-median')
      .attr('x1', d => x(d.group))
      .attr('y1', d => y(d.median))
      .attr('x2', d => x(d.group) + x.bandwidth())
      .attr('y2', d => y(d.median));

    median
      .transition()
      .duration(500)
      .attr('x1', d => x(d.group))
      .attr('y1', d => y(d.median))
      .attr('x2', d => x(d.group) + x.bandwidth())
      .attr('y2', d => y(d.median));

    median.exit()
      .remove();
  }
}
