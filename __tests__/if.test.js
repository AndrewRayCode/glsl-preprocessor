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

  it('parses all the things without error', () => {
    const src = `
		#if !1 && 2^4 + 60 << 3 + ~1 / 7 * 4%3 +(7 + 3)
		#endif
		`;
    new Preprocessor().preprocess(src);
  });

  it('does not execute console.log in eval() of expression', () => {
    const src = `
		#if console.log('pwned')
			float x = 1;
		#endif
		`;
    const spy = jest.spyOn(global.console, 'log');
    try {
      new Preprocessor().preprocess(src);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toContain('is not a constant expression');
      expect(spy).not.toHaveBeenCalled();
    }
  });
});
