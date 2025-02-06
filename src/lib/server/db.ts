import sqlite3 from 'better-sqlite3';
import { SyncDatabase } from '@pilcrowjs/db-query';

import type { SyncAdapter } from '@pilcrowjs/db-query';

const sqlite = sqlite3('sqlite.db');
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS user (
	  id INTEGER NOT NULL PRIMARY KEY,
	  github_id INTEGER NOT NULL UNIQUE,
	  email TEXT NOT NULL UNIQUE,
	  username TEXT NOT NULL
	);
  
	CREATE INDEX IF NOT EXISTS github_id_index ON user(github_id);
  
	CREATE TABLE IF NOT EXISTS session (
	  id TEXT NOT NULL PRIMARY KEY,
	  user_id INTEGER NOT NULL REFERENCES user(id),
	  expires_at INTEGER NOT NULL
	);
  `);
// sqlite.exec(`
// 	CREATE TABLE user (
//     id INTEGER NOT NULL PRIMARY KEY,
//     github_id INTEGER NOT NULL UNIQUE,
//     email TEXT NOT NULL UNIQUE,
//     username TEXT NOT NULL
// );

// CREATE INDEX github_id_index ON user(github_id);

// CREATE TABLE session (
//     id TEXT NOT NULL PRIMARY KEY,
//     user_id INTEGER NOT NULL REFERENCES user(id),
//     expires_at INTEGER NOT NULL
// );
//   `);

const adapter: SyncAdapter<sqlite3.RunResult> = {
	query: (statement: string, params: unknown[]): unknown[][] => {
		const result = sqlite
			.prepare(statement)
			.raw()
			.all(...params);
		return result as unknown[][];
	},
	execute: (statement: string, params: unknown[]): sqlite3.RunResult => {
		const result = sqlite.prepare(statement).run(...params);
		return result;
	}
};

class Database extends SyncDatabase<sqlite3.RunResult> {
	public inTransaction(): boolean {
		return sqlite.inTransaction;
	}
}

export const db = new Database(adapter);
