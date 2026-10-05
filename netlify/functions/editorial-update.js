import yaml from "js-yaml";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const data = await req.json();

  // We only care about label additions/removals
  if (data.action !== "labeled" && data.action !== "unlabeled") {
    return new Response("Ignored", { status: 200 });
  }

  const label = data.label?.name;
  const branch = data.pull_request?.head?.ref;
  const repo = data.repository?.full_name;

  // Get the article slug from the Decap branch
  const prefix = "cms/posts/";
  if (!branch?.startsWith(prefix)) {
    return new Response("Not a Decap post", { status: 200 });
  }

  const slug = branch.slice(prefix.length);

  // Direct Decap editor URL
  const url = `https://by-the-campfire.netlify.app/admin/#/collections/posts/entries/${slug}`;

  let title = slug;
  let editorNotes = "";
  let lastEditorRole = "";

  // Get article information from GitHub
  try {
    const fileUrl = `https://api.github.com/repos/${repo}/contents/src/posts/${slug}.md?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(fileUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Editorial-Discord-Bot",
      },
    });

    if (response.ok) {
      const file = await response.json();
      const content = Buffer.from(file.content, "base64").toString("utf-8");
      
      // Extract YAML frontmatter
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

      if (frontmatterMatch) {
        const frontmatter = yaml.load(frontmatterMatch[1]);
        if (frontmatter?.title) title = frontmatter.title;
        if (frontmatter?.editor_notes) editorNotes = String(frontmatter.editor_notes).trim();
        
        // Grab the new role identifier!
        if (frontmatter?.last_editor_role) lastEditorRole = frontmatter.last_editor_role;
      }
    }
  } catch (error) {
    console.error("Could not retrieve article information:", error);
  }

  let message = null;

  // ---------------------------------------------------------
  // 1. Article moved to IN REVIEW (Writer -> Proofreader)
  // ---------------------------------------------------------
  if (data.action === "labeled" && label === "decap-cms/pending_review") {
    if (lastEditorRole === "writer") {
      message = `
📝 **Post Ready for Review**

**${title}**
Status: In Review

<@&YOUR_PROOFREADER_ROLE_ID>
A writer has submitted this article for review.

[Open Article in CMS](${url})`;
    }
  }

  // ---------------------------------------------------------
  // 2. Article moved back to DRAFT (Proofreader -> Writer)
  // ---------------------------------------------------------
  if (data.action === "unlabeled" && label === "decap-cms/pending_review") {
    if (lastEditorRole === "proofreader") {
      message = `
✏️ **Proofreader Suggested Edits**

**${title}**
Status: Changes Requested

<@&YOUR_WRITER_ROLE_ID>
The proofreader has requested changes.
`;
      if (editorNotes) {
        message += `\n**Editor Notes:**\n${editorNotes}\n`;
      } else {
        message += `\n_No Editor Notes were provided._\n`;
      }
      message += `\n[Open Article in CMS](${url})`;
    }
  }

  // ---------------------------------------------------------
  // 3. Article moved to READY TO PUBLISH
  // ---------------------------------------------------------
  if (data.action === "labeled" && label === "decap-cms/pending_publish") {
    message = `
✅ **Post has passed the review phase**

**${title}**
Status: Ready

Proofreader will proceed to publish this post

_**Note**: there will be a delay (usually a couple of minutes) in publishing the post, contact the admin if it hasn't been posted after 1 day._

[Open Article in CMS](${url})`;
  }

  console.log("ACTION:", data.action);
  console.log("LABEL:", label);
  console.log("TITLE:", title);
  console.log("LAST EDITOR ROLE:", lastEditorRole);

  // Ignore everything else (e.g., if a writer moves their own post back to draft)
  if (!message) {
    return new Response("Label ignored", { status: 200 });
  }

  // Send the payload to Discord
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message }),
  });

  return new Response("Discord notification sent", { status: 200 });
};
