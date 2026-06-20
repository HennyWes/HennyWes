import { execSync } from 'child_process';

export const query = (sql: string) => {
  try {
    const output = execSync(`team-db "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
