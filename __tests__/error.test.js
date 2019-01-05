const utils = require('./utils.js');
const Preprocessor = require('../index.js');

describe('error', () => {
  it('throws an an error if #error macro encountered', () => {
    const text = 'bad shader';
    const src = `
		#error ${text}
		`;

    const res = new Preprocessor();
    try {
      res.compile(src);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toEqual(text);
    }
  });
});
