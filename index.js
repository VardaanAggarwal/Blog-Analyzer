const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
const PORT = 3000;

let blogs;

// Function to fetch blogs
const fetchBlogs = async () => {
  const response = await axios.get(
    "https://intent-kit-16.hasura.app/api/rest/blogs",
    {
      headers: {
        "x-hasura-admin-secret":
          "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
      },
    }
  );

  return response.data.blogs;
};

// Memoized function for analytics
const memoizedAnalytics = _.memoize(
  async () => {
    if (!blogs) {
      blogs = await fetchBlogs();
    }

    const totalBlogs = blogs.length;
    const longestTitleBlog = _.maxBy(blogs, "title.length");
    const privacyBlogs = blogs.filter((blog) =>
      blog.title.toLowerCase().includes("privacy")
    );
    const uniqueTitles = _.uniqBy(blogs, "title");

    return {
      totalBlogs,
      longestTitle: longestTitleBlog.title,
      privacyBlogs: privacyBlogs.length,
      uniqueTitles: uniqueTitles.map((blog) => blog.title),
    };
  },
  () => "analytics"
);

// Memoized function for search
const memoizedSearch = _.memoize(
  async (query) => {
    if (!blogs) {
      blogs = await fetchBlogs();
    }

    const searchResults = blogs.filter((blog) =>
      blog.title.toLowerCase().includes(query)
    );

    return { searchResults };
  },
  (query) => `for:${query}`
);
// Blog stats endpoint
app.get("/api/blog-stats", async (req, res) => {
  try {
    const analytics = await memoizedAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Blog search endpoint
app.get("/api/blog-search", async (req, res) => {
  try {
    let query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    query = query.toLowerCase();

    const searchResults = await memoizedSearch(query);
    res.json(searchResults);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
