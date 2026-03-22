const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Job = require("./models/Job");
const bcrypt = require("bcryptjs"); // Fixed import
const connectDB = require("./config/db");

// Load Environment Variables
dotenv.config();

// Sample Data
const students = [
    {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "password123",
        role: "student",
        skills: ["Python", "Machine Learning", "Data Analysis"],
        isVerified: true
    },
    {
        name: "Bob Smith",
        email: "bob@example.com",
        password: "password123",
        role: "student",
        skills: ["React", "JavaScript", "Node.js"],
        isVerified: true
    }
];

const companies = [
    {
        name: "Tech Corp",
        email: "hr@techcorp.com",
        password: "password123",
        role: "company",
        isVerified: true,
        approved: true
    },
    {
        name: "Innovate AI",
        email: "careers@innovate.ai",
        password: "password123",
        role: "company",
        isVerified: true,
        approved: true
    }
];

const jobs = [
    {
        title: "Junior Data Scientist",
        description: "Looking for a python expert to join our ML team.",
        skillsRequired: ["Python", "Machine Learning"],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
        title: "Frontend Developer",
        description: "Join our frontend team to build amazing UIs using React.",
        skillsRequired: ["React", "JavaScript", "HTML/CSS"],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
];

const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Job.deleteMany();

        console.log("Existing Data Cleared...");

        // Create Students
        const studentUsers = [];
        for (const student of students) {
            const hashedPassword = await bcrypt.hash(student.password, 10);
            studentUsers.push({ ...student, password: hashedPassword });
        }
        const createdStudents = await User.insertMany(studentUsers);

        // Create Companies
        const companyUsers = [];
        for (const company of companies) {
            const hashedPassword = await bcrypt.hash(company.password, 10);
            companyUsers.push({ ...company, password: hashedPassword });
        }
        const createdCompanies = await User.insertMany(companyUsers);

        // Create Jobs (Assign to first company)
        const companyId = createdCompanies[0]._id;
        const jobList = jobs.map(job => ({ ...job, company: companyId }));

        await Job.insertMany(jobList);

        console.log("Data Imported Successfully!");
        console.log("-----------------------------------");
        console.log("Student Login: alice@example.com / password123");
        console.log("Company Login: hr@techcorp.com / password123");
        console.log("-----------------------------------");

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
