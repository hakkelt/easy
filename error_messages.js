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
    msg: "Ambigous operator: '=' (use '←'/'<-' for assignment and '==' for equality check)"
  },
  cannot_handle_character: {
    title: "Syntax error",
    msg: "Can't handle character: CHAR"
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
    msg: "Variable 'VAR_NAME' is VAR_TYPE and 'EXPR' (= EXPR_VALUE) is EXPR_TYPE"
  },
  check_array_type: {
    title: "Type mismatch",
    msg: "Variable 'VAR_NAME' contains VAR_TYPEs and 'EXPR' (= EXPR_VALUE) contains EXPR_TYPEs"
  },
  check_redefinition: {
    title: "Variable error",
    msg: "Re-definition of variable: VARIABLE"
  },
  assignment_error: {
    title: "Assignment Error",
    msg: "Only variables can be assigned. 'EXPR' (= VALUE) is TYPE, so it cannot be assigned"
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
    msg: "Operator 'OP' expects TYPEs, but 'EXPR' (= EXPR_VALUE) is EXPR_TYPE"
  },
  check_zero_division: {
    title: "Math error",
    msg: "Zero division: EXPR_"
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
    msg: "Indexing is possible only with whole numbers, but INDEX (= VALUE) is given in expression EXPR"
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
    msg: "Index cannot be negative, but EXPR = VALUE"
  },
  chec_index_equal: {
    title: "Index out of range",
    msg: "Index (EXPR) is #, but the indexed array has only # elements (indexing starts from 0!)"
  },
  check_indexing_large: {
    title: "Index out of range",
    msg: "Index (EXPR) is VALUE, but the indexed array has only # elements"
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
