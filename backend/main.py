from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import SessionLocal, engine

from backend.models import (
    LostItem,
    FoundItem,
    ConfirmedMatch
)

from backend.matching import (
    calculate_text_similarity,
    calculate_item_name_similarity,
    calculate_location_similarity,
    calculate_time_similarity,
    calculate_final_score
)


# =========================================
# CREATE DATABASE TABLES
# =========================================

LostItem.metadata.create_all(bind=engine)
FoundItem.metadata.create_all(bind=engine)
ConfirmedMatch.metadata.create_all(bind=engine)


# =========================================
# CREATE FASTAPI APP
# =========================================

app = FastAPI(
    title="AI Lost & Found API",
    description="AI-powered Lost and Found matching system",
    version="1.0.0"
)


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# REQUEST MODELS
# =========================================

class LostItemRequest(BaseModel):
    item_name: str
    description: str
    location: str
    date: str
    time: str


class FoundItemRequest(BaseModel):
    item_name: str
    description: str
    location: str
    date: str
    time: str
    contact: str


class ConfirmMatchRequest(BaseModel):
    lost_item_id: int
    found_item_id: int


class UpdateStatusRequest(BaseModel):
    status: str


# =========================================
# DATABASE CONNECTION
# =========================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================
# HOME API
# =========================================

@app.get("/")
def home():

    return {
        "message": "AI Lost & Found Backend is running!"
    }


# =========================================
# REPORT LOST ITEM
# =========================================

@app.post("/report-lost")
def report_lost(
    item: LostItemRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # CHECK FOR DUPLICATE LOST ITEM
    # -----------------------------------------

    existing_item = (
        db.query(LostItem)
        .filter(
            LostItem.item_name == item.item_name,
            LostItem.description == item.description,
            LostItem.location == item.location,
            LostItem.date == item.date,
            LostItem.time == item.time
        )
        .first()
    )

    if existing_item:

        return {
            "success": True,
            "duplicate": True,
            "message": "This lost item has already been reported.",
            "item": {
                "id": existing_item.id,
                "item_name": existing_item.item_name,
                "description": existing_item.description,
                "location": existing_item.location,
                "date": existing_item.date,
                "time": existing_item.time
            }
        }

    # -----------------------------------------
    # CREATE NEW LOST ITEM
    # -----------------------------------------

    new_item = LostItem(
        item_name=item.item_name,
        description=item.description,
        location=item.location,
        date=item.date,
        time=item.time
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "success": True,
        "duplicate": False,
        "message": "Lost item reported successfully",
        "item": {
            "id": new_item.id,
            "item_name": new_item.item_name,
            "description": new_item.description,
            "location": new_item.location,
            "date": new_item.date,
            "time": new_item.time
        }
    }


# =========================================
# GET LATEST LOST ITEM
# =========================================
#
# This endpoint is used by the React frontend
# to recover the latest lost item ID.
#
# Example:
# GET /lost-items/latest
#
# =========================================

@app.get("/lost-items/latest")
def get_latest_lost_item(
    db: Session = Depends(get_db)
):

    latest_item = (
        db.query(LostItem)
        .order_by(LostItem.id.desc())
        .first()
    )

    # -----------------------------------------
    # NO LOST ITEMS
    # -----------------------------------------

    if not latest_item:

        return {
            "success": False,
            "item": None
        }

    # -----------------------------------------
    # RETURN LATEST LOST ITEM
    # -----------------------------------------

    return {
        "success": True,
        "item": {
            "id": latest_item.id,
            "item_name": latest_item.item_name,
            "description": latest_item.description,
            "location": latest_item.location,
            "date": latest_item.date,
            "time": latest_item.time
        }
    }


# =========================================
# REPORT FOUND ITEM
# =========================================

@app.post("/report-found")
def report_found(
    item: FoundItemRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # CHECK FOR DUPLICATE FOUND ITEM
    # -----------------------------------------

    existing_item = (
        db.query(FoundItem)
        .filter(
            FoundItem.item_name == item.item_name,
            FoundItem.description == item.description,
            FoundItem.location == item.location,
            FoundItem.date == item.date,
            FoundItem.time == item.time,
            FoundItem.contact == item.contact
        )
        .first()
    )

    if existing_item:

        return {
            "success": True,
            "duplicate": True,
            "message": "This found item has already been reported.",
            "item": {
                "id": existing_item.id,
                "item_name": existing_item.item_name,
                "description": existing_item.description,
                "location": existing_item.location,
                "date": existing_item.date,
                "time": existing_item.time,
                "contact": existing_item.contact
            }
        }

    # -----------------------------------------
    # CREATE NEW FOUND ITEM
    # -----------------------------------------

    new_item = FoundItem(
        item_name=item.item_name,
        description=item.description,
        location=item.location,
        date=item.date,
        time=item.time,
        contact=item.contact
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "success": True,
        "duplicate": False,
        "message": "Found item reported successfully",
        "item": {
            "id": new_item.id,
            "item_name": new_item.item_name,
            "description": new_item.description,
            "location": new_item.location,
            "date": new_item.date,
            "time": new_item.time,
            "contact": new_item.contact
        }
    }


# =========================================
# FIND MATCHING FOUND ITEMS
# =========================================

@app.get("/matches/{lost_item_id}")
def find_matches(
    lost_item_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # FIND LOST ITEM
    # -----------------------------------------

    lost_item = (
        db.query(LostItem)
        .filter(
            LostItem.id == lost_item_id
        )
        .first()
    )

    if not lost_item:

        return {
            "success": False,
            "error": "Lost item not found",
            "matches": []
        }

    # -----------------------------------------
    # GET ALL FOUND ITEMS
    # -----------------------------------------

    found_items = (
        db.query(FoundItem)
        .order_by(FoundItem.id.asc())
        .all()
    )

    matches = []

    # =========================================
    # REMOVE OLD DUPLICATE DATABASE RECORDS
    # =========================================

    seen_items = set()

    # -----------------------------------------
    # COMPARE ITEMS
    # -----------------------------------------

    for found_item in found_items:

        # =====================================
        # CREATE UNIQUE ITEM KEY
        # =====================================

        item_key = (
            str(found_item.item_name).strip().lower(),
            str(found_item.description).strip().lower(),
            str(found_item.location).strip().lower(),
            str(found_item.date).strip(),
            str(found_item.time).strip(),
            str(found_item.contact).strip().lower()
        )

        # =====================================
        # SKIP DUPLICATE FOUND ITEM
        # =====================================

        if item_key in seen_items:
            continue

        seen_items.add(item_key)

        # =====================================
        # CHECK IF FOUND ITEM HAS BEEN RETURNED
        # =====================================

        already_returned = (
            db.query(ConfirmedMatch)
            .filter(
                ConfirmedMatch.found_item_id == found_item.id,
                ConfirmedMatch.status == "returned"
            )
            .first()
        )

        # -------------------------------------
        # SKIP RETURNED FOUND ITEMS
        # -------------------------------------

        if already_returned:
            continue

        # =====================================
        # ITEM NAME SIMILARITY
        # =====================================

        item_name_score = calculate_item_name_similarity(
            lost_item.item_name,
            found_item.item_name
        )

        # =====================================
        # DESCRIPTION SIMILARITY
        # =====================================

        text_score = calculate_text_similarity(
            lost_item.description,
            found_item.description
        )

        # =====================================
        # LOCATION SIMILARITY
        # =====================================

        location_score = calculate_location_similarity(
            lost_item.location,
            found_item.location
        )

        # =====================================
        # TIME SIMILARITY
        # =====================================

        time_score = calculate_time_similarity(
            lost_item.date,
            lost_item.time,
            found_item.date,
            found_item.time
        )

        # =====================================
        # FINAL AI SCORE
        # =====================================

        final_score = calculate_final_score(
            item_name_score,
            text_score,
            location_score,
            time_score
        )

        # =====================================
        # CONVERT TO PERCENTAGE
        # =====================================

        final_percentage = round(
            final_score * 100,
            2
        )

        # =====================================
        # ONLY SHOW MATCHES >= 40%
        # =====================================

        if final_percentage < 40:
            continue

        # =====================================
        # MATCH LEVEL
        # =====================================

        if final_percentage >= 80:

            match_level = "Excellent Match"

        elif final_percentage >= 60:

            match_level = "Good Match"

        else:

            match_level = "Possible Match"

        # =====================================
        # ADD MATCH
        # =====================================

        matches.append({

            "found_item_id": found_item.id,

            "item_name": found_item.item_name,

            "description": found_item.description,

            "location": found_item.location,

            "date": found_item.date,

            "time": found_item.time,

            "contact": found_item.contact,

            "item_name_score": round(
                item_name_score * 100,
                2
            ),

            "text_score": round(
                text_score * 100,
                2
            ),

            "location_score": round(
                location_score * 100,
                2
            ),

            "time_score": round(
                time_score * 100,
                2
            ),

            "match_score": final_percentage,

            "match_level": match_level
        })

    # =========================================
    # SORT HIGHEST SCORE FIRST
    # =========================================

    matches.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    # =========================================
    # LIMIT RESULTS
    # =========================================

    matches = matches[:10]

    # =========================================
    # RETURN MATCHES
    # =========================================

    return {
        "success": True,
        "lost_item_id": lost_item_id,
        "count": len(matches),
        "matches": matches
    }


# =========================================
# CONFIRM MATCH
# =========================================

@app.post("/confirm-match")
def confirm_match(
    request: ConfirmMatchRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # CHECK LOST ITEM
    # -----------------------------------------

    lost_item = (
        db.query(LostItem)
        .filter(
            LostItem.id == request.lost_item_id
        )
        .first()
    )

    if not lost_item:

        return {
            "success": False,
            "message": "Lost item not found"
        }

    # -----------------------------------------
    # CHECK FOUND ITEM
    # -----------------------------------------

    found_item = (
        db.query(FoundItem)
        .filter(
            FoundItem.id == request.found_item_id
        )
        .first()
    )

    if not found_item:

        return {
            "success": False,
            "message": "Found item not found"
        }

    # -----------------------------------------
    # CHECK EXISTING SAME CONFIRMATION
    # -----------------------------------------

    existing_match = (
        db.query(ConfirmedMatch)
        .filter(
            ConfirmedMatch.lost_item_id == request.lost_item_id,
            ConfirmedMatch.found_item_id == request.found_item_id
        )
        .first()
    )

    # -----------------------------------------
    # SAME MATCH ALREADY CONFIRMED
    # -----------------------------------------

    if existing_match:

        return {
            "success": True,
            "already_confirmed": True,
            "message": "This match has already been confirmed.",
            "confirmation": {
                "id": existing_match.id,
                "lost_item_id": existing_match.lost_item_id,
                "found_item_id": existing_match.found_item_id,
                "contact": existing_match.contact,
                "status": existing_match.status
            }
        }

    # =========================================
    # CHECK IF FOUND ITEM IS ALREADY CLAIMED
    # =========================================

    found_item_already_confirmed = (
        db.query(ConfirmedMatch)
        .filter(
            ConfirmedMatch.found_item_id == request.found_item_id
        )
        .first()
    )

    # -----------------------------------------
    # FOUND ITEM ALREADY CLAIMED
    # -----------------------------------------

    if found_item_already_confirmed:

        return {
            "success": False,
            "already_claimed": True,
            "message":
                "This found item has already been claimed by another lost item.",
            "confirmation": {
                "id": found_item_already_confirmed.id,
                "lost_item_id":
                    found_item_already_confirmed.lost_item_id,
                "found_item_id":
                    found_item_already_confirmed.found_item_id,
                "status":
                    found_item_already_confirmed.status
            }
        }

    # =========================================
    # CREATE NEW CONFIRMATION
    # =========================================

    new_confirmation = ConfirmedMatch(
        lost_item_id=request.lost_item_id,
        found_item_id=request.found_item_id,
        contact=found_item.contact,
        status="confirmed"
    )

    # =========================================
    # SAVE CONFIRMATION
    # =========================================

    try:

        db.add(new_confirmation)

        db.commit()

        db.refresh(new_confirmation)

    except IntegrityError:

        db.rollback()

        existing_match = (
            db.query(ConfirmedMatch)
            .filter(
                ConfirmedMatch.lost_item_id == request.lost_item_id,
                ConfirmedMatch.found_item_id == request.found_item_id
            )
            .first()
        )

        if existing_match:

            return {
                "success": True,
                "already_confirmed": True,
                "message":
                    "This match has already been confirmed.",
                "confirmation": {
                    "id": existing_match.id,
                    "lost_item_id":
                        existing_match.lost_item_id,
                    "found_item_id":
                        existing_match.found_item_id,
                    "contact":
                        existing_match.contact,
                    "status":
                        existing_match.status
                }
            }

        return {
            "success": False,
            "message":
                "Could not confirm this match."
        }

    # =========================================
    # RETURN NEW CONFIRMATION
    # =========================================

    return {
        "success": True,
        "already_confirmed": False,
        "message":
            "Match confirmed successfully",
        "confirmation": {
            "id":
                new_confirmation.id,
            "lost_item_id":
                new_confirmation.lost_item_id,
            "found_item_id":
                new_confirmation.found_item_id,
            "contact":
                new_confirmation.contact,
            "status":
                new_confirmation.status
        }
    }


# =========================================
# UPDATE CONFIRMED MATCH STATUS
# =========================================

@app.put("/confirmed-matches/{confirmation_id}/status")
def update_confirmed_match_status(
    confirmation_id: int,
    request: UpdateStatusRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # ALLOWED STATUSES
    # -----------------------------------------

    allowed_statuses = [
        "confirmed",
        "contacted",
        "returned"
    ]

    # -----------------------------------------
    # VALIDATE STATUS
    # -----------------------------------------

    if request.status not in allowed_statuses:

        return {
            "success": False,
            "message":
                "Invalid status. Allowed statuses are: confirmed, contacted, returned."
        }

    # -----------------------------------------
    # FIND CONFIRMATION
    # -----------------------------------------

    confirmation = (
        db.query(ConfirmedMatch)
        .filter(
            ConfirmedMatch.id == confirmation_id
        )
        .first()
    )

    if not confirmation:

        return {
            "success": False,
            "message":
                "Confirmation not found."
        }

    # -----------------------------------------
    # UPDATE STATUS
    # -----------------------------------------

    confirmation.status = request.status

    db.commit()

    db.refresh(confirmation)

    # -----------------------------------------
    # RETURN UPDATED CONFIRMATION
    # -----------------------------------------

    return {
        "success": True,
        "message":
            "Match status updated successfully.",
        "confirmation": {
            "id":
                confirmation.id,
            "lost_item_id":
                confirmation.lost_item_id,
            "found_item_id":
                confirmation.found_item_id,
            "contact":
                confirmation.contact,
            "status":
                confirmation.status
        }
    }


# =========================================
# GET CONFIRMED MATCHES
# =========================================

@app.get("/confirmed-matches")
def get_confirmed_matches(
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # GET ALL CONFIRMATIONS
    # -----------------------------------------

    confirmations = (
        db.query(ConfirmedMatch)
        .order_by(
            ConfirmedMatch.id.desc()
        )
        .all()
    )

    results = []

    # -----------------------------------------
    # BUILD CONFIRMED MATCH DATA
    # -----------------------------------------

    for confirmation in confirmations:

        # =====================================
        # FIND LOST ITEM
        # =====================================

        lost_item = (
            db.query(LostItem)
            .filter(
                LostItem.id ==
                confirmation.lost_item_id
            )
            .first()
        )

        # =====================================
        # FIND FOUND ITEM
        # =====================================

        found_item = (
            db.query(FoundItem)
            .filter(
                FoundItem.id ==
                confirmation.found_item_id
            )
            .first()
        )

        # =====================================
        # ADD RESULT
        # =====================================

        results.append({

            "confirmation_id":
                confirmation.id,

            "lost_item_id":
                confirmation.lost_item_id,

            "found_item_id":
                confirmation.found_item_id,

            "lost_item_name":
                lost_item.item_name
                if lost_item
                else None,

            "found_item_name":
                found_item.item_name
                if found_item
                else None,

            "description":
                found_item.description
                if found_item
                else None,

            "location":
                found_item.location
                if found_item
                else None,

            "date":
                found_item.date
                if found_item
                else None,

            "time":
                found_item.time
                if found_item
                else None,

            "contact":
                confirmation.contact,

            "status":
                confirmation.status
        })

    # =========================================
    # RETURN CONFIRMED MATCHES
    # =========================================

    return {
        "success": True,
        "count":
            len(results),
        "confirmed_matches":
            results
    }