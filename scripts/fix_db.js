require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const fixDatabase = async () => {
  console.log("=========================================");
  console.log("   MongoDB DuplicateKeyError Fixer       ");
  console.log("=========================================\n");

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    console.log("1. Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("   ✅ Connected to database.\n");

    console.log("2. Searching for conflicting duplicates (empty usernames, duplicate emails, duplicate usernames)...");
    
    // Find all users
    const users = await User.find({}).lean();
    console.log(`   Found ${users.length} total users.`);

    const emailSet = new Set();
    const usernameSet = new Set();
    const toDelete = [];

    // Prioritize users who are VERIFIED to keep them, and delete unverified duplicates
    // Start by sorting so verified users are processed first
    users.sort((a, b) => b.isVerified - a.isVerified);

    for (const user of users) {
      let markDelete = false;
      let reason = "";

      // Empty username (not null, but "") causes duplicates!
      if (user.username === "") {
        markDelete = true;
        reason = "Empty username ('') violates unique index.";
      }
      
      if (!markDelete && emailSet.has(user.email)) {
        markDelete = true;
        reason = `Duplicate email (${user.email}).`;
      }
      
      if (!markDelete && user.username && usernameSet.has(user.username)) {
        markDelete = true;
        reason = `Duplicate username (${user.username}).`;
      }

      if (markDelete) {
        toDelete.push({ id: user._id, email: user.email, reason });
      } else {
        emailSet.add(user.email);
        if (user.username) {
            usernameSet.add(user.username);
        }
      }
    }

    if (toDelete.length > 0) {
      console.log(`   Found ${toDelete.length} duplicates/invalid entries.`);
      for (const d of toDelete) {
        console.log(`     - Deleting User ID: ${d.id} | Email: ${d.email} | Reason: ${d.reason}`);
        await User.deleteOne({ _id: d.id });
      }
      console.log("   ✅ Deleted conflicting users.\n");
    } else {
      console.log("   ✅ No conflicting duplicates found.\n");
    }

    console.log("3. Rebuilding MongoDB Indexes for 'users' collection...");
    try {
      // Drop ALL indexes to clean up any broken ones
      await User.collection.dropIndexes();
      console.log("   - Dropped existing indexes.");
    } catch (e) {
        if (e.codeName === 'NamespaceNotFound') {
             console.log("   - Collection does not exist yet (no indexes to drop).");
        } else {
             console.log(`   - Could not drop indexes: ${e.message}`);
        }
    }
    
    // Force mongoose to re-create the indexes defined in the schema
    await User.syncIndexes();
    console.log("   ✅ Synced new indexes successfully (DuplicateKeyError fixed).\n");

    console.log("🎉 ALL DONE! The deployment DuplicateKeyError should now be fully resolved.");
    process.exit(0);

  } catch (err) {
    console.error(`\n❌ SCRIPT FAILED:`, err);
    process.exit(1);
  }
};

fixDatabase();
