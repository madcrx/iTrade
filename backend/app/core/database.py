from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all tables and run additive schema migrations. Idempotent."""
    from sqlalchemy import text
    additive_migrations = [
        "ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS enabled_strategies JSONB NOT NULL DEFAULT '[]'::jsonb",
    ]
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for sql in additive_migrations:
            await conn.execute(text(sql))
