from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    All SQLAlchemy models will inherit from this class.
    Alembic reads this Base to generate your migration scripts.
    """
    pass