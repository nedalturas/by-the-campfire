export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  if (ua.includes("facebookexternalhit")) {
    const requestClone = new Request(request.url, request);
    // Masquerade as a normal browser to bypass any internal WAF blocks
    requestClone.headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    return context.next(requestClone);
  }
  return context.next();
};

export const config = {
  path: "/*",
};
