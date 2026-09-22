/**
 * Generador de contraseñas para residentes, administradores y personal de seguridad.
 * Genera contraseñas que comienzan con 'LP-' y tienen una longitud total de 8 a 12 caracteres.
 */
export function generateSecurePassword(prefix = 'LP-', totalLength = 10): string {
  // Caracteres sin ambigüedades visuales (evita 0/O, 1/I/l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const randomLength = Math.max(5, Math.min(9, totalLength - prefix.length))
  
  let randomPart = ''
  for (let i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    randomPart += chars.charAt(randomIndex)
  }
  
  return `${prefix}${randomPart}`
}
