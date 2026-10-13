import { toPng } from 'html-to-image'

/** Saves `node` as `<name>.png` at 2× scale, leaving out anything marked `data-capture-ignore` (menus, hover buttons). */
export async function downloadPng(node: HTMLElement, name: string, background: string) {
  const url = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: background,
    filter: (child) => !(child instanceof HTMLElement && child.dataset.captureIgnore !== undefined),
  })
  const link = document.createElement('a')
  link.href = url
  link.download = `${name.replace(/[^\w.-]+/g, '_') || 'graph'}.png`
  link.click()
}
