const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('#if', () => {
  it('compound expressions', () => {
    const src = `
		#define A
		
		#if defined(A) && !defined(B)
			x = 1;
		#else
			x = 3;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 1;');
  });

  it('else', () => {
    const src = `
		#if defined(A)
			x = 1;
		#else
			x = 2;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 2;');
  });

  it('elif expression', () => {
    const src = `
		#define A 1
		
		#if defined(B)
			x = 1;
		#elif A == 1
			x = 2;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 2;');
  });

  it('nested ifs', () => {
    const src = `
		#define A
		#define B
		
		#if defined(A)
			#if defined(B)
				x = 1;
			#end
		#else
			x = 3;
		#endif
		`;

    const res = new Preprocessor().preprocess(src);
    expect(res.trim()).toEqual('x = 1;');
  });
});
