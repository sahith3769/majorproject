const mongoose = require("mongoose");
const Job = require("./models/Job");
const User = require("./models/User");

// Read from .env manually or hardcode the connection string from local .env
require("dotenv").config();

async function checkJobs() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB:", process.env.MONGO_URI.substring(0, 20) + "...");

    const jobs = await Job.find({}).populate("company", "name email").lean();
    console.log(`Found ${jobs.length} total jobs.`);
    
    if (jobs.length > 0) {
      console.log("Sample Job 1:", JSON.stringify(jobs[0], null, 2));
      const missingCompany = jobs.filter(j => !j.company || !j.company.name);
      console.log(`Jobs with missing company names: ${missingCompany.length}`);
      if (missingCompany.length > 0) {
         console.log("Example missing:", missingCompany[0]);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkJobs();
