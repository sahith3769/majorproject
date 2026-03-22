import os
import sys
from huggingface_hub import HfApi, whoami, create_repo

token = os.getenv("HF_TOKEN") or "YOUR_TOKEN_HERE"
api = HfApi(token=token)

try:
    user_info = whoami(token=token)
    username = user_info["name"]
    print(f"Logged in as: {username}")
except Exception as e:
    print(f"Failed to authenticate: {e}")
    sys.exit(1)

repo_id = f"{username}/smart-placement-ml"

try:
    print(f"Checking if space {repo_id} exists...")
    api.repo_info(repo_id, repo_type="space")
    print("Space exists.")
except Exception:
    print(f"Space doesn't exist. Creating {repo_id} as a Docker Space...")
    create_repo(repo_id, repo_type="space", space_sdk="docker", private=False, token=token)
    print("Space created successfully.")

print(f"Uploading ml-service folder to {repo_id}...")
try:
    # Use upload_folder to sync local folder directly
    api.upload_folder(
        folder_path="ml-service",
        repo_id=repo_id,
        repo_type="space",
        commit_message="Initial deployment from local environment",
        ignore_patterns=["venv/*", "venv/**", "__pycache__/*", "*.pyc", ".env"],
        token=token
    )
    print("\n" + "="*50)
    print("🎉 DEPLOYMENT SUCCESSFUL! 🎉")
    print(f"Your Space is now building: https://huggingface.co/spaces/{repo_id}")
    print("\n👉 COPY THIS URL FOR RENDER'S ML_SERVICE_URL: 👈")
    print(f"https://{username}-smart-placement-ml.hf.space")
    print("="*50)
except Exception as e:
    print(f"Failed to upload: {e}")
    sys.exit(1)
