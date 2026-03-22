require("dotenv").config({ path: "../.env" });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'cseplacement7@gmail.com' });
    if (user) {
      const isMatch = await bcrypt.compare('admin123', user.password);
      console.log('Password Match:', isMatch);
    } else {
      console.log('User not found');
    }
    process.exit();
}).catch(console.error);
