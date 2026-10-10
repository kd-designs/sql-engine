# ts-sql-engine

A pure TypeScript, zero-dependency in-memory SQL Lexer, recursive-descent Parser, and Relational Execution Engine.

## Features

- **Lexer**: Tokenizes SQL keywords, operators, literals, strings, and identifiers.
- **AST Parser**: Recursive descent parser for `CREATE TABLE`, `INSERT INTO`, and `SELECT` statements.
- **Query Planner & Execution**:
  - `WHERE` clause evaluation with equality and comparison operators.
  - `ORDER BY` sorting (ascending / descending).
  - `LIMIT` pagination.
  - Column projections and table catalog management.
