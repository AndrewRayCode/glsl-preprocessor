const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('.constants', () => {
  it('uses user defined constant', () => {
    const src = `
		x = VARIABLE;
		`;

    const res = new Preprocessor({
      constants: {
        VARIABLE: '3'
      }
    }).preprocess(src);
    expect(res.trim()).toEqual('x = 3;');
  });
});
