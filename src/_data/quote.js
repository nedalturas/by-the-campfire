const { setDefaultResultOrder } = require("dns");
setDefaultResultOrder("ipv4first");

module.exports = async function () {
    try {
        const res = await fetch("https://zenquotes.io/api/random");
        const [quote] = await res.json();
        console.log(quote);
        return quote;
    } catch (err) {
        console.error("Quote fetch failed:", err.cause); // <-- shows real reason
        return { q: "Quote unavailable", a: "" };
    }
};

//TODO:
/*

add fallback quoute

"Only in their dreams can men be truly free. 'Twas always thus, and always thus will be."
- Tom Schulman, Dead Poets Society
*/
