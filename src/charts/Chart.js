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
        if (sheet.cssRules[key] instanceof CSSStyleRule) {
          rules.push(sheet.cssRules[key].cssText);
        }
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

  async toPNG() {
    this.captureSetup();
    const svgElement = this.container.querySelector('svg');
    svgElement.setAttribute('version', '1.1');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const cssRules = this.collectCSSRules();
    const defs = `<defs><style type="text/css"><![CDATA[${cssRules.join('')}]]></style></defs>`;
    svgElement.innerHTML += defs;

    html2canvas(this.container).then((canvas) => {
      const img = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = img;
      a.download = 'capture.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.captureTeardown();
    });
  }
}
