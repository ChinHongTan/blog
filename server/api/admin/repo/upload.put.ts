export default defineEventHandler(() => {
  throw createError({
    statusCode: 405,
    statusMessage: "Method Not Allowed",
    message: "Use POST /api/admin/repo/upload with multipart/form-data (file field).",
    data: {
      route: "PUT /api/admin/repo/upload",
      expectedRoute: "POST /api/admin/repo/upload",
    },
  });
});
