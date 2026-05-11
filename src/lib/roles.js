export const ROLES = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  MECANICO: 'mecanico',
  TECNICO: 'tecnico',
  VENDEDOR: 'vendedor',
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  gerente: 'Gerente',
  mecanico: 'Mecânico',
  tecnico: 'Técnico',
  vendedor: 'Vendedor',
}

export const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  gerente: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  mecanico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tecnico: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  vendedor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export const isAdmin = (role) => role === ROLES.ADMIN
export const canEditSystem = (role) => role === ROLES.ADMIN
