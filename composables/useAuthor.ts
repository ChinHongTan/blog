export const useAuthor = async (authorName: string) => {
  // Fetch author data from the authors collection
  const { data: authors } = await useAsyncData(`author-${authorName}`, () =>
    queryCollection('authors').all()
  );
  
  // Find the matching author by name
  const author = computed(() => {
    if (!authors.value) return null;
    return authors.value.find((a: unknown) => {
      const authorData = a as { name: string };
      return authorData.name === authorName;
    });
  });
  
  return author;
};
