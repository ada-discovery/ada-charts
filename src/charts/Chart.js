import html2canvas from 'html2canvas';

export default class {
  constructor({ container }) {
    this.container = container;
  }

  get name() {
    throw Error('name getter not implemented.');
  }

  render() {
    throw Error('update() not implemented.');
  }

  resize() {
    this.container.style['font-size'] = `${this.containerWidth / 50}pt`;
  }

  update(args) {
    this.resize();
    this.render(args);
  }

  captureSetup() {
  }

  captureTeardown() {
  }

  collectCSSRules() {
    const rules = [];
    for (let i = 0; i < document.styleSheets.length; i += 1) {
      const sheet = document.styleSheets[i];
      Object.keys(sheet.cssRules).forEach((key) => {
        rules.push(sheet.cssRules[key].cssText);
      });
    }
    return rules;
  }

  get containerWidth() {
    return this.container.getBoundingClientRect().width || '500px';
  }

  get containerHeight() {
    return this.container.getBoundingClientRect().height || this.containerWidth;
  }

  offerDownload(href, type) {
    const a = document.createElement('a');
    a.href = href;
    a.download = `capture.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  toPNG() {
    this.captureSetup();
    const element = this.prepareCaptureElement();
    html2canvas(element.parentNode).then((canvas) => {
      const img = canvas.toDataURL('image/png');
      this.offerDownload(img, 'png');
      this.captureTeardown();
    });
  }

  toSVG() {
    this.captureSetup();
    const element = this.prepareCaptureElement();
    const svgBlob = new Blob([element.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    this.offerDownload(svgUrl, 'svg');
    this.captureTeardown();
  }

  prepareCaptureElement() {
    const svgElement = this.container.querySelector('svg');
    svgElement.setAttribute('version', '1.1');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const cssRules = this.collectCSSRules();
    const defs = svgElement.querySelector('defs');
    if (defs != null) { defs.remove(); }
    const newDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = document.createElement('style');
    style.type = 'text/css';
    const cdata = document.createTextNode(cssRules.join(''));
    style.appendChild(cdata);
    newDefs.appendChild(style);
    svgElement.appendChild(newDefs);
    return svgElement;
  }
}
