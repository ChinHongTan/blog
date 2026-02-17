/**
 * Rehype plugin: turn [text]{.className} in text nodes into <span class="className">text</span>.
 * Handles pattern split across sibling text nodes.
 */
import { visit } from 'unist-util-visit'

const PATTERN = /\[([^\]]*)\]\s*\{\.([a-z][a-z0-9-]*)\}/g

function replaceTextWithSpans(value) {
  const parts = []
  let lastIndex = 0
  let m
  PATTERN.lastIndex = 0
  while ((m = PATTERN.exec(value)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: value.slice(lastIndex, m.index) })
    }
    parts.push({
      type: 'element',
      tagName: 'span',
      properties: { className: [m[2]] },
      children: [{ type: 'text', value: m[1] }],
    })
    lastIndex = PATTERN.lastIndex
  }
  if (lastIndex === 0 && parts.length === 0) return null
  if (lastIndex < value.length) {
    parts.push({ type: 'text', value: value.slice(lastIndex) })
  }
  return parts
}

export default function rehypeSpanAttributes() {
  return (tree) => {
    visit(tree, (node) => {
      if (!node.children?.length) return
      const children = node.children
      const newChildren = []
      let i = 0
      while (i < children.length) {
        const run = []
        while (i < children.length && children[i].type === 'text') {
          run.push(children[i])
          i++
        }
        if (run.length === 0) {
          newChildren.push(children[i])
          i++
          continue
        }
        const combined = run.map((n) => n.value).join('')
        const replacement = replaceTextWithSpans(combined)
        if (replacement && replacement.length > 0) {
          newChildren.push(...replacement)
        } else {
          newChildren.push(...run)
        }
      }
      node.children = newChildren
    })
  }
}
