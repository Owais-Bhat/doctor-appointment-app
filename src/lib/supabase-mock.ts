import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      profiles: [
        { id: 'mock-admin-uid', email: 'admin@cybermilo.com', full_name: 'Super Admin', role: 'super_admin' }
      ],
      doctor_profiles: [],
      appointments: [],
      notifications: [],
      audit_logs: [],
    }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return {
      profiles: [],
      doctor_profiles: [],
      appointments: [],
      notifications: [],
      audit_logs: [],
    };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function createMockClient() {
  return {
    from(table: string) {
      return {
        select(fields?: string, options?: any) {
          const db = readDb();
          let data = db[table] || [];

          const chain = {
            eq(column: string, value: any) {
              data = data.filter((row: any) => String(row[column]) === String(value));
              return chain;
            },
            order(column: string, options?: any) {
              return chain;
            },
            limit(n: number) {
              data = data.slice(0, n);
              return chain;
            },
            maybeSingle() {
              return {
                then(resolve: any) {
                  resolve({ data: data[0] || null, error: null });
                },
                data: data[0] || null,
                error: null
              };
            },
            single() {
              const notFoundError = data[0] ? null : Object.assign(new Error('No rows found'), { code: 'PGRST116' });
              return {
                then(resolve: any) {
                  resolve({ data: data[0] || null, error: notFoundError });
                },
                data: data[0] || null,
                error: notFoundError
              };
            },
            then(resolve: any) {
              resolve({ data, error: null });
            }
          };
          return chain;
        },
        upsert(values: any, options?: any) {
          const db = readDb();
          if (!db[table]) db[table] = [];
          const list = db[table];
          const arr = Array.isArray(values) ? values : [values];
          for (const item of arr) {
            const idx = list.findIndex((row: any) => String(row.id) === String(item.id));
            if (idx > -1) {
              list[idx] = { ...list[idx], ...item };
            } else {
              list.push(item);
            }
          }
          writeDb(db);

          const chain = {
            select(fields?: string) {
              return chain;
            },
            single() {
              return {
                then(resolve: any) {
                  resolve({ data: arr[0] || null, error: null });
                },
                data: arr[0] || null,
                error: null
              };
            },
            maybeSingle() {
              return {
                then(resolve: any) {
                  resolve({ data: arr[0] || null, error: null });
                },
                data: arr[0] || null,
                error: null
              };
            },
            then(resolve: any) {
              resolve({ data: arr, error: null });
            }
          };
          return chain;
        },
        insert(values: any) {
          const db = readDb();
          if (!db[table]) db[table] = [];
          const list = db[table];
          const arr = Array.isArray(values) ? values : [values];
          list.push(...arr);
          writeDb(db);

          const chain = {
            select(fields?: string) {
              return chain;
            },
            single() {
              return {
                then(resolve: any) {
                  resolve({ data: arr[0] || null, error: null });
                },
                data: arr[0] || null,
                error: null
              };
            },
            maybeSingle() {
              return {
                then(resolve: any) {
                  resolve({ data: arr[0] || null, error: null });
                },
                data: arr[0] || null,
                error: null
              };
            },
            then(resolve: any) {
              resolve({ data: arr, error: null });
            }
          };
          return chain;
        },
        update(values: any) {
          return {
            eq(column: string, value: any) {
              const db = readDb();
              const list = db[table] || [];
              const updatedRows: any[] = [];
              list.forEach((row: any) => {
                if (String(row[column]) === String(value)) {
                  Object.assign(row, values);
                  updatedRows.push(row);
                }
              });
              writeDb(db);

              const chain = {
                select(fields?: string) {
                  return chain;
                },
                single() {
                  return {
                    then(resolve: any) {
                      resolve({ data: updatedRows[0] || null, error: null });
                    },
                    data: updatedRows[0] || null,
                    error: null
                  };
                },
                maybeSingle() {
                  return {
                    then(resolve: any) {
                      resolve({ data: updatedRows[0] || null, error: null });
                    },
                    data: updatedRows[0] || null,
                    error: null
                  };
                },
                then(resolve: any) {
                  resolve({ data: updatedRows, error: null });
                }
              };
              return chain;
            }
          };
        }
      };
    }
  };
}
