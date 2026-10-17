const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  const md = new markdownIt({ html: true });

  // Pass through files
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_headers");

  // Convert Markdown stored in front matter to HTML
  eleventyConfig.addFilter("markdownify", (content = "") => {
    return md.render(content);
  });

  // Format dates
  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);


  // Get all unique tags
  eleventyConfig.addCollection("tagList", function (collectionApi) {
    let tagSet = new Set();
    collectionApi.getAll().forEach(function (item) {
      if ("tags" in item.data) {
        let tags = item.data.tags;
        tags = tags.filter(item => {
          if (!item || item.toString().trim() === "") {
            return false;
          }
          switch (item) {
            // this list should match the `filter` list in tags.njk
            case "all":
            case "nav":
            case "post":
            case "posts":
            case "docs":
              return false;
          }
          return true;
        });
        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    });
    // Returning an array in alphabetical order

    return [...tagSet].sort();
  });


  eleventyConfig.addCollection('docs', function (collectionApi) {
    return collectionApi.getFilteredByGlob('src/docs/*.md').sort((a, b) => {
      return (a.data.order || 99) - (b.data.order || 99);
    });
  });

  // Filter to group docs by category for the sidebar
  eleventyConfig.addFilter('groupByCategory', function(docsCollection){
    if(!docsCollection) return [];

    const groups = {};
    docsCollection.forEach((doc) =>{
      const cat = doc.data.category || "General";
      if(!groups[cat]){
        groups[cat] = [];
      }
      groups[cat].push(doc);
    });

    return Object.keys(groups).map((category) => ({
      category,
      items: groups[category].sort((a,b) => (a.data.order || 99) - (b.data.order || 99)),
    }));
  });


  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
