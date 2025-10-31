import { visit } from 'unist-util-visit'
import type { Root, Text, Html, Parent } from 'mdast'

interface CitationData {
  key: string
  number: number
  text: string
}

/**
 * Remark plugin to handle academic citations
 * Supports syntax: [cite:key] or ^[key]
 * 
 * Example: 
 * - Text with citation[cite:evans2004] becomes: Text with citation<sup><a href="#ref-1">1</a></sup>
 * - Text with citation^[evans2004] becomes: Text with citation<sup><a href="#ref-1">1</a></sup>
 */
export default function remarkCitations() {
  return (tree: Root) => {
    const citations: Map<string, CitationData> = new Map()
    let citationCounter = 0
    const nodesToReplace: Array<{parent: Parent, index: number, newNodes: Array<Text | Html>}> = []

    // First pass: Find all citations and collect replacements
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!node.value || !parent || index === null || index === undefined) return

      // Match both [cite:key] and ^[key] syntax
      const citationRegex = /(\[cite:([^\]]+)\]|\^\[([^\]]+)\])/g
      const matches = [...node.value.matchAll(citationRegex)]

      if (matches.length === 0) return

      // Track citation numbers
      matches.forEach(match => {
        const key = match[2] || match[3] // Get key from either capture group
        if (!citations.has(key)) {
          citationCounter++
          citations.set(key, {
            key,
            number: citationCounter,
            text: match[0]
          })
        }
      })

      // Split text and create new nodes
      const newNodes: Array<Text | Html> = []
      let lastIndex = 0

      matches.forEach(match => {
        const matchIndex = match.index!
        const key = match[2] || match[3]
        const citation = citations.get(key)!

        // Add text before citation
        if (matchIndex > lastIndex) {
          newNodes.push({
            type: 'text',
            value: node.value.slice(lastIndex, matchIndex)
          })
        }

        // Add citation as HTML
        newNodes.push({
          type: 'html',
          value: `<sup class="citation"><a href="#ref-${citation.number}" id="cite-${citation.number}-${Math.random().toString(36).substr(2, 9)}">${citation.number}</a></sup>`
        })

        lastIndex = matchIndex + match[0].length
      })

      // Add remaining text
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: 'text',
          value: node.value.slice(lastIndex)
        })
      }

      // Store the replacement to apply later
      nodesToReplace.push({parent: parent as Parent, index, newNodes})
    })

    // Apply all replacements in reverse order to maintain indices
    nodesToReplace.reverse().forEach(({parent, index, newNodes}) => {
      const children = parent.children as unknown as Array<Text | Html>
      children.splice(index, 1, ...newNodes)
    })

    // Second pass: Transform References section to add backlinks
    visit(tree, 'heading', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return
      
      // Check if this is a References or Bibliography heading
      const headingText = node.children
        .filter((child): child is Text => child.type === 'text')
        .map(child => child.value)
        .join('')
        .trim()
        .toLowerCase()

      if (headingText !== 'references' && headingText !== 'bibliography') return

      // Find the next list after this heading
      let listIndex = index + 1
      while (listIndex < parent.children.length) {
        const nextNode = parent.children[listIndex]
        
        if (nextNode.type === 'list' && nextNode.ordered) {
          // Process the ordered list items
          nextNode.children.forEach((listItem, itemIndex) => {
            const refNumber = itemIndex + 1
            
            // Add id and backlink to the list item
            if (listItem.type === 'listItem' && listItem.children.length > 0) {
              const firstChild = listItem.children[0]
              
              if (firstChild.type === 'paragraph') {
                // Insert backlink HTML at the beginning
                firstChild.children.unshift({
                  type: 'html',
                  value: `<span id="ref-${refNumber}" class="reference-number"></span><a href="#cite-${refNumber}" class="backlink" aria-label="Back to citation ${refNumber}">↩</a> `
                } as Html)
              }
            }
          })
          
          break
        }
        
        listIndex++
      }
    })
  }
}
