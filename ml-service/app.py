import os
import logging
import re
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from pdfminer.high_level import extract_text

# ==========================================
# SYSTEM SETUP & INITIALIZATION
# ==========================================
# Load environment variables (like PORT) from the .env file into the system
load_dotenv()

# Set up logging to track when requests come in or fail.
# INFO level means it will print standard operational messages to the console.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the Flask application instance. Flask acts as our API Gateway for the Python microservice.
app = Flask(__name__)

# ==========================================
# ENDPOINT: JOB RECOMMENDATION ENGINE
# ==========================================
@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        # 1. PARSE INCOMING DATA
        # We expect a JSON payload containing the student's skills and a list of available jobs.
        data = request.get_json()
        if not data:
            logger.warning("Request body is empty or not valid JSON")
            return jsonify({"error": "Invalid input, JSON expected"}), 400

        if "skills" not in data or "jobs" not in data:
            logger.warning("Missing 'skills' or 'jobs' in request data")
            return jsonify({"error": "Missing 'skills' or 'jobs' in request body"}), 400

        # 2. PREPARE THE STUDENT PROFILE
        # Convert the student's skill array into a single lowercase string. 
        # Example: ["React", "Node"] becomes "react node".
        # This string will act as Document A for our Machine Learning algorithm.
        student_skills_list = [skill.strip().lower() for skill in data["skills"]]
        student_profile_text = " ".join(student_skills_list)
        
        # If the student has zero valid skills, we cannot make a recommendation. Return empty.
        if not student_profile_text:
            return jsonify([])

        jobs = data["jobs"]
        if not jobs:
            return jsonify([])

        # 3. PREPARE THE JOB PROFILES (CORPUS GENERATION)
        # We need to translate every job into a string formatted document (Document B, C, D...)
        job_feature_texts = []
        valid_jobs = []

        for job in jobs:
            # Extract the raw array of required skills for this specific job
            job_skills_list = [s.strip().lower() for s in job.get("skillsRequired", [])]
            
            # Create a rich text document for the job by combining its skills, title, description, and experience.
            # This gives the ML algorithm maximum context to calculate similarity.
            job_text = " ".join(job_skills_list) + " " + job.get("title", "").lower() + " " + job.get("description", "").lower() + " " + job.get("experience", "").lower()
            
            job_feature_texts.append(job_text)
            
            # Keep a reference to the original job object and its skills as a Set for exact mathematical comparisons later.
            valid_jobs.append({
                "original_job": job,
                "job_skills_set": set(job_skills_list)
            })

        # 4. MACHINE LEARNING: TF-IDF VECTORIZATION
        # Import our ML tools from the scikit-learn library
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        # Combine the Student text and all Job texts into one array called a "Corpus"
        # The algorithm needs to view all text together to understand which words are common and which are rare.
        corpus = [student_profile_text] + job_feature_texts
        
        # Initialize the TF-IDF tool. We tell it to ignore "english stop words" (like "the", "and", "a") 
        # because those words carry no technical meaning.
        vectorizer = TfidfVectorizer(stop_words='english')
        
        # Fit & Transform: This executes the complex math, converting our English text into numerical arrays (vectors).
        tfidf_matrix = vectorizer.fit_transform(corpus)

        # 5. MACHINE LEARNING: COSINE SIMILARITY
        # Separate the vectors back out. 
        # The 0th index is the student. Everything else is a job.
        student_vector = tfidf_matrix[0]
        job_vectors = tfidf_matrix[1:]

        # Calculate Cosine Similarity: This measures the mathematical angle between the Student's vector 
        # and every Job's vector. It returns a matrix of confidence scores between 0.0 and 1.0.
        similarity_scores = cosine_similarity(student_vector, job_vectors).flatten()

        # 6. FILTERING & RESULT GENERATION
        matched_jobs = []
        
        # Convert student skills into a Python Set for fast O(1) mathematical intersections
        student_skills_set = set(student_skills_list)

        # Loop through every calculated score
        for i, score in enumerate(similarity_scores):
            # Strict Filter: If the score is 0.05 or lower, the job is not relevant enough. Throw it away.
            if score > 0.05: 
                job_data = valid_jobs[i]
                original_job = job_data["original_job"]
                job_skills_set = job_data["job_skills_set"]
                
                # SET INTERSECTION: Exactly which skills match between student and job? 
                # Used by the frontend UI to display "Matched Skills" badges.
                exact_matches = student_skills_set.intersection(job_skills_set)
                
                # LIST COMPREHENSION: Which skills does the job need that the student is missing?
                missing_skills = [s for s in job_skills_list if s not in student_skills_set]

                matched_jobs.append({
                    "_id": original_job.get("_id"),
                    "title": original_job.get("title", "Unknown Title"),
                    "description": original_job.get("description", ""),
                    "salary": original_job.get("salary", "N/A"),
                    "experience": original_job.get("experience", ""),
                    "matchedSkills": list(exact_matches),
                    "missingSkills": missing_skills,
                    "matchScore": float(score),       # The actual Machine Learning confidence percentage
                    "matchCount": len(exact_matches)  # Simple integer count of matches
                })

        # 7. SORTING RESULTS
        # Sort the passed jobs in descending order (highest ML Match Score appears first).
        matched_jobs = sorted(
            matched_jobs,
            key=lambda x: x["matchScore"],
            reverse=True
        )
        
        logger.info(f"ML Recommendation successful: {len(matched_jobs)} jobs matched.")
        return jsonify(matched_jobs)

    except Exception as e:
        logger.error(f"Error processing recommendation request: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

# ==========================================
# ENDPOINT: HEALTH CHECK
# ==========================================
@app.route("/", methods=["GET"])
def home():
    # Simple route to verify the Docker container or server is online
    return "ML Skill Matching Server Running"

# ==========================================
# ENDPOINT: PDF RESUME PARSING / SKILL EXTRACTION
# ==========================================
@app.route("/analyze-resume", methods=["POST"])
def analyze_resume():
    try:
        # 1. FILE UPLOAD HANDLING
        # Ensure the client actually sent a file attached to the form-data key "resume"
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files['resume']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Save the file temporarily. We use /tmp because many cloud hosting providers 
        # make all other directories Read-Only for security reasons.
        temp_path = os.path.join("/tmp", file.filename)
        os.makedirs("/tmp", exist_ok=True)
        file.save(temp_path)

        # 2. PDF TEXT EXTRACTION
        # Pass the file path to PDFMiner, which strips out formatting and returns raw readable text strings.
        text = extract_text(temp_path)
        
        # Delete the temp file to save server storage space
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not text:
            return jsonify({"error": "Could not extract text from resume"}), 400

        # 3. STATIC KNOWLEDGE BASE
        # A hardcoded dictionary of industry-standard tech skills. 
        # In a massive enterprise app, this would be queried from a database instead.
        SKILLS_DB = [
            "python", "javascript", "java", "react", "node.js", "node", "express", "mongodb",
            "sql", "mysql", "postgresql", "html", "css", "git", "docker", "aws", "azure",
            "machine learning", "deep learning", "data science", "nlp", "flask", "django",
            "c++", "c#", "php", "typescript", "angular", "vue", "tailwind", "bootstap",
            "redux", "rest api", "graphql", "kubernetes", "jenkins", "terraform"
        ]
        
        text_lower = text.lower()
        extracted_skills = []
        
        # 4. REGULAR EXPRESSION (RegEx) MATCHING
        # Loop through every skill in our database
        for skill in SKILLS_DB:
            # We construct a Regex pattern using "\b" (Word Boundaries)
            # "\b" ensures we only match whole words. Without it, searching for "git" 
            # would falsely trigger on words like "digital" or "legitimate".
            pattern = r'\b' + re.escape(skill) + r'\b'
            
            # If the RegEx finds a match in the student's text, add it to our extracted list
            if re.search(pattern, text_lower):
                extracted_skills.append(skill)

        # 5. CLEANUP
        # Cast the array to a Python Set to instantly remove any duplicate values
        # then cast it back to a List to be JSON serializable.
        extracted_skills = list(set(extracted_skills))
        
        logger.info(f"Resume analysis successful: {len(extracted_skills)} skills found.")
        return jsonify({"skills": extracted_skills})

    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        return jsonify({"error": "Internal Server Error during analysis"}), 500

# ==========================================
# SERVER BOOTSTRAPPING
# ==========================================
if __name__ == "__main__":
    # Get the port from the environment, defaulting to 5001 to avoid clashing with the Node server on 5000.
    port = int(os.environ.get("PORT", 5001))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    
    logger.info(f"Starting ML Service on port {port}")
    # host="0.0.0.0" allows the app to be accessible externally (required for Docker/Cloud deployments)
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
