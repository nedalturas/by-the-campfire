module.exports = async () => {
    try{
        const res = await fetch("https://zenquotes.io/api/random");
        const [quote] = await res.json();
        console.log(quote);
        return quote;
    } catch (err){
        console.error("Quote fetch failed: ", err.cause);
        return {q: "Quote unavailable", a: ""}
    }
}

//TODO
/*
Add quote fallback

"Only in their dreams can men be truly free. `Twas always thus, and always thus wil be."
- Tom Schulman
*/