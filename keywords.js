// You can make changes below...

const IF        = "if";
const THEN      = "then";
const ELSE      = "else";
const WHILE     = "while";
const FUNCTION  = "function";
const END       = "end";
const VARIABLES = "variables";
const NUMBER    = "number";
const NUMBERS   = "numbers";
const STRING    = "string";
const STRINGS   = "strings";
const BOOL      = "bool";
const BOOLS     = "bools";
const ARRAY     = "array";
const ARRAYS    = "arrays";
const OF        = "of"; // omitted if set to null
const AND       = "and";
const OR        = "or";
const NOT       = "not";
const TRUE      = "true";
const FALSE     = "false";

// ...until that point. Do not make changes after that line!

const double_keywords_begin  = [ELSE, END];
const double_keywords_ending = [IF, FUNCTION, WHILE];
const structural_keywords    = [IF, THEN, ELSE, WHILE, FUNCTION, END];
const variable_definition    = [VARIABLES, OF];
const variable_types         = [NUMBER, STRING, BOOL, ARRAY];
const variable_types_plural  = [NUMBERS, STRINGS, BOOLS, ARRAYS];
const operator_keywords      = [AND, OR, NOT];
const bool_literals          = [TRUE, FALSE];

const keywords = [].concat(structural_keywords,
                            variable_definition,
                            variable_types,
                            variable_types_plural,
                            operator_keywords,
                            bool_literals);

module.exports = {

  IF          : IF,
  THEN        : THEN,
  ELSE        : ELSE,
  ELSEIF      : ELSE + " " + IF,
  ENDIF       : END + " " + IF,
  WHILE       : WHILE,
  ENDWHILE    : END + " " + WHILE,
  FUNCTION    : FUNCTION,
  ENDFUNCTION : END + " " + FUNCTION,
  END         : END,
  VARIABLES   : VARIABLES,
  NUMBER      : NUMBER,
  NUMBERS     : NUMBERS,
  STRING      : STRING,
  STRINGS     : STRINGS,
  BOOL        : BOOL,
  BOOLS       : BOOLS,
  ARRAY       : ARRAY,
  ARRAYS      : ARRAYS,
  OF          : OF,
  AND         : AND,
  OR          : OR,
  NOT         : NOT,
  TRUE        : TRUE,
  FALSE       : FALSE,

  double_keywords_begin  : double_keywords_begin,
  double_keywords_ending : double_keywords_ending,
  structural_keywords    : structural_keywords,
  variable_definition    : variable_definition,
  variable_types         : variable_types,
  variable_types_plural  : variable_types_plural,
  operator_keywords      : operator_keywords,
  bool_literals          : bool_literals,

  keywords  : keywords,

}
