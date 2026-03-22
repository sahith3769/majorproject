const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    console.log('Testing MONGO_URI...');
    console.log('URI:', process.env.MONGO_URI ? 'FOUND' : 'MISSING');
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

test();
