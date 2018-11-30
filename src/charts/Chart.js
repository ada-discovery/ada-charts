export default class {
  constructor({ container }) {
    this.container = container;
  }

  static get name() {
    throw Error('name getter not implemented.');
  }

  update() {
    throw Error('update() not implemented.');
  }
}
