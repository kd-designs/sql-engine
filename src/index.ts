export * from './lexer';
export * from './parser';
export * from './engine';

import { SQLEngine } from './engine';

if (require.main === module) {
  const db = new SQLEngine();

  console.log(db.execute('CREATE TABLE users (id INT, name TEXT, age INT)'));
  console.log(db.execute("INSERT INTO users VALUES (1, 'Alice', 30)"));
  console.log(db.execute("INSERT INTO users VALUES (2, 'Bob', 24)"));
  console.log(db.execute("INSERT INTO users VALUES (3, 'Charlie', 35)"));

  console.log('\n--- Query: SELECT * FROM users WHERE age > 25 ORDER BY age DESC ---');
  const res = db.execute('SELECT * FROM users WHERE age > 25 ORDER BY age DESC');
  console.table(res);
}
