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
            case "announcements":
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

  // Announcements collection (sorted newest first)
  eleventyConfig.addCollection('announcements', function (collectionApi) {
    return collectionApi.getFilteredByGlob('src/announcements/*.md').sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });
  });

  // Filter to group announcements by month and year (e.g. "October 2026")
  eleventyConfig.addFilter('groupByMonth', function (items) {
    if (!items || !items.length) return [];
    const groups = {};
    items.forEach((item) => {
      const dateObj = item.date instanceof Date ? item.date : new Date(item.date);
      const monthYear = DateTime.fromJSDate(dateObj).toFormat("LLLL yyyy");
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(item);
    });

    return Object.keys(groups).map((monthYear) => ({
      monthYear: monthYear,
      items: groups[monthYear],
    }));
  });

  // Long date formatting filter: e.g. "October 19, 2026"
  eleventyConfig.addFilter('longDate', function (dateObj) {
    if (!dateObj) return "";
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return DateTime.fromJSDate(d).toFormat("MMMM d, yyyy");
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


  eleventyConfig.addFilter("getDocPagination", function(docs, currentUrl){

    if(!docs || !currentUrl) return {current: 1, total: 1, prev: null, next: null};
    const index = docs.findIndex((d) => d.url === currentUrl);
    if(index === -1) return { current: 1, total: docs.length, prev: null, next: null};

    return{
      current: index + 1,
      total: docs.length,
      prev: index > 0 ? docs[index - 1] : null,
      next: index < docs.length - 1 ? docs[index + 1] : null,
    };

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
