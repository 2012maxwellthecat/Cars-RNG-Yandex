import asyncio
import logging
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware, Bot, Dispatcher
from aiogram.types import TelegramObject

import config
from handlers import cases, inventory, leaderboard, spin, start, upgrades
from storage.db import Database

logging.basicConfig(level=logging.INFO)


class DatabaseMiddleware(BaseMiddleware):
    def __init__(self, db: Database) -> None:
        self.db = db

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        data["db"] = self.db
        return await handler(event, data)


async def main() -> None:
    db = Database()
    db.init()

    bot = Bot(token=config.BOT_TOKEN)
    dp = Dispatcher()
    dp.update.middleware(DatabaseMiddleware(db))

    dp.include_router(start.router)
    dp.include_router(spin.router)
    dp.include_router(inventory.router)
    dp.include_router(cases.router)
    dp.include_router(leaderboard.router)
    dp.include_router(upgrades.router)

    logging.info("Бот запущен")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
