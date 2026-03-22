FROM python:3.10

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Run the Flask app with Gunicorn on the exposed port
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
