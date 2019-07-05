import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/boxplot.css';
import textUtils from '../../utils/textwrappers';

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

    this.caption = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'ac-box-caption');

    this.xAxisLabel = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .attr('class', 'ac-box-axis-label');

    this.yAxisLabel = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .attr('class', 'ac-box-axis-label');
  }

  static get name() {
    return 'boxplot';
  }

  render({
    caption, xAxisLabel, yAxisLabel, data, max, min, clickCallback,
  }) {
    const margin = {
      top: this.containerWidth / 20,
      right: this.containerWidth / 20,
      bottom: this.containerWidth / 8,
      left: this.containerWidth / 8,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const UPPER_LOWER_PADDING = height / 20;
    const X_AXIS_LABEL_SPACE = margin.bottom / 4;
    const Y_AXIS_LABEL_SPACE = margin.left / 4;

    this.caption
      .text(caption)
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`);

    this.xAxisLabel
      .text(xAxisLabel)
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - X_AXIS_LABEL_SPACE / 2})`);

    this.yAxisLabel
      .text(yAxisLabel)
      .attr('transform', `translate(${-margin.left + Y_AXIS_LABEL_SPACE / 2}, ${height / 2})rotate(-90)`);

    const groups = data.map(d => d.group);

    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(d3.schemeSet2);

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
      .range([height - UPPER_LOWER_PADDING, UPPER_LOWER_PADDING]);

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
      .attr('x', 8)
      .call(textUtils.axisShrinkFitText, margin.bottom - X_AXIS_LABEL_SPACE);
    this.axisRight
      .attr('transform', `translate(${width}, 0)`)
      .call(axisRight);
    this.axisLeft
      .call(axisLeft)
      .selectAll('text')
      .call(textUtils.axisShrinkFitText, margin.left - Y_AXIS_LABEL_SPACE);

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
      .attr('y', d => y(d.median))
      .attr('width', x.bandwidth())
      .style('fill', d => color(d.group))
      .style('opacity', 1)
      .on('mouseenter', (d) => {
        this.svg.selectAll('.ac-box-value')
          .filter(e => e.group === d.group)
          .transition()
          .duration(500)
          .style('opacity', 1);
      })
      .on('mouseleave', () => {
        this.svg.selectAll('.ac-box-value')
          .transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', d => clickCallback(d))
      .transition()
      .duration(500)
      .attr('y', d => y(d.upperQuartile))
      .attr('height', d => y(d.lowerQuartile) - y(d.upperQuartile));

    box
      .transition()
      .duration(500)
      .attr('x', d => x(d.group))
      .attr('y', d => y(d.upperQuartile))
      .attr('width', x.bandwidth())
      .attr('height', d => y(d.lowerQuartile) - y(d.upperQuartile))
      .style('opacity', 1)
      .style('fill', d => color(d.group));

    box.exit()
      .remove();

    const line = this.svg.selectAll('.ac-box-line')
      .data(data);

    line.enter()
      .append('line')
      .attr('class', 'ac-box-line')
      .attr('stroke', d => color(d.group))
      .attr('x1', d => x(d.group) + x.bandwidth() / 2)
      .attr('y1', d => y(d.median))
      .attr('x2', d => x(d.group) + x.bandwidth() / 2)
      .attr('y2', d => y(d.median))
      .transition()
      .duration(500)
      .attr('y1', d => y(d.upperWhisker))
      .attr('y2', d => y(d.lowerWhisker));

    line
      .transition()
      .duration(500)
      .attr('stroke', d => color(d.group))
      .attr('x1', d => x(d.group) + x.bandwidth() / 2)
      .attr('y1', d => y(d.upperWhisker))
      .attr('x2', d => x(d.group) + x.bandwidth() / 2)
      .attr('y2', d => y(d.lowerWhisker));

    line.exit()
      .remove();

    // const upperWhisker = this.svg.selectAll('.ac-box-upper-whisker')
    //   .data(data);
    //
    // upperWhisker.enter()
    //   .append('line')
    //   .attr('class', 'ac-box-upper-whisker')
    //   .attr('x1', d => x(d.group) + x.bandwidth() / 3)
    //   .attr('y1', d => y(d.median))
    //   .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
    //   .attr('y2', d => y(d.median))
    //   .transition()
    //   .duration(500)
    //   .attr('y1', d => y(d.upperWhisker))
    //   .attr('y2', d => y(d.upperWhisker));
    //
    // upperWhisker
    //   .transition()
    //   .duration(500)
    //   .attr('x1', d => x(d.group) + x.bandwidth() / 3)
    //   .attr('y1', d => y(d.upperWhisker))
    //   .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
    //   .attr('y2', d => y(d.upperWhisker));
    //
    // upperWhisker.exit()
    //   .remove();
    //
    // const lowerWhisker = this.svg.selectAll('.ac-box-lower-whisker')
    //   .data(data);
    //
    // lowerWhisker.enter()
    //   .append('line')
    //   .attr('class', 'ac-box-lower-whisker')
    //   .attr('x1', d => x(d.group) + x.bandwidth() / 3)
    //   .attr('y1', d => y(d.median))
    //   .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
    //   .attr('y2', d => y(d.median))
    //   .transition()
    //   .duration(500)
    //   .attr('y1', d => y(d.lowerWhisker))
    //   .attr('y2', d => y(d.lowerWhisker));
    //
    // lowerWhisker
    //   .transition()
    //   .duration(500)
    //   .attr('x1', d => x(d.group) + x.bandwidth() / 3)
    //   .attr('y1', d => y(d.lowerWhisker))
    //   .attr('x2', d => x(d.group) + x.bandwidth() - x.bandwidth() / 3)
    //   .attr('y2', d => y(d.lowerWhisker));
    //
    // lowerWhisker.exit()
    //   .remove();

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

    const upperWhiskerValue = this.svg.selectAll('.ac-box-value-upper-whisker')
      .data(data);

    upperWhiskerValue.enter()
      .append('text')
      .attr('class', 'ac-box-value ac-box-value-upper-whisker')
      .merge(upperWhiskerValue)
      .attr('transform', d => `translate(${x(d.group) + x.bandwidth() - x.bandwidth() / 3}, ${y(d.upperWhisker)})`)
      .attr('text-anchor', 'start')
      .style('dominant-baseline', 'central')
      .style('opacity', 0)
      .text(d => d.upperWhisker);

    upperWhiskerValue.exit()
      .remove();

    const lowerWhiskerValue = this.svg.selectAll('.ac-box-value-lower-whisker')
      .data(data);

    lowerWhiskerValue.enter()
      .append('text')
      .attr('class', 'ac-box-value ac-box-value-lower-whisker')
      .merge(lowerWhiskerValue)
      .attr('transform', d => `translate(${x(d.group) + x.bandwidth() - x.bandwidth() / 3}, ${y(d.lowerWhisker)})`)
      .attr('text-anchor', 'start')
      .style('dominant-baseline', 'central')
      .style('opacity', 0)
      .text(d => d.lowerWhisker);

    lowerWhiskerValue.exit()
      .remove();

    const upperQuartileValue = this.svg.selectAll('.ac-box-value-upper-quartile')
      .data(data);

    upperQuartileValue.enter()
      .append('text')
      .attr('class', 'ac-box-value ac-box-value-upper-quartile')
      .merge(upperQuartileValue)
      .attr('transform', d => `translate(${x(d.group)}, ${y(d.upperQuartile)})`)
      .attr('text-anchor', 'end')
      .style('dominant-baseline', 'central')
      .style('opacity', 0)
      .text(d => d.upperQuartile);

    upperQuartileValue.exit()
      .remove();

    const lowerQuartileValue = this.svg.selectAll('.ac-box-value-lower-quartile')
      .data(data);

    lowerQuartileValue.enter()
      .append('text')
      .attr('class', 'ac-box-value ac-box-value-lower-quartile')
      .merge(lowerQuartileValue)
      .attr('transform', d => `translate(${x(d.group)}, ${y(d.lowerQuartile)})`)
      .attr('text-anchor', 'end')
      .style('dominant-baseline', 'central')
      .style('opacity', 0)
      .text(d => d.lowerQuartile);

    lowerQuartileValue.exit()
      .remove();

    const medianValue = this.svg.selectAll('.ac-box-value-median')
      .data(data);

    medianValue.enter()
      .append('text')
      .attr('class', 'ac-box-value ac-box-value-median')
      .merge(medianValue)
      .attr('transform', d => `translate(${x(d.group) + x.bandwidth()}, ${y(d.median)})`)
      .attr('text-anchor', 'start')
      .style('dominant-baseline', 'central')
      .style('opacity', 0)
      .text(d => d.median);

    medianValue.exit()
      .remove();
  }
}
