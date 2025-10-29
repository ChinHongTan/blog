export default defineNuxtPlugin((nuxtApp) => {
  const existingResolver = nuxtApp.vueApp.config.compilerOptions.isCustomElement;

  nuxtApp.vueApp.config.compilerOptions.isCustomElement = (tag) => {
    // Handle both kebab-case (mjx-container) and PascalCase (MjxContainer)
    const lowerTag = tag.toLowerCase();
    if (lowerTag.startsWith('mjx-') || 
        lowerTag === 'mjxcontainer' || 
        tag === 'MjxContainer' ||
        tag.startsWith('Mjx')) {
      return true;
    }

    if (typeof existingResolver === 'function') {
      return existingResolver(tag);
    }

    return false;
  };
});
