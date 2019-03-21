import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/scatterplot.css';
import textUtils from '../../utils/textwrappers';

const ANIMATION_DURATION = 500;
const MAX_FONT_SIZE = 20;


export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.memory = d3.select(document.createElement('memory'));
    this.hiddenCanvas = document.createElement('canvas');
    this.svg = d3.select(container)
      .append('svg')
      .attr('class', 'ac-scatter-svg ada-chart')
      .append('g');

    this.tooltip = d3.select(container)
      .append('div')
      .attr('class', 'ac-scatter-tooltip');

    this.axisBottom = this.svg
      .append('g')
      .attr('class', 'ac-scatter-x-axis ac-scatter-axis');

    this.axisTop = this.svg
      .append('g')
      .attr('class', 'ac-scatter-x-axis ac-scatter-axis');

    this.axisLeft = this.svg
      .append('g')
      .attr('class', 'ac-scatter-y-axis ac-scatter-axis');

    this.axisRight = this.svg
      .append('g')
      .attr('class', 'ac-scatter-y-axis ac-scatter-axis');

    this.foreignObject = this.svg
      .append('foreignObject');

    this.foreignBody = this.foreignObject
      .append('xhtml:body')
      .style('margin', '0px')
      .style('padding', '0px')
      .style('background-color', 'none');

    this.canvas = this.foreignBody
      .append('canvas')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'ac-scatter-canvas');

    this.titleHeader = this.svg
      .append('text')
      .attr('class', 'ac-scatter-title');

    this.xLabel = this.svg
      .append('text')
      .attr('class', 'ac-scatter-axis-text');

    this.yLabel = this.svg
      .append('text')
      .attr('class', 'ac-scatter-axis-text');

    this.brush = this.svg
      .append('g')
      .attr('class', 'ac-scatter-brush');

    this.legend = this.svg
      .append('g')
      .attr('class', 'ac-scatter-legend');

    this.legend
      .append('rect');

    this.values = [];
    this.categories = {};
    this.title = '';
    this.xAxisLabel = '';
    this.yAxisLabel = '';
    this.callback = () => {};
    this.colorToTooltipMap = {};

    this.width = 0;
    this.height = 0;
  }

  static get name() {
    return 'scatterplot';
  }

  captureSetup() {
    this.canvas.style('display', 'hidden');
    this.captureImage = this.svg.insert('image', ':first-child')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('xlink:href', this.canvas.node().toDataURL('image/png'));
  }

  captureTeardown() {
    this.canvas.style('display', 'visible');
    this.captureImage.node().parentNode.removeChild(this.captureImage.node());
    this.render({});
  }

  render({
    values,
    categories,
    title,
    xAxisLabel,
    yAxisLabel,
    callback,
    _selectedCategory,
    _skipAnimation,
  }) {
    this.values = typeof values === 'undefined' ? this.values : values;
    this.categories = typeof categories === 'undefined' ? this.categories : categories;
    this.title = typeof title === 'undefined' ? this.title : title;
    this.xAxisLabel = typeof xAxisLabel === 'undefined' ? this.xAxisLabel : xAxisLabel;
    this.yAxisLabel = typeof yAxisLabel === 'undefined' ? this.yAxisLabel : yAxisLabel;
    this.callback = typeof callback === 'undefined' ? this.callback : callback;

    const categoryKeys = Object.keys(this.categories)
      .filter(d => d !== 'name')
      .map(d => parseInt(d, 10));

    const margin = {
      top: this.containerWidth / 15,
      right: this.containerWidth / 15,
      bottom: this.containerWidth / 10,
      left: this.containerWidth / 10,
    };

    const width = this.containerWidth - margin.left - margin.right;
    const height = this.containerWidth - margin.top - margin.bottom;
    this.width = width;
    this.height = height;

    const tooltipOffset = width / 100;
    const yLabelSize = (margin.left / 5) > MAX_FONT_SIZE ? MAX_FONT_SIZE : (margin.left / 5);
    const xLabelSize = yLabelSize;
    const padding = width / 40;

    const x = d3.scaleLinear()
      .domain(d3.extent(this.values.map(d => d[0])))
      .range([padding, width - padding]);

    const y = d3.scaleLinear()
      .domain(d3.extent(this.values.map(d => d[1])))
      .range([height - padding, padding]);

    let color;
    if (!categoryKeys.length) {
      color = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(this.values.map(d => d[2])));
    } else {
      color = d3.scaleOrdinal()
        .domain(categoryKeys)
        .range(d3.schemeSet2);
    }

    this.foreignObject
      .attr('width', width)
      .attr('height', height)
      .style('position', 'relative')
      .style('z-index', -1)
      .style('padding-left', margin.left)
      .style('padding-top', margin.top);

    this.foreignBody
      .style('position', 'relative')
      .style('z-index', -1)
      .style('width', `${width}px`)
      .style('height', `${height}px`);

    this.canvas
      .attr('width', width)
      .attr('height', height);

    this.hiddenCanvas.width = width;
    this.hiddenCanvas.height = height;

    d3.select(this.container).select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxisBottom = d3.axisBottom(x);
    const xAxisTop = d3.axisBottom(x)
      .tickSizeInner(height)
      .tickFormat('');
    const yAxisLeft = d3.axisLeft(y);
    const yAxisRight = d3.axisLeft(y)
      .tickSizeInner(width)
      .tickFormat('');

    this.axisBottom
      .attr('transform', `translate(0, ${height})`)
      .call(xAxisBottom)
      .selectAll('text')
      .call(textUtils.axisShrinkFitText, width / (x.ticks().length));

    this.axisTop
      .call(xAxisTop);

    this.axisLeft
      .call(yAxisLeft)
      .selectAll('text')
      .call(textUtils.axisShrinkFitText, margin.left - yLabelSize);

    this.axisRight
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxisRight);

    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', () => {
        if (!d3.event.sourceEvent || !d3.event.selection) return;
        const [[x0, y0], [x1, y1]] = d3.event.selection;
        this.callback([[x.invert(x0), y.invert(y0)], [x.invert(x1), y.invert(y1)]]);
      });

    this.brush
      .call(brush);

    this.svg
      .on('mousemove', (d, i, nodes) => {
        const [xPos, yPos] = d3.mouse(nodes[i]);
        const ctx = this.hiddenCanvas.getContext('2d');
        const [r, g, b] = ctx.getImageData(xPos, yPos, 1, 1).data;
        const tooltip = this.colorToTooltipMap[`${r}:${g}:${b}`];
        if (typeof tooltip === 'undefined') {
          this.tooltip.style('visibility', 'hidden');
        } else {
          this.tooltip
            .style('left', `${xPos + margin.left + tooltipOffset}px`)
            .style('top', `${yPos + margin.top + tooltipOffset}px`)
            .style('visibility', 'visible')
            .html(tooltip);
        }
      })
      .on('mouseleave', () => {
        this.tooltip.style('visibility', 'hidden');
      });

    this.titleHeader
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .style('font-size', `${margin.top / 2 > MAX_FONT_SIZE ? MAX_FONT_SIZE : margin.top / 2}px`)
      .text(this.title);

    this.xLabel
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .style('font-size', xLabelSize)
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - xLabelSize / 2})`)
      .text(this.xAxisLabel);


    this.yLabel
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .style('font-size', yLabelSize)
      .attr('transform', `translate(${-margin.left + yLabelSize / 2}, ${height / 2})rotate(-90)`)
      .text(this.yAxisLabel);

    const point = this.memory.selectAll('circle')
      .data(this.values);

    point.enter()
      .append('circle')
      .attr('dx', width / 2)
      .attr('dy', height / 2)
      .merge(point)
      .transition()
      .duration(ANIMATION_DURATION)
      .delay((_, i) => i * (ANIMATION_DURATION / this.values.length))
      .attr('dx', d => x(d[0]))
      .attr('dy', d => y(d[1]))
      .style('opacity', d => ((typeof _selectedCategory !== 'undefined' && d[2] !== _selectedCategory) ? 0.2 : 1))
      .attr('r', Math.ceil(width / 150))
      .attr('fillStyle', d => color(d[2]))
      .attr('title', d => `
${d[0]}</br>
${d[1]}</br>
${!categoryKeys ? d[2] : this.categories[d[2]]}</br>
`);

    point.exit()
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('r', 0)
      .remove();

    const legendRectHeight = height / 30;
    const legendRectWidth = width / 30;
    const legendPadding = legendRectHeight / 2;
    const legendXPos = width * 0.7;
    const legendYPos = legendRectHeight;
    const legendTextMaxWidth = width - legendXPos - legendRectWidth;

    this.legend
      .attr('transform', `translate(${legendXPos}, ${legendYPos})`)
      .select('rect')
      .attr('width', legendRectWidth + legendTextMaxWidth)
      .attr('height', (categoryKeys.length + 1) * legendRectHeight + legendPadding);

    const legendElement = this.legend.selectAll('.ac-scatter-legend-element')
      .data(categoryKeys, d => `${d}:${this.categories[d]}`);

    const legendEnter = legendElement.enter()
      .append('g')
      .attr('class', 'ac-scatter-legend-element');

    legendEnter
      .merge(legendElement)
      .on('click', (d) => {
        if (d === _selectedCategory) {
          this.render({ _skipAnimation: false });
        } else {
          this.render({ _selectedCategory: d, _skipAnimation: false });
        }
      })
      .style('opacity', d => ((typeof _selectedCategory === 'undefined' || d === _selectedCategory) ? 1 : 0.3));

    legendEnter.append('rect')
      .attr('y', (_, i) => (legendRectHeight + legendPadding) * i)
      .attr('height', legendRectHeight)
      .attr('width', legendRectWidth)
      .attr('fill', d => color(d));

    legendEnter.append('text')
      .attr('x', legendRectWidth * 1.1)
      .attr('y', (_, i) => ((legendRectHeight + legendPadding) * i + legendRectHeight / 2))
      .style('dominant-baseline', 'central')
      .text(d => this.categories[d])
      .call(textUtils.wrapFitText, legendTextMaxWidth);

    legendElement.exit()
      .remove();

    const nodes = this.memory.selectAll('circle')
      .nodes();

    const ctx = this.canvas.node().getContext('2d');
    const t = d3.timer((elapsed) => {
      setTimeout(() => {
        ctx.clearRect(0, 0, width, height);
        nodes.forEach((node) => {
          ctx.beginPath();
          ctx.arc(
            node.getAttribute('dx'),
            node.getAttribute('dy'),
            node.getAttribute('r'),
            0,
            2 * Math.PI,
            false,
          );
          ctx.globalAlpha = node.style.opacity;
          ctx.fillStyle = node.getAttribute('fillStyle');
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        });
      }, 0);
      if (elapsed > ANIMATION_DURATION * 2 || _skipAnimation) {
        t.stop();
        // draw tooltips once after animation is over
        this.colorToTooltipMap = {};
        const hiddenCtx = this.hiddenCanvas.getContext('2d');
        hiddenCtx.clearRect(0, 0, width, height);
        nodes.forEach((node, i) => {
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
    }, 0);
  }
}
