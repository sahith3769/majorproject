import os
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()
        if not data:
            logger.warning("Request body is empty or not valid JSON")
            return jsonify({"error": "Invalid input, JSON expected"}), 400

        if "skills" not in data or "jobs" not in data:
            logger.warning("Missing 'skills' or 'jobs' in request data")
            return jsonify({"error": "Missing 'skills' or 'jobs' in request body"}), 400

        # 1. Prepare User Profile
        student_skills_list = [skill.strip().lower() for skill in data["skills"]]
        student_profile_text = " ".join(student_skills_list)
        
        # If student has no skills, return empty or handle gracefully
        if not student_profile_text:
            return jsonify([])

        jobs = data["jobs"]
        if not jobs:
            return jsonify([])

        # 2. Prepare Job Profiles (Corpus)
        job_feature_texts = []
        valid_jobs = []

        for job in jobs:
            # We combine title, description, and skills for a rich feature set
            # or just skills if we want strictly skill-based matching.
            # Let's use skills + title for better context (e.g., "Frontend" title helps).
            
            job_skills_list = [s.strip().lower() for s in job.get("skillsRequired", [])]
            
            # Textual representation of the job for the ML model
            # giving more weight to skills by repeating them? No, standard TF-IDF is fine.
            job_text = " ".join(job_skills_list) + " " + job.get("title", "").lower() + " " + job.get("description", "").lower()
            
            job_feature_texts.append(job_text)
            valid_jobs.append({
                "original_job": job,
                "job_skills_set": set(job_skills_list)
            })

        # 3. Apply TF-IDF (Term Frequency - Inverse Document Frequency)
        # We create a corpus containing the Student Profile + All Jobs
        # ideally we fit on a large dataset, but for this runtime recommendation, 
        # fitting on the current batch is acceptable for a "Content-Based" filter 
        # specifically comparing this student to these jobs.
        
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        # Combine student text with job texts to build local vocabulary
        corpus = [student_profile_text] + job_feature_texts
        
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)

        # 4. Compute Cosine Similarity
        # The first vector (index 0) is the Student
        # The rest (index 1 to N) are the Jobs
        student_vector = tfidf_matrix[0]
        job_vectors = tfidf_matrix[1:]

        # cosine_similarity returns a matrix, we want the first row comparing student to all jobs
        similarity_scores = cosine_similarity(student_vector, job_vectors).flatten()

        # 5. Build Result
        matched_jobs = []
        student_skills_set = set(student_skills_list)

        for i, score in enumerate(similarity_scores):
            # Filter out non-matches or very low matches if desired, 
            # currently keeping > 0, or we can set a threshold like 0.1
            if score > 0.05: 
                job_data = valid_jobs[i]
                original_job = job_data["original_job"]
                job_skills_set = job_data["job_skills_set"]
                
                # We still calculate exact keyword matches for the UI to display "Matched: Python, React"
                exact_matches = student_skills_set.intersection(job_skills_set)

                matched_jobs.append({
                    "_id": original_job.get("_id"),
                    "title": original_job.get("title", "Unknown Title"),
                    "description": original_job.get("description", ""),
                    "matchedSkills": list(exact_matches),
                    "matchScore": float(score), # ML confidence score
                    "matchCount": len(exact_matches) # Legacy support
                })

        # Sort by ML Match Score (descending)
        matched_jobs = sorted(
            matched_jobs,
            key=lambda x: x["matchScore"],
            reverse=True
        )
        
        logger.info(f"ML Recommendation successful: {len(matched_jobs)} jobs matched.")
        return jsonify(matched_jobs)

    except Exception as e:
        logger.error(f"Error processing recommendation request: {str(e)}")
        # Fallback? No, just report error
        return jsonify({"error": "Internal Server Error"}), 500


@app.route("/", methods=["GET"])
def home():
    return "ML Skill Matching Server Running"


if __name__ == "__main__":
    # Use environment variable for port, default to 5001
    port = int(os.environ.get("PORT", 5001))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    
    logger.info(f"Starting ML Service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
