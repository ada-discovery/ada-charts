import * as d3 from 'd3';

const D3_AXIS_TEXT_OFFSET = 9;

export default {
  sliceFitText(selection, maxWidth) {
    const node = d3.select(selection);
    let textLength = node.node().getComputedTextLength();
    let text = node.text();
    while (textLength > maxWidth && text.length > 0) {
      text = text.slice(0, -1);
      node.text(`${text}..`);
      textLength = node.node().getComputedTextLength();
    }
  },

  axisShrinkFitText(nodes, maxWidth) {
    nodes.each(function () {
      const text = d3.select(this);
      while (text.node().getComputedTextLength() > maxWidth - D3_AXIS_TEXT_OFFSET) {
        const fontSize = parseInt(text.style('font-size').split('px')[0], 10);
        text.style('font-size', `${(fontSize) - 1}px`);
      }
    });
  },

  wrapFitText(nodes, maxWidth) {
    nodes.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/);
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      let tspan = text.text(null)
        .append('tspan')
        .attr('x', text.attr('x'))
        .attr('y', text.attr('y'));
      words.forEach((word, i) => {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > maxWidth) {
          if (i > 0) {
            line.pop();
            tspan.text(lineNumber === 1 ? `${line.join(' ')}...` : line.join(' '));
            if (lineNumber < 1) {
              lineNumber += 1;
              line = [word];
              tspan = text.append('tspan')
                .attr('x', text.attr('x'))
                .attr('y', text.attr('y'))
                .attr('dy', `${lineNumber * lineHeight}em`)
                .text(word);
            }
          }
        }
      });
    });
  },

};
