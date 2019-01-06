/*

C Preprocessor


© 2017 - Guillaume Gonnet
License GPLv2

Sources at https://github.com/ParksProjets/C-Preprocessor

*/

const tokenize = require('glsl-tokenizer/string');

// Return the last character of the string
const lastChar = str => str.charAt(str.length - 1);

// Remove and add some text in the same time
const spliceStr = (str, idx, rem, s) =>
  str.slice(0, idx) + s + str.slice(idx + rem);

// Get the next "..." string
const getNextString = str => {
  const res = str.match(/^"([A-Za-z0-9\-_\. \/\\]+)"/);
  return !res || !res[1] ? '' : res[1];
};

const identChar = /[A-Za-z0-9_]/;
const isIdentChar = c => identChar.test(c);

const Preprocessor = function(opt) {
  // Options object
  this.options = {};
  this.options.newLine = '\n';
  this.options.commentEscape = true;
  this.options.includeSpaces = 0;
  this.options.emptyLinesLimit = 0;

  // Apply options
  opt = opt || {};
  for (let i in opt) this.options[i] = opt[i];

  // List of defined macros/constants
  this.defines = {};

  // Stack for macros/constants
  this.stack = {};

  // Global constants
  const date = new Date();
  this._compConst('LINE', '0');
  this._compConst('FILE', 'main');

  // User defined constants
  const c = opt.constants || {};
  for (let i in c) this.createConstant(i, c[i].toString(), false);

  // User defined macros
  const m = opt.macros || {};
  for (let i in m) this.createMacro(i, m[i]);
};

// Compile a text code
Preprocessor.prototype.preprocess = function(code) {
  return new Processor(this, code).run();
};

const Processor = function(parent, code) {
  // Parent Preprocessor
  this.parent = parent;
  this.options = parent.options;

  // List of defined macros/constants & stack
  this.defines = parent.defines;
  this.stack = parent.stack;

  // Code & result text
  this.code = code;
  this.result = '';

  // Number of empty lines
  this.emptyLines = 0;

  // Current line & file
  this.currentLine = 0;

  // Bind some functions
  this.parseNext = this.parseNext.bind(this);
  this.next = this.next.bind(this);
};

// Constructor
Processor.prototype.constructor = Processor;

// Run the processor
Processor.prototype.run = function() {
  const _this = this;

  // Get an array of all lines
  const lines = this.code.split(/\r?\n/);
  this.linesCount = lines.length;

  // Return the next line
  function nextLine() {
    _this._compConst('LINE', _this.currentLine + 1);
    return lines[_this.currentLine++];
  }

  this.nextLine = nextLine;

  // Parse the first line
  return this.next();
};

// Parse the next lines (doing it synchronously until an asynchronous command)
Processor.prototype.next = function() {
  while (this.currentLine < this.linesCount) this.parseNext();

  return this.result;
};

// Append a line to the result
Processor.prototype.addLine = function(line) {
  this.result += line + this.options.newLine;
  this.emptyLines = 0;
};

Processor.prototype.error = function(msg) {
  msg = `(line ${this.currentLine}) ${msg}`;
  throw msg;
};

Processor.prototype.parseNext = function() {
  // No more line to parse: stop this function
  if (this.currentLine >= this.linesCount) return;

  // Get the next line text
  const line = this.nextLine();
  let text = line.trimLeft();

  // If the line is empty: apply empty lines limit option
  if (text.length == 0) {
    if (
      this.options.emptyLinesLimit &&
      this.emptyLines >= this.options.emptyLinesLimit
    )
      return;

    this.emptyLines++;
    return this.addLine(line);
  }

  // If the line starts with a # comment: delete it
  if (this.options.commentEscape && text.startsWith('//#')) return;

  if (this.options.commentEscape && text.startsWith('/*#'))
    return this.commentEnd();

  // If the line doesn't start with #
  if (text[0] != '#') return this.addLine(this.addDefines(line));

  // Get the # directive and the remaing text
  const i = text.indexOf(' ');
  let name;

  if (i != -1) {
    name = text.substr(1, i - 1);
    text = text.substr(i + 1);
  } else {
    name = text.substr(1);
  }

  // Get the # directive
  const cmd = Directives[name.trimLeft()];

  // If the command exists: call the corresponding function
  if (cmd) return cmd.call(this, text);

  // Else: remove the line if 'commentEscape' is enabled
  if (!this.options.commentEscape) this.addLine(this.addDefines(line));
};

// Add defined objects to a line
Processor.prototype.addDefines = Preprocessor.prototype.addDefines = function(
  line,
  withConst,
  withMacros
) {
  // Local variables
  let i1 = -1;
  let i2;
  let d, r;

  // Check if the constant is present in the line
  for (let i in this.defines) {
    d = this.defines[i];

    if (d.count && withMacros === false) continue;
    if (!d.count && withConst === false) continue;

    i2 = i.length;
    i1 = -1;

    // It can have the same constant more than one time
    for (;;) {
      // Get the position of the constant (-1 if not present)
      i1 = line.indexOf(i, i1 + 1);
      if (i1 == -1) break;

      // Check that the constant isn't in a middle of a word and add the constant if not
      if (isIdentChar(line.charAt(i1 - 1)) || isIdentChar(line.charAt(i1 + i2)))
        continue;

      // Add the macro or the constant
      if (d.count) r = this.addMacro(line, i1, d);
      else r = this.addConstant(line, i1, d);

      line = r.line;
      i1 = r.index;
      continue;
    }
  }

  return line;
};

// Create a constant
Processor.prototype.createConstant = Preprocessor.prototype.createConstant = function(
  name,
  value,
  addDefines
) {
  // Add constants value to the constant value
  if (addDefines !== false) value = this.addDefines(value);

  // Store the constant
  this.defines[name] = {
    name: name,
    value: value
  };
};

// Set a Preprocessor constant
Processor.prototype._compConst = Preprocessor.prototype._compConst = function(
  name,
  value
) {
  this.createConstant('__' + name + '__', value, false);
};

// Add a constant in a line
Processor.prototype.addConstant = Preprocessor.prototype.addConstant = function(
  line,
  i,
  constant
) {
  line = spliceStr(line, i, constant.name.length, constant.value);
  i += constant.value.length;

  return { line: line, index: i };
};
// Create a macro (text must have the macro arguments, like this: '(a,b) a+b')
Processor.prototype.createMacro = Preprocessor.prototype.createMacro = function(
  name,
  text
) {
  // First, get macro arguments
  const args = [];

  const end = text.indexOf(')');
  let i1 = 1;
  let i2 = 0;

  // If there is no closing parenthesis
  if (end == -1)
    return this.error(
      `no closing parenthesis in the #define of marcro ${name}`
    );

  // Get arguments
  while ((i2 = text.indexOf(',', i2 + 1)) != -1 && i2 < end) {
    args.push(text.substring(i1, i2).trim());
    i1 = i2 + 1;
  }

  args.push(text.substring(i1, end));

  // Remove arguments in the text
  text = text.substr(end + 1).trimLeft();

  // Execute defined macros
  text = this.addDefines(text, false, true);

  // Secondly, makes breaks and store variables positions
  const breaks = [];

  for (let i = 0, l = args.length, p; i < l; i++) {
    i1 = -1;
    p = args[i];
    i2 = p.length;

    for (;;) {
      i1 = text.indexOf(p, i1 + 1);
      if (i1 == -1) break;

      if (isIdentChar(text.charAt(i1 - 1)) || isIdentChar(text.charAt(i1 + i2)))
        continue;

      breaks.push([i1, i, i2]);
    }
  }

  // Sort variables in order of their positions in the macro text
  breaks.sort(function(a, b) {
    return a[0] - b[0];
  });

  // Thirdly, cut the text into parts without constiable and add defined constants
  let offset = 0;
  const content = [];
  const pos = [];
  i = 0;

  for (; i < breaks.length; i++) {
    content[i] = this.addDefines(text.slice(offset, breaks[i][0]), true, false);
    offset = breaks[i][0] + breaks[i][2];
    pos[i] = breaks[i][1];
  }

  content[i] = this.addDefines(text.slice(offset));

  // Fourthly, store the macro
  this.defines[name] = {
    content: content,
    count: args.length,
    pos: pos,
    name: name
  };
};

// Read a line and transform macro by adding their value
Processor.prototype.addMacro = Preprocessor.prototype.addMacro = function(
  line,
  i,
  macro
) {
  let m = 0;
  let e = i + macro.name.length;
  let s = e;
  let l = 0;
  let args = [];

  // Get arguments between parenthesis (by counting parenthesis)
  for (let v, l = line.length; e < l; e++) {
    v = line[e];

    if (v == '(') {
      m++;
      if (m == 1) s = e + 1;
    } else if (v == ',' && m == 1) {
      args.push(line.slice(s, e));
      s = e + 1;
    } else if (v == ')') {
      if (m == 1) break;
      m--;
    } else if (v != ' ' && m == 0) {
      return this.error(
        `there is no openning parenthesis for macro ${macro.name}`
      );
    }
  }

  // If the closing parenthesis is missing
  if (m != 1)
    return this.error(
      `the closing parenthesis is missing for macro ${macro.name}`
    );

  // Add the last argument
  args.push(line.slice(s, e));

  // Check if there is the right number of arguments
  if (args.length > macro.count)
    return this.error(`too many arguments for macro ${macro.name}`);

  if (args.length < macro.count)
    return this.error(`too few arguments for macro ${macro.name}`);

  // Execute 'addDefines' on each argument
  for (let j = 0; j < macro.count; j++) args[j] = this.addDefines(args[j]);

  // Replace macro variables with the given arguments
  let str = macro.content[0];

  for (s = 0, l = macro.pos.length; s < l; s++)
    str += args[macro.pos[s]] + macro.content[s + 1];

  // Add the result into the line
  line = spliceStr(line, i, e - i + 1, str);
  i += str.length;

  return { line: line, index: i };
};

// Go to the next #elif, #else or #endif
Processor.prototype.conditionNext = function(end) {
  // #if directives to start a condition
  const ifCmd = ['if', 'ifdef', 'ifndef'];

  // #else directives
  const elseCmd = ['elif', 'else'];

  // Local variables
  let line;
  let s;
  let n = 1;

  // Count unexploited conditions
  while (this.currentLine < this.linesCount) {
    line = this.nextLine().trimLeft();
    if (line[0] != '#') continue;

    s = line
      .substr(1)
      .trimLeft()
      .split(' ')[0];

    if (ifCmd.indexOf(s) != -1) n++;
    else if (!end && n == 1 && elseCmd.indexOf(s) != -1)
      return this.callCondition(line);
    else if (s == 'endif') {
      n--;
      if (n == 0) return;
    }
  }
};

// Call a #else or #elif condition
Processor.prototype.callCondition = function(text) {
  // Get the directive name
  const split = text
      .substr(1)
      .trimLeft()
      .split(' '),
    name = split[0];

  // Get the remaining text (without the # directive)
  split.shift();
  text = split.join(' ').trimLeft();

  // Call the corresponding directive
  Directives[name].call(this, text, true);
};

// Go to the end of the condtion (#endif)
Processor.prototype.conditionEnd = function() {
  this.conditionNext(true);
};
// Go to the end of a multilines comment
Processor.prototype.commentEnd = function() {
  this.currentLine--;
  let line;

  // Find the end of the comment
  while (this.currentLine < this.linesCount) {
    line = this.nextLine();

    if (line.indexOf('*/') != -1) break;
  }
};
// List of all directives
const Directives = {};

// Create a directive
function createDirective(name, fn) {
  Directives[name] = fn;
}

// #define directive
createDirective('define', function(text) {
  // Get the constant/macro name
  let i = 0;
  while (isIdentChar(text.charAt(i))) i++;

  let name = text.substr(0, i);
  let isMacro = text[i] == '(';

  text = text.substr(name.length).trimLeft();

  // Read a multilines constants/macro if there is an '\' at the end of the line
  let str = text.trimRight();
  text = '';

  while (lastChar(str) == '\\') {
    text += str.substr(0, str.length - 1) + this.options.newLine;
    str = this.nextLine().trimRight();
  }

  text += str;

  // Strip comments from the definition
  let posBegin;
  let posEnd;

  while ((posBegin = text.indexOf('/*')) != -1) {
    posEnd = text.indexOf('*/', 1 + posBegin);
    if (posEnd == -1) posEnd = text.length;

    text = text.substring(0, posBegin) + ' ' + text.substring(2 + posEnd);
  }

  if ((posBegin = text.indexOf('//')) != -1)
    text = text.substring(0, posBegin) + ' ';

  text.trimRight();

  // If there is an '(' after the name: define a macro
  if (isMacro) this.createMacro(name, text);
  // Else: create a constant
  else this.createConstant(name, text);
});

// #undef directive
createDirective('undef', function(text) {
  // Get the constant/macro name
  let i = 0;
  while (isIdentChar(text.charAt(i))) i++;

  let name = text.substr(0, i);

  // Delete the constant/macro
  delete this.defines[name];
});

// One time when I was a kid, I was playing with my friend, and my friend threw
// a rock at my head, and my head started to bleed
const allowedTokens = [
  '(',
  ')',
  '+',
  '-',
  '~',
  '!',
  '*',
  '/',
  '%',
  '+',
  '-',
  '<<',
  '>>',
  '<',
  '>',
  '<=',
  '>=',
  '==',
  '!=',
  '&',
  '^',
  '|',
  '&&',
  '||',
  'true',
  'false',
  '(eof)'
];

// #if directive
// See README to know how to use this directive
createDirective('if', function(expr) {
  // Exectute 'defined' function
  let r;
  let i, i2, name;
  let _this = this;

  let filledExpr = expr.replace(/defined\s*\(\s*([\s\S]+?)\s*\)/g, function(
    match,
    p1
  ) {
    return _this.defines[p1] === undefined ? 'false' : 'true';
  });

  // Replace constants by their values
  filledExpr = this.addDefines(filledExpr);

  // Horrific way to test if this expression isn't safe to eval, based on GLSL
  // spec https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.1.20.pdf#page=12
  const isParsable = tokenize(filledExpr)
    .filter(t => t.type !== 'whitespace')
    .map(t => t.data)
    .every(d => /^\d+$/.test(d) || allowedTokens.includes(d));

  if (!isParsable) {
    this.error(`error parsing #if, ${filledExpr} is not a constant expression`);
    return;
  }

  // Evaluate the expression
  try {
    r = eval(filledExpr);
  } catch (e) {
    this.error('error when evaluating #if expression');
  }

  // If the expr is 'false', go to the next #elif, #else or #endif
  if (!r) this.conditionNext();
});

// #ifdef directive (note: '#ifdef constIABLE' is faster than '#if defined(constIABLE)')
createDirective('ifdef', function(text) {
  // Get the constant/macro name
  const name = text.split(' ')[0];

  // Check if the constant/macro exists
  if (this.defines[name] === undefined) this.conditionNext();
});

// #ifndef directive (note: '#ifndef constIABLE' is faster than '#if !defined(constIABLE)')
createDirective('ifndef', function(text) {
  // Get the constant/macro name
  const name = text.split(' ')[0];

  // Check if the constant/macro doesn't exist
  if (this.defines[name] !== undefined) this.conditionNext();
});

// #elif directive
createDirective('elif', function(expr, called) {
  // If this directive wasn't callaed by 'this.callCondition'
  if (!called) return this.conditionEnd();

  // Else: execute this directive as an #if directive
  Directives.if.call(this, expr);
});

// #else directive
createDirective('else', function(expr, called) {
  // If this directive wasn't called by 'this.callCondition'
  if (!called) return this.conditionEnd();

  // Else: nothing to compute, parse the next line
});

// #endif directive
createDirective('endif', function(expr, called) {
  // Do nothing beacause this directive is already evaluated by 'this.conditionNext'
});

// #error directive
createDirective('error', function(text) {
  throw text.trim();
});

module.exports = Preprocessor;
