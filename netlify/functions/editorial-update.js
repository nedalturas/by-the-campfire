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
  let authorNotes = "";
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
        if (frontmatter?.author_notes) authorNotes = String(frontmatter.author_notes).trim();

        // Grab the new role identifier!
        if (frontmatter?.last_editor_role) lastEditorRole = frontmatter.last_editor_role;
      }
    }
  } catch (error) {
    console.error("Could not retrieve article information:", error);
  }

  // ---------------------------------------------------------
  // Load proofreaders from config and build Discord mentions
  // To add/remove a proofreader, edit netlify/functions/config/proofreaders.json
  // ---------------------------------------------------------
  let proofreaderMentions = "";
  try {
    const configUrl = `https://api.github.com/repos/${repo}/contents/netlify/functions/config/proofreaders.json`;
    const configRes = await fetch(configUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Editorial-Discord-Bot",
      },
    });

    if (configRes.ok) {
      const configFile = await configRes.json();
      const proofreaders = JSON.parse(
        Buffer.from(configFile.content, "base64").toString("utf-8")
      );
      proofreaderMentions = proofreaders
        .map((p) => `<@${p.discord_id}>`)
        .join(" ");
    }
  } catch (error) {
    console.error("Could not load proofreaders config:", error);
  }

  let message = null;
  let proofreaderMessage = null;

  // ---------------------------------------------------------
  // 1. Article moved to IN REVIEW (Writer -> Proofreader)
  // ---------------------------------------------------------
  if (data.action === "labeled" && label === "decap-cms/pending_review") {
    message = `
📝 **Post Ready for Review**

**${title}**
Status: In Review
`;
    if (authorNotes) {
      message += `\n**Author Notes:**\n${authorNotes}\n`;
    }
    message += `\nA writer has submitted this post for review.\n\n[Open Post in CMS](${url})`;

    proofreaderMessage = `
📝 **New Post Assigned for Review**

**${title}**

${proofreaderMentions || "@proofreader"}
A writer has submitted this post for your review.
`;
    if (authorNotes) {
      proofreaderMessage += `\n**Author Notes:**\n${authorNotes}\n`;
    }
    proofreaderMessage += `\n[Open Post in CMS](${url})`;
  }

  // ---------------------------------------------------------
  // 2. Post moved back to DRAFT (Proofreader -> Writer)
  // ---------------------------------------------------------
  const prLabels = data.pull_request?.labels?.map((l) => l.name) ?? [];
  const isMovingToPublish =
    label === "decap-cms/pending_publish" ||
    prLabels.includes("decap-cms/pending_publish");

  if (
    data.action === "unlabeled" &&
    label === "decap-cms/pending_review" &&
    !isMovingToPublish
  ) {
    message = `
✏️ **Proofreader Suggested Edits**

**${title}**
Status: Changes Requested

<@&YOUR_WRITER_ROLE_ID>
The proofreader has requested changes. Please check the following notes. Move back to "In Review" once done.
`;
    if (editorNotes) {
      message += `\n**Editor Notes:**\n${editorNotes}\n`;
    } else {
      message += `\n_No Editor Notes were provided._\n`;
    }
    message += `\n[Open Post in CMS](${url})`;
  }

  // ---------------------------------------------------------
  // 3. Post moved to READY TO PUBLISH
  // ---------------------------------------------------------
  if (data.action === "labeled" && label === "decap-cms/pending_publish") {
    message = `
✅ **Post has passed the review phase**

**${title}**
Status: Ready

Proofreader will proceed to publish this post

_**Note**: there will be a delay (usually a couple of minutes) in publishing the post, contact or ping the admin in this thread if it hasn't been posted after 1 day._

[Open Post in CMS](${url})`;

    proofreaderMessage = `
✅ **Post Ready to Publish**

**${title}**

${proofreaderMentions || "@proofreader"}
This post has passed review and is ready to be published.

[Open Post in CMS](${url})`;
  }

  console.log("ACTION:", data.action);
  console.log("LABEL:", label);
  console.log("TITLE:", title);
  console.log("LAST EDITOR ROLE:", lastEditorRole);
  console.log("AUTHOR NOTES:", authorNotes);
  console.log("PROOFREADER MENTIONS:", proofreaderMentions);

  // Ignore everything else (e.g., if a writer moves their own post back to draft)
  if (!message && !proofreaderMessage) {
    return new Response("Label ignored", { status: 200 });
  }

  const sends = [];

  // Send to the general editorial channel
  if (message) {
    sends.push(
      fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      })
    );
  }

  // Send to the proofreader-only channel (DISCORD_PROOFREADER_WEBHOOK_URL)
  if (proofreaderMessage && process.env.DISCORD_PROOFREADER_WEBHOOK_URL) {
    sends.push(
      fetch(process.env.DISCORD_PROOFREADER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: proofreaderMessage }),
      })
    );
  }

  await Promise.all(sends);

  return new Response("Discord notification sent", { status: 200 });
};
