import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/scatterplot.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.memory = d3.select(document.createElement('memory'));
    this.canvas = d3.select(container)
      .append('canvas')
      .attr('class', 'ac-scatter-canvas');
    this.hiddenCanvas = document.createElement('canvas');
    this.svg = d3.select(container)
      .append('svg')
      .attr('class', 'ac-scatter-svg')
      .append('g');
    this.tooltip = d3.select(container)
      .append('div')
      .attr('class', 'ac-scatter-tooltip');

    this.values = [];
    this.callback = () => {};
    this.colorToTooltipMap = {};
  }

  static get name() {
    return 'scatterplot';
  }

  prepareSVGForCapture() {
    return this.svg;
  }

  render({
    values,
    callback,
  }) {
    this.values = typeof values === 'undefined' ? this.values : values;
    this.callback = typeof callback === 'undefined' ? this.callback : callback;

    const margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;

    const tooltipOffset = width / 100;

    const padding = width / 40;

    const x = d3.scaleLinear()
      .domain(d3.extent(values.map(d => d[0])))
      .range([padding, width - padding]);

    const y = d3.scaleLinear()
      .domain(d3.extent(values.map(d => d[1])))
      .range([height - padding, padding]);

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(values.map(d => d[2])));

    this.canvas
      .attr('width', width)
      .attr('height', height)
      .style('transform', `translate(${margin.left}px, ${margin.top}px)`);

    this.hiddenCanvas.width = width;
    this.hiddenCanvas.height = height;

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxisBottom = d3.axisBottom(x);
    const xAxisTop = d3.axisBottom(x)
      .tickSizeInner(height)
      .tickFormat('');

    const yAxisLeft = d3.axisLeft(y);
    const yAxisRight = d3.axisLeft(y)
      .tickSizeInner(width)
      .tickFormat('');

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-x-axis ac-scatter-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxisBottom);

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-x-axis ac-scatter-axis')
      .call(xAxisTop);

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-y-axis ac-scatter-axis')
      .call(yAxisLeft);

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-y-axis ac-scatter-axis')
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxisRight);

    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', () => {
        if (!d3.event.sourceEvent || !d3.event.selection) return;
        const [[x0, y0], [x1, y1]] = d3.event.selection;
        this.callback([[x.invert(x0), y.invert(y0)], [x.invert(x1), y.invert(y1)]]);
      });

    this.svg
      .append('g')
      .attr('class', 'ac-scatter-brush')
      .call(brush);

    this.svg
      .on('mousemove', (d, i, nodes) => {
        const [xPos, yPos] = d3.mouse(nodes[i]);
        const ctx = this.hiddenCanvas.getContext('2d');
        const [r, g, b] = ctx.getImageData(xPos, yPos, 1, 1).data;
        const tooltip = this.colorToTooltipMap[`${r}:${g}:${b}`];
        if (typeof tooltip === 'undefined') {
          this.tooltip
            .style('visibility', 'hidden');
        } else {
          this.tooltip
            .style('left', `${xPos + margin.left + tooltipOffset}px`)
            .style('top', `${yPos + margin.top + tooltipOffset}px`)
            .style('visibility', 'visible')
            .html(tooltip);
        }
      })
      .on('mouseleave', () => {
        this.tooltip
          .style('visibility', 'hidden');
      });

    const point = this.memory.selectAll('.ac-scatter-point')
      .data(values);

    point.enter()
      .append('circle')
      .attr('dx', d => x(d[0]))
      .attr('dy', d => y(d[1]))
      .attr('r', Math.ceil(width / 200))
      .attr('fillStyle', d => color(d[2]))
      .attr('title', d => `
${d[0]}</br>
${d[1]}</br>
${d[2]}</br>
`);

    point.exit()
      .remove();

    const nodes = this.memory.selectAll('circle').nodes();
    const ctx = this.canvas.node().getContext('2d');
    const hiddenCtx = this.hiddenCanvas.getContext('2d');
    this.colorToTooltipMap = {};
    ctx.clearRect(0, 0, width, height);
    hiddenCtx.clearRect(0, 0, width, height);
    nodes.forEach((node, i) => {
      // draw visible point
      ctx.beginPath();
      ctx.arc(
        node.getAttribute('dx'),
        node.getAttribute('dy'),
        node.getAttribute('r'),
        0,
        2 * Math.PI,
        false,
      );
      ctx.fillStyle = node.getAttribute('fillStyle');
      ctx.fill();

      // draw invisible square with unique color
      const colorCode = i + 1;
      // eslint-disable-next-line no-bitwise
      const r = colorCode >> 16;
      // eslint-disable-next-line no-bitwise
      const g = colorCode - (r << 16) >> 8;
      // eslint-disable-next-line no-bitwise
      const b = colorCode - (r << 16) - (g << 8);
      this.colorToTooltipMap[`${r}:${g}:${b}`] = node.getAttribute('title');
      hiddenCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      hiddenCtx.fillRect(
        parseInt(node.getAttribute('dx') - node.getAttribute('r'), 10),
        parseInt(node.getAttribute('dy') - node.getAttribute('r'), 10),
        Math.ceil(node.getAttribute('r') * 2 + 0.5),
        Math.ceil(node.getAttribute('r') * 2 + 0.5),
      );
    });
  }
}
