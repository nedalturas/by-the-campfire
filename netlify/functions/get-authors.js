// netlify/functions/get-authors.js
exports.handler = async (event, context) => {
    const { identity } = context.clientContext;
  
    try {
      const res = await fetch(`${identity.url}/admin/users`, {
        headers: {
          Authorization: `Bearer ${identity.token}`
        }
      });
      const data = await res.json();
      const authors = data.users.map(user => ({
        name: user.user_metadata.full_name || "Anonymous",
        id: user.id
      }));
      return { statusCode: 200, body: JSON.stringify(authors) };
    } catch (error) {
      return { statusCode: 500, body: error.toString() };
    }
  };