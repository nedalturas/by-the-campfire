export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const data = await req.json();

  //respond to label changes
  //
  if(data.action !== "labeled"){
    return new Response("Ignored",{
      status: 200,
    });
  }

  const label = data.label?.name;
  const title = data.pull_request?.title;
  const url = data.pull_request?.html_url;

  let message = null;

  //TODO: add discord id's for authors
  if(label === "decap-cms/pending_review"){
    message = 
    ` **Draft is Ready for Review
      
      **${title}**

      Status: In Review

      ${url}
    `;
  }

  if(label === "decap-cms/pending_publish"){
    message =
    ` **Draft passed from review,

      Proofreader has published it,

      _Note: there might be a delay upon publish usually within couple of minutes,
      if the draft has not been published after a day kindly ping the admin. Thank you._

      **${title}**

      Status: Passed and Ready for Publish

      ${url}
    `;
  }

  //ignore all other labels
  if (!message){
    return new Response("label ignored", {
      status: 200,
    })
  }

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
