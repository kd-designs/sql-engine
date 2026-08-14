export enum TokenType {
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  OPERATOR = 'OPERATOR',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  STAR = 'STAR',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'CREATE', 'TABLE',
  'JOIN', 'INNER', 'LEFT', 'ON', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
  'LIMIT', 'AND', 'OR', 'NOT', 'AS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
]);

export class SQLLexer {
  private input: string;
  private pos = 0;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: ',', pos: this.pos++ });
        continue;
      }
      if (char === ';') {
        tokens.push({ type: TokenType.SEMICOLON, value: ';', pos: this.pos++ });
        continue;
      }
      if (char === '(') {
        tokens.push({ type: TokenType.LPAREN, value: '(', pos: this.pos++ });
        continue;
      }
      if (char === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')', pos: this.pos++ });
        continue;
      }
      if (char === '*') {
        tokens.push({ type: TokenType.STAR, value: '*', pos: this.pos++ });
        continue;
      }

      if (char === '=' || char === '<' || char === '>' || char === '!') {
        let op = char;
        this.pos++;
        if (this.pos < this.input.length && this.input[this.pos] === '=') {
          op += '=';
          this.pos++;
        }
        tokens.push({ type: TokenType.OPERATOR, value: op, pos: this.pos - op.length });
        continue;
      }

      if (char === "'" || char === '"') {
        const quote = char;
        const start = ++this.pos;
        while (this.pos < this.input.length && this.input[this.pos] !== quote) {
          this.pos++;
        }
        const val = this.input.substring(start, this.pos);
        this.pos++; // consume closing quote
        tokens.push({ type: TokenType.STRING, value: val, pos: start - 1 });
        continue;
      }

      if (/[0-9]/.test(char)) {
        const start = this.pos;
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
          this.pos++;
        }
        tokens.push({ type: TokenType.NUMBER, value: this.input.substring(start, this.pos), pos: start });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        const start = this.pos;
        while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
          this.pos++;
        }
        const word = this.input.substring(start, this.pos);
        const upper = word.toUpperCase();
        if (KEYWORDS.has(upper)) {
          tokens.push({ type: TokenType.KEYWORD, value: upper, pos: start });
        } else {
          tokens.push({ type: TokenType.IDENTIFIER, value: word, pos: start });
        }
        continue;
      }

      throw new Error(`Unexpected character: '${char}' at index ${this.pos}`);
    }

    tokens.push({ type: TokenType.EOF, value: '', pos: this.pos });
    return tokens;
  }
}
