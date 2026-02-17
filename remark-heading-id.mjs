/**
 * Remark plugin: parse custom heading IDs from trailing {#id} in heading text.
 * Example: ### 計算機程式設計 Introduction to Programming {#計算機程式設計}
 * Produces: <h3 id="計算機程式設計">計算機程式設計 Introduction to Programming</h3>
 */
import { visit } from 'unist-util-visit'

const TRAILING_ID = /\s+\{\#([^}]+)\}\s*$/

export default function remarkHeadingId() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'heading' || !node.children?.length) return
      const last = node.children[node.children.length - 1]
      if (last.type !== 'text' || typeof last.value !== 'string') return
      const m = last.value.match(TRAILING_ID)
      if (!m) return
      const id = m[1]
      last.value = last.value.replace(TRAILING_ID, '').trimEnd()
      const data = node.data || (node.data = {})
      data.hProperties = { ...(data.hProperties || {}), id }
    })
  }
}
