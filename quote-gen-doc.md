# Documentation of how the Quote Generator was implemented

1. Created ```quote.js``` in ```src/_data```

2. Code
```js
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

```

and then in the ```index.njk``` where the quote renders:

```html
    <div class="hero-quote-wrapper">
        <p class="hero-quote">
            "{{ quote.q }}"
        </p>
        <p class="hero-quote-author">{{ quote.a }}</p>
    </div>
```

The **{{}}** is an njk function that automatically renders whats inside the ```quotes.js```

for it to generate everyday I need a way to rebuild the site every midnight. 

Netlify has a built in settings for that

4. Netlify setup
```
Go to the site

then:

project configuration --> Build & Deploy --> Continous Deployment

In Continous deployment, scroll till you find Build Hooks
```

then click add **Build Hook** 

Give it a name then save, Netlify will generate a url, copy the url to your notepad temporarily.

then go to [cron-job.org](https://cron-job.org/en/)

create an account, after that

1. Click **Create CronJob** 
2. Add title and paste the url that netlify gave you.
3. Select schedule but for this case, select every day at 0:00 (midnight2. Add title and paste the url that netlify gave you.)

You can add settings if in case that cronjob fails to create and notify.
