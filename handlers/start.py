from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from handlers.keyboards import main_menu_keyboard
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, db: Database) -> None:
    db.get_or_create_user(message.from_user.id, user_display_name(message.from_user))
    await message.answer(
        "Добро пожаловать в Cars RNG!\n\n"
        "Крутите колесо, собирайте машины и продавайте ненужные.\n"
        "Используйте кнопки ниже или команды /spin, /inventory, /cases и /leaderboard.",
        reply_markup=main_menu_keyboard(),
    )
