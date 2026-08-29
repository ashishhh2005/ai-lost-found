from datetime import datetime
import re
import math


# ============================================================
# LIGHTWEIGHT AI TEXT MATCHING
# ============================================================
#
# This version is designed for low-memory cloud deployment.
# It does NOT load SentenceTransformer/PyTorch.
#
# It uses:
#   - token similarity
#   - keyword overlap
#   - character similarity
#   - location similarity
#   - time similarity
#
# This keeps the backend well below Render's memory limit.
# ============================================================


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text):
    if not text:
        return ""

    text = str(text).lower().strip()

    # Remove punctuation
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text


# ============================================================
# TOKENIZATION
# ============================================================

def get_tokens(text):
    normalized = normalize_text(text)

    if not normalized:
        return set()

    return set(normalized.split())


# ============================================================
# JACCARD SIMILARITY
# ============================================================

def jaccard_similarity(text1, text2):

    tokens1 = get_tokens(text1)
    tokens2 = get_tokens(text2)

    if not tokens1 or not tokens2:
        return 0.0

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)

    if not union:
        return 0.0

    return len(intersection) / len(union)


# ============================================================
# CHARACTER SIMILARITY
# ============================================================

def character_similarity(text1, text2):

    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0.0

    if text1 == text2:
        return 1.0

    # Lightweight dynamic programming
    # for edit-distance similarity.
    #
    # We only keep two rows in memory.
    len1 = len(text1)
    len2 = len(text2)

    if len1 > 200:
        text1 = text1[:200]
        len1 = 200

    if len2 > 200:
        text2 = text2[:200]
        len2 = 200

    previous = list(range(len2 + 1))

    for i in range(1, len1 + 1):

        current = [i]

        for j in range(1, len2 + 1):

            insertion = current[j - 1] + 1

            deletion = previous[j] + 1

            replacement = previous[j - 1]

            if text1[i - 1] != text2[j - 1]:
                replacement += 1

            current.append(
                min(
                    insertion,
                    deletion,
                    replacement
                )
            )

        previous = current

    distance = previous[len2]

    max_length = max(len1, len2)

    if max_length == 0:
        return 1.0

    return max(
        0.0,
        1.0 - (distance / max_length)
    )


# ============================================================
# TEXT SIMILARITY
# ============================================================

def calculate_text_similarity(text1, text2):

    if not text1 or not text2:
        return 0.0

    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0.0

    if text1 == text2:
        return 1.0

    # Token overlap
    token_score = jaccard_similarity(
        text1,
        text2
    )

    # Character similarity
    character_score = character_similarity(
        text1,
        text2
    )

    # Give more importance to actual words.
    final_score = (
        token_score * 0.65
        +
        character_score * 0.35
    )

    return float(
        max(
            0.0,
            min(1.0, final_score)
        )
    )


# ============================================================
# ITEM NAME SIMILARITY
# ============================================================

def calculate_item_name_similarity(item1, item2):

    if not item1 or not item2:
        return 0.0

    item1 = normalize_text(item1)
    item2 = normalize_text(item2)

    if not item1 or not item2:
        return 0.0

    if item1 == item2:
        return 1.0

    # Token similarity
    token_score = jaccard_similarity(
        item1,
        item2
    )

    # Character similarity
    character_score = character_similarity(
        item1,
        item2
    )

    final_score = (
        token_score * 0.70
        +
        character_score * 0.30
    )

    return float(
        max(
            0.0,
            min(1.0, final_score)
        )
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

    location1 = normalize_text(location1)
    location2 = normalize_text(location2)

    if not location1 or not location2:
        return 0.0

    if location1 == location2:
        return 1.0

    token_score = jaccard_similarity(
        location1,
        location2
    )

    character_score = character_similarity(
        location1,
        location2
    )

    final_score = (
        token_score * 0.70
        +
        character_score * 0.30
    )

    return float(
        max(
            0.0,
            min(1.0, final_score)
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

    # --------------------------------------------------------
    # Normalize seconds
    # --------------------------------------------------------

    if len(time_string) >= 8:

        try:

            time_string = datetime.strptime(
                time_string,
                "%H:%M:%S"
            ).strftime("%H:%M")

        except ValueError:

            pass

    # --------------------------------------------------------
    # Standard format
    # --------------------------------------------------------

    try:

        return datetime.strptime(
            f"{date_string} {time_string}",
            "%Y-%m-%d %H:%M"
        )

    except ValueError:

        pass

    # --------------------------------------------------------
    # ISO format
    # --------------------------------------------------------

    try:

        return datetime.fromisoformat(
            f"{date_string}T{time_string}"
        )

    except ValueError:

        pass

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

    # --------------------------------------------------------
    # WEIGHTS
    # --------------------------------------------------------

    item_name_weight = 0.30
    text_weight = 0.35
    location_weight = 0.20
    time_weight = 0.15

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

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