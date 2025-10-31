export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) {
    return
  }

  let currentFootnote: HTMLElement | null = null
  let currentCitation: HTMLElement | null = null

  const resetHighlight = (element: HTMLElement | null, className: string) => {
    if (element) {
      element.classList.remove(className)
    }
    return null
  }

  const setHighlight = (
    nextElement: HTMLElement | null,
    currentElement: HTMLElement | null,
    className: string
  ) => {
    if (currentElement && currentElement !== nextElement) {
      currentElement.classList.remove(className)
    }

    if (!nextElement) {
      return resetHighlight(currentElement, className)
    }

    nextElement.classList.add(className)
    return nextElement
  }

  const getElementFromHash = (hash: string | null) => {
    if (!hash || !hash.startsWith('#')) {
      return null
    }

    const id = decodeURIComponent(hash.slice(1))
    return document.getElementById(id)
  }

  const syncHighlightFromHash = () => {
    const { hash } = window.location

    if (hash.startsWith('#user-content-fn-')) {
      currentFootnote = setHighlight(
        getElementFromHash(hash),
        currentFootnote,
        'is-footnote-highlighted'
      )
      currentCitation = resetHighlight(currentCitation, 'is-citation-highlighted')
    } else if (hash.startsWith('#user-content-fnref-')) {
      currentCitation = setHighlight(
        getElementFromHash(hash),
        currentCitation,
        'is-citation-highlighted'
      )
      currentFootnote = resetHighlight(currentFootnote, 'is-footnote-highlighted')
    } else {
      currentFootnote = resetHighlight(currentFootnote, 'is-footnote-highlighted')
      currentCitation = resetHighlight(currentCitation, 'is-citation-highlighted')
    }
  }

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null

    if (!target) {
      return
    }

    const footnoteLink = target.closest('a[href^="#user-content-fn-"]') as HTMLAnchorElement | null
    if (footnoteLink) {
      currentFootnote = setHighlight(
        getElementFromHash(footnoteLink.hash),
        currentFootnote,
        'is-footnote-highlighted'
      )
      currentCitation = resetHighlight(currentCitation, 'is-citation-highlighted')
      return
    }

    const citationLink = target.closest('a[href^="#user-content-fnref-"]') as HTMLAnchorElement | null
    if (citationLink) {
      currentFootnote = resetHighlight(currentFootnote, 'is-footnote-highlighted')
      currentCitation = setHighlight(
        getElementFromHash(citationLink.hash),
        currentCitation,
        'is-citation-highlighted'
      )
    }
  }

  document.addEventListener('click', handleClick, true)
  window.addEventListener('hashchange', syncHighlightFromHash, { passive: true })

  nuxtApp.hook('page:start', () => {
    currentFootnote = resetHighlight(currentFootnote, 'is-footnote-highlighted')
    currentCitation = resetHighlight(currentCitation, 'is-citation-highlighted')
  })

  nuxtApp.hook('page:finish', () => {
    syncHighlightFromHash()
  })

  // Initial sync for direct navigation with hash
  syncHighlightFromHash()
})
