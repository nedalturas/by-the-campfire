export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  if (ua.toLowerCase().includes("facebookexternalhit") || ua.toLowerCase().includes("facebot")) {
    // Fetch the page content ourselves, masquerading as a regular browser.
    // We cannot mutate headers on a cloned Request, so we create a fresh one.
    const freshRequest = new Request(request.url, {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.5",
      },
    });

    const response = await context.next(freshRequest);

    // Pass the real response back but strip any caching that could lock in a bad state
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Cache-Control", "public, max-age=0, s-maxage=86400");
    return newResponse;
  }

  return context.next();
};

export const config = {
  path: "/*",
};
