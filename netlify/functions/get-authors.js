const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;

  try {
    const res = await fetch(`${identity.url}/admin/users`, {
      headers: { Authorization: `Bearer ${identity.token}` }
    });
    const data = await res.json();

    const authors = await Promise.all(data.users.map(async user => {
      const hash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex');

      // Fetch Gravatar profile
      let gravatarName = null;
      let bio = null;
      let avatar = `https://www.gravatar.com/avatar/${hash}?d=identicon`;

      try {
        const gRes = await fetch(`https://www.gravatar.com/${hash}.json`);
        if (gRes.ok) {
          const gData = await gRes.json();
          const profile = gData.entry[0];
          gravatarName = profile.displayName || null;
          bio = profile.aboutMe || null;
          avatar = profile.thumbnailUrl || avatar;
        }
      } catch (_) {
        // Gravatar profile may not exist, fallback values stay
      }

      return {
        name: user.user_metadata.full_name || "Anonymous", // pen name
        gravatarName,                                       // display name from gravatar
        bio,
        avatar,
        id: user.id
      };
    }));

    return { statusCode: 200, body: JSON.stringify(authors) };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};