module.exports = async () => {
    try {
        const res = await fetch("https://zenquotes.io/api/today");
        const [quote] = await res.json();
        console.log(quote);
        return quote;
    } catch (err) {
        console.error("Quote fetch failed: ", err.cause);
        return { q: "Only in their dreams can men be truly free. `Twas always thus, and always thus wil be.", a: "Tom Schulman" };
    }
}

//TODO
/*
Add quote fallback

"Only in their dreams can men be truly free. `Twas always thus, and always thus wil be."
- Tom Schulman
*/
