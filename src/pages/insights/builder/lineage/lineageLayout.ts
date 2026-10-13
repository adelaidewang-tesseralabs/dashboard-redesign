import { LINEAGE_KINDS, type LineageKind, type LineageNode } from './lineageGraph'

export const NODE_W = 232
export const NODE_H = 60
const COL_GAP = 72
const ROW_GAP = 14
const HEADER_H = 32
const PAD = 32

export type LineageLayout = {
  width: number
  height: number
  positions: Map<string, { x: number; y: number }>
  headers: { kind: LineageKind; x: number; count: number }[]
}

/** One column per kind that has nodes, left to right; shorter columns are centred against the tallest. */
export function layoutLineage(nodes: LineageNode[]): LineageLayout {
  const columns = LINEAGE_KINDS.map((kind) => nodes.filter((node) => node.kind === kind)).filter((column) => column.length > 0)
  const tallest = Math.max(1, ...columns.map((column) => column.length))
  const positions = new Map<string, { x: number; y: number }>()
  const columnX = (index: number) => PAD + index * (NODE_W + COL_GAP)
  columns.forEach((column, index) => {
    const offset = ((tallest - column.length) * (NODE_H + ROW_GAP)) / 2
    column.forEach((node, row) => positions.set(node.id, { x: columnX(index), y: PAD + HEADER_H + offset + row * (NODE_H + ROW_GAP) }))
  })
  return {
    width: PAD * 2 + columns.length * NODE_W + Math.max(0, columns.length - 1) * COL_GAP,
    height: PAD * 2 + HEADER_H + tallest * (NODE_H + ROW_GAP) - ROW_GAP,
    positions,
    headers: columns.map((column, index) => ({ kind: column[0].kind, x: columnX(index), count: column.length })),
  }
}

/** A horizontal S-curve from the right edge of one node to the left edge of the next. */
export function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const x1 = from.x + NODE_W
  const y1 = from.y + NODE_H / 2
  const x2 = to.x
  const y2 = to.y + NODE_H / 2
  const bend = (x2 - x1) / 2
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
}
