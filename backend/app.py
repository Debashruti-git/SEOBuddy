from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import textstat
from collections import Counter
import string

# Download NLTK data (runs once, then uses cached version)
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)
from nltk.corpus import stopwords

app = Flask(__name__)
CORS(app)  # Allows React (port 3000) to call Flask (port 5000)

#Analysing function

STOP_WORDS = set(stopwords.words('english'))
def analyse_text(text):
    # Lowercase and remove punctuation, then split into words
    text_lower = text.lower()
    tokens = text_lower.translate(
        str.maketrans('', '', string.punctuation)
    ).split()

    total_words = len(tokens)

    # Remove stop words — keeps only meaningful keywords
    keywords = [
        w for w in tokens
        if w not in STOP_WORDS and len(w) > 2
    ]

    # Count how often each keyword appears
    freq = Counter(keywords)
    top_keywords = freq.most_common(15)  # Top 15 only

    # Build the keyword data with density percentages
    keyword_data = [
        {
            "word": word,
            "count": count,
            "density": round((count / total_words) * 100, 2)
        }
        for word, count in top_keywords
    ]

    # Readability scores via textstat library
    flesch = textstat.flesch_reading_ease(text)
    grade  = textstat.flesch_kincaid_grade(text)

    # Human-readable label based on Flesch score
    if flesch >= 70:   readability_label = 'Easy'
    elif flesch >= 50: readability_label = 'Moderate'
    else:              readability_label = 'Difficult'

    return {
        "total_words": total_words,
        "unique_keywords": len(freq),
        "flesch_score": round(flesch, 1),
        "grade_level": round(grade, 1),
        "readability_label": readability_label,
        "keywords": keyword_data,
        "sentences": textstat.sentence_count(text),
        "avg_sentence_length": round(
            total_words / max(textstat.sentence_count(text), 1), 1
        )
    }

# The API endpoint
@app.route('/analyse', methods=['POST'])
def analyse():
    data = request.get_json()
    text = data.get('text', '').strip()

    # Validation — reject empty or very short text
    if not text or len(text.split()) < 10:
        return jsonify({
            "error": "Please enter at least 10 words."
        }), 400

    result = analyse_text(text)
    return jsonify(result)  # Sends JSON back to React


if __name__ == "__main__":
    app.run(debug=True)  # debug=True auto-reloads on code changes

