const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('#undef', () => {
  it('#undef', () => {
    const src = `
		#define A 42
		#undef A

		#ifdef A
			x = 1;
		#else
			x = 2;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 2;');
  });
});
