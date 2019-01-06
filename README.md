A GLSL preprocessor based on the [C-Preprocessor](https://github.com/ParksProjets/C-Preprocessor) library.

# Usage

```js
import Preprocessor from '@andrewray/glsl-preprocessor';

const result = new Preprocessor(options).preprocess(src);
```

# Options

This are the defaults options. You can modify them by passing an option object.

```js
var options = {
  // Predefined constants (ex: { "MY_CONST": "42" })
  constants: {},

  // Predefined macros (ex: { "MACRO": "(a,b) a+b" })
  macros: {},

  // End of line character
  newLine: '\n',

  // Escape '//#' & '/*#' comments (see extra/comments)
  commentEscape: true,

  // Empty lines to add between code and included files
  includeSpaces: 0,

  // Limit of empty following lines (0 = no limit)
  emptyLinesLimit: 0,

  // Base path for including files
  basePath: './'
};
```

# Features

##### Define

```glsl
// Define a constant
#define MY_CONST 42

// Define a macro
#define SUM(a,b) a + b
```

Create a constant or a macro.

##### Undefine

```glsl
#undef MY_CONST
```

Delete a constant or a macro.

##### Condition

```glsl
#if A + B == 5 && defined(MY_CONST)
  // Do stuff
#elif "MY_CONST2" == "House"
  // Do other stuff
#else
  // Do other stuff
#endif

#ifndef MY_CONST3
  // Do stuff
#endif
```

C like conditions.  
`#if` condition is evaluated in JS so you must add **"** between string
constants.  
Note: `#ifdef C` and `#ifndef C` are faster than `#if defined(C)` and `#if !defined(C)`.

##### Error

```glsl
#error This is an error
```

Stop the compiler and raise the error.

### Extra

##### Compiler constants

```glsl
__LINE__ // Current line (where this constant is used).
__FILE__ // Current file (where this constant is used).
```

This constants are predefined by the compiler.

##### Comments

```glsl
//# One line comment

/*#

Multi-lines comment

#*/
```

This comments will be deleted in the compiled file.  
Note: `options.commentEscape` must be `true`.
