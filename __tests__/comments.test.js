const Preprocessor = require('../index.js');

describe('.commentEscape', () => {
  const code = `/*#
This is a comment
#*/`;

  it('strips comments with commentEscape on', () => {
    const res = new Preprocessor({ commentEscape: true }).compile(code);
    expect(res.length).toEqual(0);
  });

  it('preserves comments with commentEscape off', () => {
    const res = new Preprocessor({ commentEscape: false }).compile(code);
    expect(res.trim()).toEqual(code.trim());
  });
});
