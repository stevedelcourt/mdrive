import bcrypt from 'bcryptjs';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'password', 10);

export function verifyAdmin(username: string, password: string): boolean {
  return username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
