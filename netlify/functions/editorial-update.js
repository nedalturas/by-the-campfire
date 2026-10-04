export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const data = await req.json();

  const action = data.action;
  const title = data.pull_request?.title;
  const url = data.pull_request?.html_url;

  const message = {
    content: `Editorial update\n\n**${title}**\nStatus: ${action}\n${url}`,
  };

  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  return new Response("Discord notification sent", {
    status: 200,
  });
};
