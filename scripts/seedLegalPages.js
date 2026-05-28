/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const LegalPage = require("../models/LegalPage");
const legalPages = require("../data/seedLegalPages");

async function run() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required");
  }
  await mongoose.connect(process.env.MONGO_URL);

  for (const page of legalPages) {
    await LegalPage.findOneAndUpdate(
      { slug: page.slug },
      { $set: page },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded legal page: ${page.slug}`);
  }

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
