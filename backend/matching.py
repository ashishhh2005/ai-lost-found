from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime


# ============================================================
# AI MODEL
# ============================================================

model = None


def get_model():
    global model

    if model is None:
        print("Loading AI model...")

        model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            device="cpu"
        )

        print("AI model loaded successfully!")

    return model


# ============================================================
# TEXT SIMILARITY
# ============================================================

def calculate_text_similarity(text1, text2):

    if not text1 or not text2:
        return 0.0

    text1 = str(text1).strip()
    text2 = str(text2).strip()

    if not text1 or not text2:
        return 0.0

    ai_model = get_model()

    embeddings = ai_model.encode(
        [text1, text2],
        batch_size=2,
        show_progress_bar=False,
        convert_to_numpy=True
    )

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    return float(
        max(
            0.0,
            min(1.0, similarity)
        )
    )


# ============================================================
# ITEM NAME SIMILARITY
# ============================================================

def calculate_item_name_similarity(item1, item2):

    if not item1 or not item2:
        return 0.0

    item1 = str(item1).strip().lower()
    item2 = str(item2).strip().lower()

    if not item1 or not item2:
        return 0.0

    if item1 == item2:
        return 1.0

    return calculate_text_similarity(
        item1,
        item2
    )


# ============================================================
# LOCATION SIMILARITY
# ============================================================

def calculate_location_similarity(
    location1,
    location2
):

    if not location1 or not location2:
        return 0.0

    location1 = str(location1).strip().lower()
    location2 = str(location2).strip().lower()

    if not location1 or not location2:
        return 0.0

    if location1 == location2:
        return 1.0

    words1 = set(location1.split())
    words2 = set(location2.split())

    if words1 and words2:

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        word_similarity = (
            len(intersection) / len(union)
        )

    else:

        word_similarity = 0.0

    semantic_similarity = calculate_text_similarity(
        location1,
        location2
    )

    score = (
        word_similarity * 0.4
        +
        semantic_similarity * 0.6
    )

    return float(
        max(
            0.0,
            min(1.0, score)
        )
    )


# ============================================================
# TIME PARSER
# ============================================================

def parse_datetime(
    date_value,
    time_value
):

    if not date_value or not time_value:
        return None

    date_string = str(date_value).strip()
    time_string = str(time_value).strip()

    if len(time_string) >= 8:

        try:

            time_string = datetime.strptime(
                time_string,
                "%H:%M:%S"
            ).strftime("%H:%M")

        except ValueError:

            pass

    try:

        return datetime.strptime(
            f"{date_string} {time_string}",
            "%Y-%m-%d %H:%M"
        )

    except ValueError:

        pass

    try:

        return datetime.fromisoformat(
            f"{date_string}T{time_string}"
        )

    except ValueError:

        return None


# ============================================================
# TIME SIMILARITY
# ============================================================

def calculate_time_similarity(
    date1,
    time1,
    date2,
    time2
):

    datetime1 = parse_datetime(
        date1,
        time1
    )

    datetime2 = parse_datetime(
        date2,
        time2
    )

    if datetime1 is None or datetime2 is None:

        print(
            "Time parsing failed:",
            date1,
            time1,
            date2,
            time2
        )

        return 0.0

    difference = abs(
        (
            datetime1 - datetime2
        ).total_seconds()
    )

    hours_difference = (
        difference / 3600
    )

    if hours_difference <= 1:

        return 1.0

    elif hours_difference <= 6:

        return 0.9

    elif hours_difference <= 12:

        return 0.75

    elif hours_difference <= 24:

        return 0.6

    elif hours_difference <= 48:

        return 0.4

    elif hours_difference <= 168:

        return 0.2

    else:

        return 0.0


# ============================================================
# FINAL AI SCORE
# ============================================================

def calculate_final_score(
    item_name_score,
    text_score,
    location_score,
    time_score
):

    item_name_weight = 0.30
    text_weight = 0.35
    location_weight = 0.20
    time_weight = 0.15

    final_score = (

        item_name_score * item_name_weight

        +

        text_score * text_weight

        +

        location_score * location_weight

        +

        time_score * time_weight

    )

    return float(
        max(
            0.0,
            min(1.0, final_score)
        )
    )