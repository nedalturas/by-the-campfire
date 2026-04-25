const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;

  try {
    const res = await fetch(`${identity.url}/admin/users`, {
      headers: { Authorization: `Bearer ${identity.token}` }
    });
    const data = await res.json();
    const authors = data.users.map(user => {
      const hash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex');
      return {
        name: user.user_metadata.full_name || "Anonymous",
        avatar: `https://www.gravatar.com/avatar/${hash}?d=identicon`,
        id: user.id
      };
    });
    return { statusCode: 200, body: JSON.stringify(authors) };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};