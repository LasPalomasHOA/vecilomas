import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Encripta una contraseña en texto plano usando bcrypt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS)
}

/**
 * Compara una contraseña en texto plano con el hash almacenado
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
