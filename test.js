const test = require("node:test");
const assert = require("node:assert/strict");

const getQuote = require("./src/_data/quote.js");

const fallbackQuote = {
	q: "Only in their dreams can men be truly free. `Twas always thus, and always thus wil be.",
	a: "Tom Schulman"
};

test("returns today's quote from the API", async () => {
	const originalFetch = global.fetch;
	let requestedUrl;

	global.fetch = async url => {
		requestedUrl = url;
		return {
			json: async () => [{ q: "A test quote", a: "A test author" }]
		};
	};

	try {
		const quote = await getQuote();

		assert.equal(requestedUrl, "https://zenquotes.io/api/today");
		assert.deepEqual(quote, { q: "A test quote", a: "A test author" });
	} finally {
		global.fetch = originalFetch;
	}
});

test("returns the fallback quote when the API fails", async () => {
	const originalFetch = global.fetch;
	const originalConsoleError = console.error;

	global.fetch = async () => {
		throw new Error("network failure");
	};
	console.error = () => {};

	try {
		assert.deepEqual(await getQuote(), fallbackQuote);
	} finally {
		global.fetch = originalFetch;
		console.error = originalConsoleError;
	}
});
