from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from handlers.keyboards import BTN_INVENTORY, inventory_keyboard
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()
INVENTORY_PAGE_SIZE = 20


def _inventory_page(cars, page: int):
    total_pages = max(1, (len(cars) + INVENTORY_PAGE_SIZE - 1) // INVENTORY_PAGE_SIZE)
    page = min(max(page, 0), total_pages - 1)
    start = page * INVENTORY_PAGE_SIZE
    return cars[start:start + INVENTORY_PAGE_SIZE], page, total_pages, start


def _format_inventory(db: Database, user_id: int, page: int = 0) -> tuple[str, list, int, int]:
    player = db.get_or_create_user(user_id)
    cars = db.get_inventory(user_id)

    if not cars:
        text = (
            "Инвентарь пуст.\n"
            f"Баланс: {player.money:,}".replace(",", " ")
        )
        return text, [], 0, 1

    page_cars, page, total_pages, start = _inventory_page(cars, page)
    lines = [
        f"{index}. {car.display_line()}"
        for index, car in enumerate(page_cars, start=start + 1)
    ]
    lines.append("")
    lines.append(f"Машин: {len(cars)} / {player.garage_cap}")
    lines.append(f"Страница: {page + 1} / {total_pages}")
    lines.append(f"Баланс: {player.money:,}".replace(",", " "))
    return "\n".join(lines), page_cars, page, total_pages


@router.message(Command("inventory"))
@router.message(F.text == BTN_INVENTORY)
async def inventory_handler(message: Message, db: Database) -> None:
    user_id = message.from_user.id
    db.get_or_create_user(user_id, user_display_name(message.from_user))
    text, page_cars, page, total_pages = _format_inventory(db, user_id)
    await message.answer(
        text,
        reply_markup=inventory_keyboard(page_cars, page, total_pages) if page_cars else None,
    )


@router.callback_query(F.data.startswith("inventory:page:"))
async def inventory_page(callback: CallbackQuery, db: Database) -> None:
    try:
        page = int(callback.data.rsplit(":", maxsplit=1)[1])
    except (AttributeError, ValueError):
        await callback.answer("Некорректная страница.", show_alert=True)
        return

    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    text, page_cars, page, total_pages = _format_inventory(db, callback.from_user.id, page)
    await callback.answer()
    await callback.message.edit_text(
        text,
        reply_markup=inventory_keyboard(page_cars, page, total_pages) if page_cars else None,
    )


@router.callback_query(F.data == "inventory:noop")
async def inventory_noop(callback: CallbackQuery) -> None:
    await callback.answer()


@router.callback_query(F.data.startswith("inventory:sell:"))
async def sell_inventory_car(callback: CallbackQuery, db: Database) -> None:
    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    try:
        inventory_id = int(callback.data.rsplit(":", maxsplit=1)[1])
    except (AttributeError, ValueError):
        await callback.answer("Некорректный запрос.", show_alert=True)
        return

    result = db.sell_inventory_car(callback.from_user.id, inventory_id)
    if result is None:
        await callback.answer("Эта машина уже продана.", show_alert=True)
        return

    car, balance = result
    await callback.answer("Машина продана!")
    await callback.message.edit_text(
        f"{car.name} продана за {car.value:,}.\nБаланс: {balance:,}".replace(",", " ")
    )
