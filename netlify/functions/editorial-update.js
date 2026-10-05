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
  const branch = data.pull_request?.head?.ref;
  const repo = data.repository?.full_name;

  //get the article slug from the Decap branch
  
  const prefix = "cms/posts/";

  if(!branch?.startsWith(prefix)){
    return new Response("Not a Decap post",{
      status: 200,
    });
  };
  
  // Get the post slug
  const slug = branch.slice(prefix.length);
  
  // Build the direct Decap editor URL
  
  const url = 
  `https://by-the-campfire.netlify.app/#/collections/posts/entries/${slug}`;

  let title = slug;

  // Try to get the actual article title from Github

  try{
    const fileUrl =
    `https://api.github.com/repos/${repo}/contents/src/posts/${slug}.md?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(fileUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Editorial-Discord-Bot",
      },
    });

    if(response.ok){
      const file = await response.json();

      const conetent = Buffer.from(file.content, "base64").toString("utf-8");

      const titleMatch = content.match(
        /^title:\s*["']?(.+?)["']?\s*$/m
      );

      if(titleMatch){
        title = titleMatch[1].trim();
      }

    }
  }catch(error){
    console.error("Could not retrieve article title:", error);
  }


  let message = null;

  if (label === "decap-cms/pending_review") {
    message = `
    \n
    📝 **Post Ready for Review**

    **${title}**

    Status: In Review

    Proofreader assigned

    [Open Article in CMS](${url})`;
  }

  if (label === "decap-cms/pending_publish") {
    message = `
    \n
    ✅ **Post has passed the review phase**

    **${title}**

    Status: Ready

    Proofreader will proceed to publish this post

    _**Note**: there will be a delay (usually a coupple of minutes) in publishing
    the post, contact the admin if it hasn't been posted after 1 day._
    
    [Open Article in CMS](${url})`;
  }

  console.log("BRANCH", data.pull_request?.head?.ref);
  console.log("TITLE", data.pull_request?.title);

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
