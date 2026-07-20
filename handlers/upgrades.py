from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from handlers.keyboards import BTN_UPGRADES, upgrades_keyboard
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()

CHANCE_BASE_COST = 100_000
CHANCE_STEP = 0.1
GARAGE_BASE_COST = 75_000
GARAGE_COST_STEP = 50_000
GARAGE_STEP = 5
INITIAL_GARAGE_CAP = 20


def _costs(player) -> tuple[int, int]:
    chance_cost = int(CHANCE_BASE_COST * player.chance_mult)
    garage_level = max(0, (player.garage_cap - INITIAL_GARAGE_CAP) // GARAGE_STEP)
    garage_cost = GARAGE_BASE_COST + garage_level * GARAGE_COST_STEP
    return chance_cost, garage_cost


def _text(player) -> str:
    chance_cost, garage_cost = _costs(player)
    return (
        f"Баланс: {player.money:,}\n"
        f"Множитель шанса: x{player.chance_mult:.1f}\n"
        f"Размер гаража: {player.garage_cap}\n\n"
        f"Следующее улучшение шанса: {chance_cost:,}\n"
        f"Следующее расширение гаража: {garage_cost:,}"
    ).replace(",", " ")


async def _show(message: Message, db: Database) -> None:
    player = db.get_or_create_user(message.from_user.id, user_display_name(message.from_user))
    chance_cost, garage_cost = _costs(player)
    await message.answer(_text(player), reply_markup=upgrades_keyboard(chance_cost, garage_cost))


@router.message(Command("upgrades"))
@router.message(F.text == BTN_UPGRADES)
async def upgrades_handler(message: Message, db: Database) -> None:
    await _show(message, db)


@router.callback_query(F.data == "upgrade:chance")
async def buy_chance_upgrade(callback: CallbackQuery, db: Database) -> None:
    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    player = db.buy_chance_upgrade(callback.from_user.id, CHANCE_BASE_COST, CHANCE_STEP)
    if player is None:
        await callback.answer("Недостаточно денег.", show_alert=True)
        return
    chance_cost, garage_cost = _costs(player)
    await callback.answer("Множитель шанса улучшен!")
    await callback.message.edit_text(_text(player), reply_markup=upgrades_keyboard(chance_cost, garage_cost))


@router.callback_query(F.data == "upgrade:garage")
async def buy_garage_upgrade(callback: CallbackQuery, db: Database) -> None:
    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    player = db.buy_garage_upgrade(
        callback.from_user.id,
        GARAGE_BASE_COST,
        GARAGE_COST_STEP,
        GARAGE_STEP,
        INITIAL_GARAGE_CAP,
    )
    if player is None:
        await callback.answer("Недостаточно денег.", show_alert=True)
        return
    chance_cost, garage_cost = _costs(player)
    await callback.answer("Гараж расширен!")
    await callback.message.edit_text(_text(player), reply_markup=upgrades_keyboard(chance_cost, garage_cost))
