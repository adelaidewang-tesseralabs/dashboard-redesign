/** Display name from an email's local part: `adelaide@…` → `Adelaide`. */
export function nameOf(user: string) {
  const local = user.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function initialsOf(user: string) {
  return nameOf(user).slice(0, 2).toUpperCase()
}
