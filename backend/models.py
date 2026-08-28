from sqlalchemy import Column, Integer, String, Text, UniqueConstraint

from backend.database import Base


# =========================================
# LOST ITEMS
# =========================================

class LostItem(Base):
    __tablename__ = "lost_items"

    id = Column(Integer, primary_key=True, index=True)

    item_name = Column(String(100), nullable=False)

    description = Column(Text, nullable=False)

    location = Column(String(200), nullable=False)

    date = Column(String(20), nullable=False)

    time = Column(String(20), nullable=False)


# =========================================
# FOUND ITEMS
# =========================================

class FoundItem(Base):
    __tablename__ = "found_items"

    id = Column(Integer, primary_key=True, index=True)

    item_name = Column(String(100), nullable=False)

    description = Column(Text, nullable=False)

    location = Column(String(200), nullable=False)

    date = Column(String(20), nullable=False)

    time = Column(String(20), nullable=False)

    contact = Column(String(150), nullable=True)


# =========================================
# CONFIRMED MATCHES
# =========================================

class ConfirmedMatch(Base):
    __tablename__ = "confirmed_matches"

    id = Column(Integer, primary_key=True, index=True)

    lost_item_id = Column(
        Integer,
        nullable=False
    )

    found_item_id = Column(
        Integer,
        nullable=False
    )

    contact = Column(
        String(150),
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="confirmed"
    )

    # =====================================
    # PREVENT DUPLICATE CONFIRMATIONS
    # =====================================

    __table_args__ = (
        UniqueConstraint(
            "lost_item_id",
            "found_item_id",
            name="unique_lost_found_match"
        ),
    )