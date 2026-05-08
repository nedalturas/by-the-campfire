fetch("https://httpbin.org/get")
.then(r => json())
.then(console.log)
.catch(err => console.error(err.cause));
