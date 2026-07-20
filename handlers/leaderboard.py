from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import Message

from handlers.keyboards import BTN_LEADERBOARD
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()


def _format_leaderboard(rows: list[tuple[str, int]]) -> str:
    if not rows:
        return "Лидерборд пуст. Сначала оставьте машины в инвентаре."

    lines = ["Топ 10 игроков по очкам:"]
    for index, (name, points) in enumerate(rows, start=1):
        lines.append(f"{index}. {name} — {points:,}".replace(",", " "))
    return "\n".join(lines)


@router.message(Command("leaderboard"))
@router.message(F.text == BTN_LEADERBOARD)
async def leaderboard_handler(message: Message, db: Database) -> None:
    db.get_or_create_user(message.from_user.id, user_display_name(message.from_user))
    await message.answer(_format_leaderboard(db.get_leaderboard()))
