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

    const groups = data.map(d => d.label);
    const x = d3.scaleBand()
      .domain(groups)
      .range([0, width]);

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

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    const box = this.svg.selectAll('.ac-box-box')
      .data(data);

    box.enter()
      .append('g')
      .attr('class', 'ac-box-box')
      .merge()
      .attr('');
  }
}
