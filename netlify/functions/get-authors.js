const {admin} = require('@netlify/identity');

exports.handler = async () => {
    try{
        const users = await admin.listUsers();
        const authors = users.map(user => ({
            name: user.user_metadata.full_name || "Anonymouse",
            id: user.id
        }));
        return {statusCode: 200, body: JSON.stringify(authors)};
    } catch(error){
        return {statusCode: 500, body:error.toString()};
    }
}