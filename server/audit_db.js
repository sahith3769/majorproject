require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fix for Atlas DNS resolution
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function auditDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const totalUsers = await User.countDocuments();
    const withResume = await User.find({ resume: { $exists: true, $ne: '' } }, 'email name resume');

    console.log(`\n--- DATABASE AUDIT ---`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Resumes: ${withResume.length}`);
    console.log(`----------------------\n`);

    const stats = {
      newFormat: 0,
      legacyFilename: 0,
      missingPrefix: 0,
      other: 0
    };

    withResume.forEach(user => {
      const resume = user.resume;
      let status = '';
      
      if (/^data:.+;base64,.+/.test(resume)) {
        stats.newFormat++;
        status = 'VALID (NEW FORMAT)';
      } else if (resume.length < 100 && (resume.endsWith('.pdf') || resume.endsWith('.doc') || resume.endsWith('.docx'))) {
        stats.legacyFilename++;
        status = 'LEGACY (FILENAME - GONE ON RENDER)';
      } else if (resume.length > 100 && !resume.startsWith('data:')) {
        stats.missingPrefix++;
        status = 'INCOMPLETE (BASE64 MISSING PREFIX)';
      } else {
        stats.other++;
        status = 'UNKNOWN / INVALID';
      }

      console.log(`User: ${user.email.padEnd(40)} | Status: ${status}`);
    });

    console.log(`\n--- SUMMARY ---`);
    console.log(`Valid Base64:      ${stats.newFormat}`);
    console.log(`Legacy Filenames:  ${stats.legacyFilename}`);
    console.log(`Missing Prefixes:  ${stats.missingPrefix}`);
    console.log(`Other:             ${stats.other}`);
    console.log(`---------------\n`);

    if (stats.missingPrefix > 0 || stats.legacyFilename > 0) {
      console.log('TIP: Users with Legacy Filenames MUST re-upload.');
      console.log('TIP: I can potentially fix the "Missing Prefix" ones automatically if you wish.');
    }

  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

auditDatabase();
