import * as SQLite from 'expo-sqlite';
import { Contact } from '../types/domain';
import { decryptAES256, encryptAES256 } from '../utils/crypto';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const db = async () => {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('edgemessage.db');
  return dbPromise;
};

const init = async () => {
  const conn = await db();
  await conn.execAsync(
    'CREATE TABLE IF NOT EXISTS contacts(id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);'
  );
};

export const LocalDbService = {
  async init(): Promise<void> {
    await init();
  },

  async loadContacts(masterKey: string): Promise<Contact[]> {
    await init();
    const conn = await db();
    const rows = await conn.getAllAsync<{ payload: string }>('SELECT payload FROM contacts');
    return Promise.all(rows.map(async (r) => JSON.parse(await decryptAES256(r.payload, masterKey)) as Contact));
  },

  async saveContacts(masterKey: string, contacts: Contact[]): Promise<void> {
    await init();
    const conn = await db();
    await conn.withTransactionAsync(async () => {
      await conn.runAsync('DELETE FROM contacts');
      for (const c of contacts) {
        const payload = await encryptAES256(JSON.stringify(c), masterKey);
        await conn.runAsync('INSERT INTO contacts(id,payload) VALUES(?,?)', [c.id, payload]);
      }
    });
  }
};
