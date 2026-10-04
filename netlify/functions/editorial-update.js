export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
    });
  }

  const data = await req.json();

  // Only respond to label changes
  if (data.action !== "labeled") {
    return new Response("Ignored", {
      status: 200,
    });
  }

  const label = data.label?.name;
  const title = data.pull_request?.title;
  const url = data.pull_request?.html_url;

  let message = null;

  if (label === "decap-cms/pending_review") {
    message = `📝 **Article Ready for Review**

**${title}**

Status: In Review

${url}`;
  }

  if (label === "decap-cms/pending_publish") {
    message = `✅ **Article Ready to Publish**

**${title}**

Status: Ready
${url}`;
  }

  // Ignore all other labels
  if (!message) {
    return new Response("Label ignored", {
      status: 200,
    });
  }

  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });

  return new Response("Discord notification sent", {
    status: 200,
  });
};
