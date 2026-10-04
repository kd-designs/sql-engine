import { ColumnDefinition, CreateTableStatement, InsertStatement, SelectStatement, SQLParser } from './parser';

export interface Table {
  columns: ColumnDefinition[];
  rows: Record<string, any>[];
  indexes: Map<string, Map<any, Record<string, any>[]>>;
}

export class SQLEngine {
  private tables: Map<string, Table> = new Map();

  execute(sql: string): any {
    const stmt = SQLParser.parse(sql);
    switch (stmt.type) {
      case 'CREATE_TABLE':
        return this.createTable(stmt);
      case 'INSERT':
        return this.insert(stmt);
      case 'SELECT':
        return this.select(stmt);
    }
  }

  private createTable(stmt: CreateTableStatement): string {
    if (this.tables.has(stmt.tableName)) {
      throw new Error(`Table ${stmt.tableName} already exists`);
    }
    this.tables.set(stmt.tableName, {
      columns: stmt.columns,
      rows: [],
      indexes: new Map(),
    });
    return `Table ${stmt.tableName} created with ${stmt.columns.length} columns.`;
  }

  private insert(stmt: InsertStatement): string {
    const table = this.tables.get(stmt.tableName);
    if (!table) {
      throw new Error(`Table ${stmt.tableName} not found`);
    }

    if (stmt.values.length !== table.columns.length) {
      throw new Error(`Expected ${table.columns.length} values, got ${stmt.values.length}`);
    }

    const row: Record<string, any> = {};
    for (let i = 0; i < table.columns.length; i++) {
      row[table.columns[i].name] = stmt.values[i];
    }
    table.rows.push(row);
    return `Inserted 1 row into ${stmt.tableName}.`;
  }

  private select(stmt: SelectStatement): Record<string, any>[] {
    const table = this.tables.get(stmt.fromTable);
    if (!table) {
      throw new Error(`Table ${stmt.fromTable} not found`);
    }

    let result = [...table.rows];

    // WHERE filter
    if (stmt.where) {
      const { column, operator, value } = stmt.where;
      result = result.filter((r) => {
        const rowVal = r[column];
        switch (operator) {
          case '=':
            return rowVal === value;
          case '!=':
            return rowVal !== value;
          case '>':
            return rowVal > value;
          case '<':
            return rowVal < value;
          case '>=':
            return rowVal >= value;
          case '<=':
            return rowVal <= value;
          default:
            return false;
        }
      });
    }

    // ORDER BY
    if (stmt.orderBy) {
      const { column, ascending } = stmt.orderBy;
      result.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // LIMIT
    if (stmt.limit !== undefined && stmt.limit >= 0) {
      result = result.slice(0, stmt.limit);
    }

    // Column projection
    if (stmt.columns.length === 1 && stmt.columns[0] === '*') {
      return result;
    }

    return result.map((r) => {
      const projected: Record<string, any> = {};
      for (const col of stmt.columns) {
        projected[col] = r[col];
      }
      return projected;
    });
  }
}
