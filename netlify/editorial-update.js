export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {status: 405});
    
  }

  const data = await req.json();

  console.log("Github webhook received:", data);

  return new Response("Webhook received", {
    status: 200,
  });
};
