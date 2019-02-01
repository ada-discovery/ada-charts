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

  get containerWidth() {
    return this.container.getBoundingClientRect().width || '500px';
  }

  get containerHeight() {
    return this.container.getBoundingClientRect().height || this.containerWidth;
  }

  toPNG() {
    this.captureSetup();
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
