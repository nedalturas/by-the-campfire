export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {status: 405});
    
  }

  const data = await req.json();

  const action = data.action;
  const title = dat.pull_request?.title;
  const url = data.pull_request?.html_url;

  const message ={
    content: `Editorial update\n\n**${title}**\nStatus: ${action}\n${url}`;
  }

  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers:{
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })

  console.log("Github webhook received:", data);

  return new Response("Webhook received", {
    status: 200,
  });
};
