const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('macro evaluation', () => {
  describe('simple replacement', () => {
    const src = `
		#define NUM 74
		x = NUM;
		`;

    it('expands the macro', () => {
      const res = new Preprocessor().preprocess(src);
      expect(res.trim()).toEqual('x = 74;');
    });
  });

  describe('arguments', () => {
    const a = utils.randint(0, 100);
    const src = `
		#define MACRO1(a,b) a*5*b
		x = MACRO1(${a},7);
		`;

    it('expands the macro with arguments', () => {
      const res = new Preprocessor().preprocess(src);
      expect(res.trim()).toEqual(`x = ${a}*5*7;`);
    });
  });

  describe('nested macros', () => {
    const a = utils.randint(0, 100);
    const src = `
		#define MACRO1(a,b) a*5*b
		#define MACRO2(a,b2,c) MACRO1(a,b2)-c
		x = MACRO2(${a},1,2);
		`;

    it('expands the nested macro with arguments', () => {
      const res = new Preprocessor().preprocess(src);
      expect(res.trim()).toEqual(`x = ${a}*5*1-2;`);
    });
  });

  describe('multiple arguments', () => {
    const src = `
		#define MAT2(a,b,c,d) vec4(a, b, c, d) // A 2x2 matrix
		x = MAT2(1,1,1,0)
		`;

    it('expands the nested macro with arguments', () => {
      const res = new Preprocessor().preprocess(src);
      expect(res.trim()).toEqual(`x = vec4(1, 1, 1, 0)`);
    });
  });
});
