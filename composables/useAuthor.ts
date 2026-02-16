import { getAuthorId } from "./useAuthorId";

/** Resolve author by immutable ID (filename stem, e.g. chinono). */
export const useAuthor = async (authorId: string) => {
  const { data: authors } = await useAsyncData(`author-${authorId}`, () =>
    queryCollection('authors').all()
  );

  const author = computed(() => {
    if (!authors.value) return null;
    return authors.value.find((a: unknown) => getAuthorId(a as { path?: string; name?: string }) === authorId) ?? null;
  });

  return author;
};
