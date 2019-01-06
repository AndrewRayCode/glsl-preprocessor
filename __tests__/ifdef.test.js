const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('#ifdef', () => {
  it('#ifdef', () => {
    const src = `
		#define A 42

		#ifdef A
			x = 1;
		#else
			x = 2;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 1;');
  });

  it('#ifndef', () => {
    const src = `
		#ifndef B
			x = 1;
		#else
			x = 2;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 1;');
  });
});
