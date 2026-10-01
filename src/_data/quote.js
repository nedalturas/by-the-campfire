module.exports = async () => {
    try {
        const res = await fetch("https://dummyjson.com/quotes/random");
        const data = await res.json();
        const quote = { q: data.quote, a: data.author };
        console.log(quote);
        return quote;
    } catch (err) {
        console.error("Quote fetch failed: ", err.cause);
        return { q: "Only in their dreams can men be truly free. `Twas always thus, and always thus wil be.", a: "Tom Schulman" };
    }
}

