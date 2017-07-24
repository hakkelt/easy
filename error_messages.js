module.exports = {
  after_else: {
    title: "Syntax error",
    msg: "After the keyword 'else', only the keyword 'if' or linebreak is accepted, but got 'NEXT' instead"
  },
  after_end: {
    title: "Syntax error",
    msg: "Keyword 'end' must be followed by either one of the following: 'if', 'while', 'function', but got 'NEXT' instead"
  },
  check_traditional_equal_sign: {
    title: "Syntax error",
    msg: "Ambigous operator: '=' (use '←' or '<-' for assignment and '==' for equality check)"
  },
  single_quote: {
    title: "Syntax error",
    msg: "Can't handle character: ' (Use double quote ( \" ) instead to define strings)"
  },
  cannot_handle_character: {
    title: "Syntax error",
    msg: "Can't handle character: CHAR"
  },
  not_known_escape_character: {
    title: "Syntax error",
    msg: "Not known escape character: 'CHAR' (if you want to write character '\\', write '\\\\' instead)"
  },
  forbidden_new_line: {
    title: "Syntax error",
    msg: "Unescaped line breaks are not allowed within string literals (Use '\\n' escape character instead, or just '\\' if you want just wrap long line!)"
  },
  get_confused: {
    title: "Syntax error",
    msg: "Sorry, I don't understand what you mean here"
  },
  expecting_punctiation: {
    title: "Syntax error",
    msg: "Expecting punctuation: CHAR"
  },
  expecting_keyword: {
    title: "Syntax error",
    msg: "Expecting keyword: KEYWORD"
  },
  expecting_operator: {
    title: "Syntax error",
    msg: "Expecting operator: OP"
  },
  not_known_word: {
    title: "Syntax error",
    msg: "I don't understand the following word: TOKEN (maybe a typo or variable used before definition?)"
  },
  variable_definition_missing_comma: {
    title: "Syntax error",
    msg: "Didn't you wanted to write a comma here?"
  },
  unexpected_token: {
    title: "Syntax error",
    msg: "Unexpected token: TOKEN"
  },
  check_var_type_name: {
    title: "Syntax error",
    msg: "Expecting variable type name, but got 'TOKEN'"
  },
  check_var_name: {
    title: "Syntax error",
    msg: "Expecting variable name, but got 'TOKEN'"
  },
  check_prog_length: {
    title: "Code design error",
    msg: "The 'BLOCK' block should contain at least one statement, but empty block is encountered"
  },
  check_function_name_kw: {
    title: "Syntax error",
    msg: "'KW' cannot be used as a function name because it is a keyword"
  },
  check_function_name: {
    title: "Syntax error",
    msg: "'KW' is not a legal name for a function"
  },
  new_array_check_dimension: {
    title: "Inconsistent array definition",
    msg: "EXPR IS/CONTAINS_1 CURRENT_TYPE, but previous elements IS/CONTAINS_2 PREVIOUS_TYPE"
  },
  check_if_defined: {
    title: "Variable error",
    msg: "Undefined variable: VARIABLE"
  },
  check_if_initialized: {
    title: "Variable error",
    msg: "Variable not initialized: VARIABLE"
  },
  check_dimension: {
    title: "Dimension mismatch",
    msg: "Variable 'VAR_NAME' is VAR_TYPE and EXPR is EXPR_TYPE"
  },
  check_array_type: {
    title: "Type mismatch",
    msg: "Variable 'VAR_NAME' contains VAR_TYPEs and 'EXPR' contains EXPR_TYPEs"
  },
  check_redefinition: {
    title: "Variable error",
    msg: "Re-definition of variable: VARIABLE"
  },
  assignment_error: {
    title: "Assignment Error",
    msg: "Only variables can be assigned. EXPR is TYPE, so it cannot be assigned"
  },
  do_not_know_how_to_evaluate: {
    title: "'Should not occur' type of error",
    msg: "I don't know how to evaluate 'EXPR'"
  },
  new_array_typeCheck: {
    title: "Type Mismatch",
    msg: "'NEW_VALUE' is type of NEW_TYPE, but previous values was type of OLD_TYPE"
  },
  type_check: {
    title: "Type mismatch",
    msg: "Operator 'OP' expects TYPEs, but EXPR is EXPR_TYPE"
  },
  check_zero_division: {
    title: "Math error",
    msg: "Zero division: EXPR_"
  },
  plus_operator_type_check: {
    title: "Type mismatch",
    msg: "Operator '+' can be used to add two numbers or concatenate two strings, but A_EXPR is type of A_TYPE and B_EXPR is type of B_TYPE"
  },
  operator_dimension_check: {
    title: "Dimension mismatch",
    msg: "Operator 'OP' cannot be applied on arrays, and 'EXPR' is TYPE"
  },
  operator_same_type: {
    title: "Type mismatch",
    msg: "'EXPR1' (TYPE1) and 'EXPR2' (TYPE2) have different types, thus they cannot be compared"
  },
  operator_reverse_order: {
    title: "Syntax error",
    msg: "Wrong operator: OP (use it in reverse order: REV_OP)"
  },
  operator_unary_only: {
    title: "Syntax error",
    msg: "Operator 'OP' cannot be applied between two expression, so the following expression is not understood: EXPR"
  },
  operator_binary_only: {
    title: "Syntax error",
    msg: "Operator 'OP' can be applied only between two expression, so the following expression is not understood: EXPR"
  },
  operator_cannot_apply: {
    title: "Syntax error",
    msg: "Cannot apply operator 'OP'"
  },
  argument_number_check: {
    title: "Function call error",
    msg: "Calling function with improper number of arguments (it expects EXP_ARGS arguments, but GIVEN_ARGS is given)"
  },
  assignment_check_type: {
    title: "Type mismatch",
    msg: "variable 'VAR_NAME' IS/CONTAINS VAR_TYPE, but EXPR_TYPE (EXPR) IS/ARE assigned to it"
  },
  assignment_check_dimension: {
    title: "Dimenion mismatch",
    msg: "Varisable 'VAR_NAME' is VAR_TYPE, but EXPR_TYPE (EXPR) is assigned to it"
  },
  argument_check_type: {
    title: "Type mismatch",
    msg: "Argument 'ARG_NAME' IS/CONTAINS ARG_TYPE, but EXPR_TYPE (EXPR) IS/ARE assigned to it"
  },
  argument_check_dimension: {
    title: "Dimenion mismatch",
    msg: "Argument 'ARG_NAME' is ARG_TYPE, but EXPR_TYPE (EXPR) is assigned to it"
  },
  index_is_not_whole_number: {
    title: "Indexing error",
    msg: "Indexing is possible only with whole numbers, but INDEX is given in expression EXPR"
  },
  check_indexing_array: {
    title: "Dimenion mismatch",
    msg: "Only arrays can be indexed, and 'EXPR' is not an array"
  },
  check_indexing_type: {
    title: "Type mismatch",
    msg: "Indexing is possible only with numbers, but 'EXPR' is TYPE"
  },
  check_indexing_dimension: {
    title: "Dimenion mismatch",
    msg: "Indexing is possible only with scalar, but 'EXPR' is TYPE"
  },
  check_indexing_negative: {
    title: "Index out of range",
    msg: "Index cannot be negative, but INDEX is given as index in expression 'EXPR'"
  },
  check_indexing_equal: {
    title: "Index out of range",
    msg: "Index is EXPR, but the indexed array has only # elements (indexing starts from 0)"
  },
  check_indexing_larger: {
    title: "Index out of range",
    msg: "Index is EXPR, but the indexed array has only # elements"
  },
  array_assign_check_type: {
    title: "Type mismatch",
    msg: "Left side of the assignment (LEFT_EXPR) is LEFT_TYPE and the right side (RIGHT_EXPR) is RIGHT_TYPE"
  },
  array_assign_check_dimension: {
    title: "Dimenion mismatch",
    msg: "Left side of the assignment (LEFT_EXPR) is LEFT_TYPE and the right side (RIGHT_EXPR) is RIGHT_TYPE"
  },
  do_not_know_how_to_evaluate: {
    title: "Should never happen",
    msg: "Do not know how to evaluate: EXPR"
  },
  do_not_know_how_to_stringify: {
    title: "Should never happen",
    msg: "Do not know how to stringify: EXPR"
  }
}
