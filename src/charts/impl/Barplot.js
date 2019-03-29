import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/barplot.css';
import textUtils from '../../utils/textwrappers';

const BAR_PADDING_FACTOR = 0.1;
const CATEGORY_PADDING_FACTOR = 0.2;
const OUTER_PADDING_FACTOR = 0.1;

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
    values,
    dataType,
    xAxisLabel,
    yAxisLabel,
    barClickCallback,
  }) {
    const groups = values.map(d => d.group);
    const data = [];
    let valuesContainsPositive = false;
    let valuesContainsNegative = false;
    values.forEach((d) => {
      d.data.forEach((e) => {
        if (e.y > 0) {
          valuesContainsPositive = true;
        } else {
          valuesContainsNegative = true;
        }
        e.group = d.group;
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

    const outerPadding = OUTER_PADDING_FACTOR * width;

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.title
      .attr('transform', `translate(${width / 2}, ${-margin.top / 2})`)
      .text(title);

    const xValues = data.reduce((prev, curr) => prev.concat(curr), []).map(d => d.x);
    const uniXValues = Array.from(new Set(xValues));
    const maxYValue = d3.max(data.map(d => Math.abs(d.y)));

    const x = (() => {
      if (dataType.startsWith('cat')) {
        return d3.scaleBand()
          .domain(uniXValues)
          .range([0, width]);
      }
      return d3.scaleLinear()
        .domain(d3.extent(data.map(d => d.x)))
        .range([outerPadding, width - outerPadding]);
    })();

    const barWidth = (() => {
      if (dataType.startsWith('cat')) {
        return width / uniXValues.length * (1 - CATEGORY_PADDING_FACTOR) / groups.length;
      }
      let minDist = outerPadding * 2;
      groups.forEach((group) => {
        const groupData = data.filter(d => d.group === group);
        for (let i = 0; i < groupData.length - 1; i += 1) {
          const dist = Math.abs(x(groupData[i].x) - x(groupData[i + 1].x));
          if (dist < minDist) {
            minDist = dist;
          }
        }
      });
      return minDist * (1 - BAR_PADDING_FACTOR);
    })();

    function dToX(d) {
      if (dataType.startsWith('num') || dataType.startsWith('time')) {
        return x(d.x);
      }
      const categoryWidth = width / uniXValues.length;
      const catIdx = uniXValues.indexOf(d.x);
      const groupIdx = groups.indexOf(d.group);
      return catIdx * categoryWidth + groupIdx * barWidth + barWidth * 0.75;
    }

    const y = d3.scaleLinear()
      .domain([!valuesContainsNegative ? 0 : -maxYValue, !valuesContainsPositive ? 0 : maxYValue])
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

    const selectedGroups = [];

    const bar = this.svg.selectAll('.ac-bar-bar')
      .data(data);

    bar.enter()
      .append('g')
      .attr('class', 'ac-bar-bar')
      .call((parent) => {
        parent.append('rect')
          .attr('x', d => dToX(d) - barWidth / 2)
          .attr('width', barWidth)
          .attr('y', y(0))
          .transition()
          .duration(500)
          .attr('y', d => (d.y < 0 ? y(0) : y(d.y)))
          .attr('height', (d) => {
            if (valuesContainsNegative && valuesContainsPositive) {
              return d.y < 0 ? y(d.y) - height / 2 : height / 2 - y(d.y);
            }
            if (valuesContainsNegative && !valuesContainsPositive) {
              return y(d.y);
            }
            return height - y(d.y);
          })
          .attr('fill', d => color(d.group));

        parent.append('text')
          .attr('text-anchor', d => (d.y < 0 ? 'start' : 'end'))
          .style('dominant-baseline', 'central')
          .attr('transform', d => `translate(${dToX(d)}, ${y(d.y)})rotate(90)`)
          .style('visibility', 'hidden')
          .text(d => `\u00A0${d.y}\u00A0`);
      })
      .merge(bar)
      .on('click', d => barClickCallback(d))
      .on('mouseenter', (d) => {
        this.svg.selectAll('.ac-bar-bar')
          .transition()
          .duration(500)
          .style('opacity', e => (d.group !== e.group ? 0.2 : 1));
        this.svg.selectAll('.ac-bar-bar')
          .filter(e => d.group === e.group)
          .call((parent) => {
            parent.select('text')
              .style('visibility', 'visible');
          });
      })
      .on('mouseleave', () => {
        this.svg.selectAll('.ac-bar-bar')
          .call((parent) => {
            parent.select('text')
              .style('visibility', 'hidden');
          })
          .transition()
          .duration(500)
          .style('opacity', d => (selectedGroups.length === 0 || selectedGroups.includes(d.group) ? 1 : 0.2));
      });

    bar
      .call((parent) => {
        parent.select('rect')
          .transition()
          .duration(500)
          .attr('x', d => dToX(d) - barWidth / 2)
          .attr('y', d => (d.y < 0 ? y(0) : y(d.y)))
          .attr('width', barWidth)
          .attr('height', (d) => {
            if (valuesContainsNegative && valuesContainsPositive) {
              return d.y < 0 ? y(d.y) - height / 2 : height / 2 - y(d.y);
            }
            if (valuesContainsNegative && !valuesContainsPositive) {
              return y(d.y);
            }
            return height - y(d.y);
          })
          .attr('fill', d => color(d.group));

        parent.select('text')
          .attr('text-anchor', d => (d.y < 0 ? 'start' : 'end'))
          .attr('transform', d => `translate(${dToX(d)}, ${y(d.y)})rotate(90)`)
          .style('visibility', 'hidden')
          .text(d => `\u00A0${d.y}\u00A0`);
      });

    bar.exit()
      .remove();

    const legendElementSize = height / 30;

    const legend = this.svg.selectAll('.ac-bar-legend-element')
      .data(groups);

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
      .each((_, i, arr) => {
        textUtils.sliceFitText(d3.select(arr[i]).select('text').node(), margin.right - 2 * legendElementSize - 4);
      })
      .attr('transform', (d, i) => `translate(${width + legendElementSize}, ${(legendElementSize + legendElementSize / 2) * i})`)
      .on('click', (group) => {
        const idx = selectedGroups.indexOf(group);
        if (idx >= 0) {
          selectedGroups.splice(idx, 1);
        } else {
          selectedGroups.push(group);
        }
        this.svg.selectAll('.ac-bar-bar')
          .each((d, i, arr) => {
            d3.select(arr[i])
              .transition()
              .duration(500)
              .style('opacity', selectedGroups.length === 0 || selectedGroups.includes(d.group) ? 1 : 0.2);
          });
        this.svg.selectAll('.ac-bar-legend-element')
          .each((d, i, arr) => {
            d3.select(arr[i])
              .transition()
              .duration(500)
              .style('opacity', selectedGroups.length === 0 || selectedGroups.includes(d) ? 1 : 0.2);
          });
      });

    legend.exit()
      .remove();
  }
}
