import * as d3 from 'd3';
import Chart from '../Chart';
import '../../assets/css/scatterplot.css';

export default class extends Chart {
  constructor({ container }) {
    super({ container });

    this.memory = d3.select(document.createElement('memory'));
    this.canvas = d3.select(container)
      .append('canvas')
      .attr('class', 'ac-canvas');
  }

  static get name() {
    return 'scatterplot';
  }

  prepareSVGForCapture() {
    return this.svg;
  }

  render({}) {

  }
}
