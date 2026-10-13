const escapeCell = (cell: string | number | null) => {
  const text = cell === null ? '' : String(cell)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns: string[], rows: (string | number | null)[][]) {
  return [columns, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

/** Saves `csv` as `<name>.csv` through a temporary link. */
export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${name.replace(/[^\w.-]+/g, '_') || 'dataset'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
