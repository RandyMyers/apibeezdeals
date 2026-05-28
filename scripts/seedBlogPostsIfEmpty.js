/**
 * Insert demo blog posts only when collection is empty.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const BlogPost = require("../models/BlogPost");
const seedBlogPosts = require("../data/seedBlogPosts");

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const count = await BlogPost.countDocuments();
  if (count > 0) {
    console.log(`Blog posts already exist (${count}), skipping.`);
    await mongoose.connection.close();
    return;
  }
  await BlogPost.insertMany(seedBlogPosts);
  console.log(`Inserted ${seedBlogPosts.length} blog posts.`);
  await mongoose.connection.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
