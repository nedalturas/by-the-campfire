import yaml from "js-yaml";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
    });
  }

  const data = await req.json();

  // We only care about label additions/removals
  if (data.action !== "labeled" && data.action !== "unlabeled") {
    return new Response("Ignored", {
      status: 200,
    });
  }

  const label = data.label?.name;
  const branch = data.pull_request?.head?.ref;
  const repo = data.repository?.full_name;

  // Get the article slug from the Decap branch
  const prefix = "cms/posts/";

  if (!branch?.startsWith(prefix)) {
    return new Response("Not a Decap post", {
      status: 200,
    });
  }

  // Get the post slug
  const slug = branch.slice(prefix.length);

  // Build the direct Decap editor URL
  const url =
    `https://by-the-campfire.netlify.app/admin/#/collections/posts/entries/${slug}`;

  let title = slug;
  let editorNotes = "";

  // Try to get the article information from GitHub
  try {
    const fileUrl =
      `https://api.github.com/repos/${repo}/contents/src/posts/${slug}.md?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(fileUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Editorial-Discord-Bot",
      },
    });

    if (response.ok) {
      const file = await response.json();

      const content = Buffer.from(file.content, "base64").toString("utf-8");

      // Get title
      // Extract yaml frontmatter

      const frontmatterMatch = content.match(
        /^---\s*\n([\s\S]*?)\n---/
      )

      if(frontmatterMatch){
        const frontmatter = yaml.load(frontmatterMatch[1]);

        //Get title

        if(frontmatter?.title){
          title = frontmatter.title;
        }

        //Get Editor notes

        if(frontmatter.editor_notes){
          editorNotes = String(frontmatter.editor_notes).trim();
        }
      }
    }
  } catch (error) {
    console.error("Could not retrieve article information:", error);
  }

  let message = null;

  /*
   * IN REVIEW
   *
   * GitHub adds:
   * decap-cms/pending_review
   */
  if (
    data.action === "labeled" &&
    label === "decap-cms/pending_review"
  ) {
    message = `
📝 **Post Ready for Review**

**${title}**

Status: In Review

Proofreader assigned

[Open Article in CMS](${url})`;
  }

  /*
   * READY TO PUBLISH
   *
   * GitHub adds:
   * decap-cms/pending_publish
   */
  if (
    data.action === "labeled" &&
    label === "decap-cms/pending_publish"
  ) {
    message = `
✅ **Post has passed the review phase**

**${title}**

Status: Ready

Proofreader will proceed to publish this post

_**Note**: there will be a delay (usually a couple of minutes) in publishing
the post, contact the admin if it hasn't been posted after 1 day._

[Open Article in CMS](${url})`;
  }

  /*
   * CHANGES REQUESTED
   *
   * When the article goes:
   *
   * In Review → Draft
   *
   * GitHub removes:
   * decap-cms/pending_review
   */
  if (
    data.action === "unlabeled" &&
    label === "decap-cms/pending_review"
  ) {
    message = `
✏️ **Proofreader Suggested Edits**

**${title}**

Status: Changes Requested
`;

    if (editorNotes) {
      message += `
**Editor Notes:**

${editorNotes}
`;
    } else {
      message += `
_No Editor Notes were provided._
`;
    }

    message += `
[Open Article in CMS](${url})`;
  }

  console.log("ACTION:", data.action);
  console.log("LABEL:", label);
  console.log("BRANCH:", branch);
  console.log("TITLE:", title);
  console.log("EDITOR NOTES:", editorNotes);

  // Ignore everything else
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
