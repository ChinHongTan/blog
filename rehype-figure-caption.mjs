/**
 * Rehype plugin: wrap images that have a title in <figure> with <figcaption>.
 * Markdown: ![alt](url "caption") → <figure><img><figcaption>caption</figcaption></figure>
 */
import { visit } from 'unist-util-visit'

export default function rehypeFigureCaption() {
  return (tree) => {
    const nodesToReplace = []
    visit(tree, (node, index, parent) => {
      if (node.type !== 'element' || node.tagName !== 'img') return
      const title = node.properties?.title
      if (typeof title !== 'string' || !title.trim()) return
      if (!parent || typeof index !== 'number') return
      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [
          { ...node, properties: { ...node.properties, title: undefined } },
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: title }],
          },
        ],
      }
      nodesToReplace.push({ parent, index, figure })
    })
    for (const { parent, index, figure } of nodesToReplace) {
      parent.children[index] = figure
    }
  }
}
