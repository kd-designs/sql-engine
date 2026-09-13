import { SQLLexer, Token, TokenType } from './lexer';

export interface ColumnDefinition {
  name: string;
  type: string;
}

export interface CreateTableStatement {
  type: 'CREATE_TABLE';
  tableName: string;
  columns: ColumnDefinition[];
}

export interface InsertStatement {
  type: 'INSERT';
  tableName: string;
  values: any[];
}

export interface WhereClause {
  column: string;
  operator: string;
  value: any;
}

export interface SelectStatement {
  type: 'SELECT';
  columns: string[];
  fromTable: string;
  where?: WhereClause;
  limit?: number;
  orderBy?: { column: string; ascending: boolean };
}

export type SQLStatement = CreateTableStatement | InsertStatement | SelectStatement;

export class SQLParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  static parse(sql: string): SQLStatement {
    const lexer = new SQLLexer(sql);
    const tokens = lexer.tokenize();
    const parser = new SQLParser(tokens);
    return parser.parseStatement();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private consume(expectedType?: TokenType, expectedValue?: string): Token {
    const tok = this.peek();
    if (expectedType && tok.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType}, got ${tok.type} ('${tok.value}')`);
    }
    if (expectedValue && tok.value.toUpperCase() !== expectedValue.toUpperCase()) {
      throw new Error(`Expected '${expectedValue}', got '${tok.value}'`);
    }
    this.current++;
    return tok;
  }

  parseStatement(): SQLStatement {
    const tok = this.peek();
    if (tok.value === 'CREATE') {
      return this.parseCreateTable();
    } else if (tok.value === 'INSERT') {
      return this.parseInsert();
    } else if (tok.value === 'SELECT') {
      return this.parseSelect();
    }
    throw new Error(`Unsupported SQL command: '${tok.value}'`);
  }

  private parseCreateTable(): CreateTableStatement {
    this.consume(TokenType.KEYWORD, 'CREATE');
    this.consume(TokenType.KEYWORD, 'TABLE');
    const tableToken = this.consume(TokenType.IDENTIFIER);
    this.consume(TokenType.LPAREN);

    const columns: ColumnDefinition[] = [];
    while (this.peek().type !== TokenType.RPAREN && this.peek().type !== TokenType.EOF) {
      const colName = this.consume(TokenType.IDENTIFIER).value;
      const colType = this.consume().value;
      columns.push({ name: colName, type: colType });
      if (this.peek().type === TokenType.COMMA) {
        this.consume(TokenType.COMMA);
      }
    }
    this.consume(TokenType.RPAREN);
    return { type: 'CREATE_TABLE', tableName: tableToken.value, columns };
  }

  private parseInsert(): InsertStatement {
    this.consume(TokenType.KEYWORD, 'INSERT');
    this.consume(TokenType.KEYWORD, 'INTO');
    const tableToken = this.consume(TokenType.IDENTIFIER);
    this.consume(TokenType.KEYWORD, 'VALUES');
    this.consume(TokenType.LPAREN);

    const values: any[] = [];
    while (this.peek().type !== TokenType.RPAREN && this.peek().type !== TokenType.EOF) {
      const tok = this.consume();
      if (tok.type === TokenType.NUMBER) {
        values.push(Number(tok.value));
      } else if (tok.type === TokenType.STRING) {
        values.push(tok.value);
      } else {
        values.push(tok.value);
      }
      if (this.peek().type === TokenType.COMMA) {
        this.consume(TokenType.COMMA);
      }
    }
    this.consume(TokenType.RPAREN);
    return { type: 'INSERT', tableName: tableToken.value, values };
  }

  private parseSelect(): SelectStatement {
    this.consume(TokenType.KEYWORD, 'SELECT');
    const columns: string[] = [];

    if (this.peek().type === TokenType.STAR) {
      this.consume(TokenType.STAR);
      columns.push('*');
    } else {
      while (this.peek().type !== TokenType.KEYWORD || this.peek().value !== 'FROM') {
        const col = this.consume().value;
        columns.push(col);
        if (this.peek().type === TokenType.COMMA) {
          this.consume(TokenType.COMMA);
        }
      }
    }

    this.consume(TokenType.KEYWORD, 'FROM');
    const tableName = this.consume(TokenType.IDENTIFIER).value;

    let where: WhereClause | undefined;
    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'WHERE') {
      this.consume(TokenType.KEYWORD, 'WHERE');
      const col = this.consume(TokenType.IDENTIFIER).value;
      const op = this.consume(TokenType.OPERATOR).value;
      const valTok = this.consume();
      const val = valTok.type === TokenType.NUMBER ? Number(valTok.value) : valTok.value;
      where = { column: col, operator: op, value: val };
    }

    let orderBy: { column: string; ascending: boolean } | undefined;
    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'ORDER') {
      this.consume(TokenType.KEYWORD, 'ORDER');
      this.consume(TokenType.KEYWORD, 'BY');
      const col = this.consume(TokenType.IDENTIFIER).value;
      let asc = true;
      if (this.peek().value === 'DESC') {
        this.consume(TokenType.KEYWORD, 'DESC');
        asc = false;
      } else if (this.peek().value === 'ASC') {
        this.consume(TokenType.KEYWORD, 'ASC');
      }
      orderBy = { column: col, ascending: asc };
    }

    let limit: number | undefined;
    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'LIMIT') {
      this.consume(TokenType.KEYWORD, 'LIMIT');
      limit = Number(this.consume(TokenType.NUMBER).value);
    }

    return { type: 'SELECT', columns, fromTable: tableName, where, orderBy, limit };
  }
}
