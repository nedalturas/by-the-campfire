export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  if (ua.includes("facebookexternalhit")) {
    return context.next();
  }
};

export const config = {
  path: "/*",
};
