from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from game.car_images import get_car_photo
from game.engine import CaseEngine
from game.models import Car
from handlers.keyboards import BTN_CASES, cases_keyboard, spin_result_keyboard
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()
engine = CaseEngine()

UNCOMMON_CASE_COST = 100_000
RARE_CASE_COST = 2_500_000
EXCLUSIVE_CASE_COST = 4_000_000

CASES = {
    "case:uncommon": ("Необычный+ кейс", "Необычный", UNCOMMON_CASE_COST),
    "case:rare": ("Редкий+ кейс", "Редкий", RARE_CASE_COST),
}

BULK_CASE_COUNTS = {10, 100}


def _cases_text(balance: int) -> str:
    exclusive_lines = [
        f"{index}. {car.name} кейс - {EXCLUSIVE_CASE_COST:,}"
        for index, car in enumerate(engine.get_exclusive_cars(), start=1)
    ]
    return (
        f"Баланс: {balance:,}\n\n"
        f"Необычный+ кейс - {UNCOMMON_CASE_COST:,}\n"
        f"x10 - {UNCOMMON_CASE_COST * 10:,}, x100 - {UNCOMMON_CASE_COST * 100:,}\n"
        "Выпадает только необычная машина или лучше, без эксклюзивных.\n\n"
        f"Редкий+ кейс - {RARE_CASE_COST:,}\n"
        f"x10 - {RARE_CASE_COST * 10:,}, x100 - {RARE_CASE_COST * 100:,}\n"
        "Выпадает только редкая машина или лучше, без эксклюзивных.\n\n"
        "Эксклюзивные кейсы:\n"
        + "\n".join(exclusive_lines)
        + "\nВ каждом: редкие или лучше плюс указанная эксклюзивная машина."
    ).replace(",", " ")


def _format_case_win(case_name: str, car: Car, balance: int) -> str:
    return (
        f"{case_name} открыт.\n"
        f"Баланс: {balance:,}\n\n"
        f"Выпало: {car.name}\n"
        f"Редкость: {car.rarity}\n"
        f"Стоимость: {car.value:,}".replace(",", " ")
        + "\n\nЧто сделать с машиной?"
    )


def _format_bulk_case_result(case_name: str, count: int, summary: dict) -> str:
    lines = [
        f"{case_name} x{count} открыт.",
        f"Потрачено: {summary['spent']:,}".replace(",", " "),
        f"Заработано продажами: {summary['earned']:,}".replace(",", " "),
        f"Баланс: {summary['balance']:,}".replace(",", " "),
        "",
        f"Добавлено в гараж: {summary['added']}",
        f"Заменено машин: {summary['replaced']}",
        f"Продано новых машин: {summary['sold_new']}",
    ]

    best_cars = summary["best_cars"]
    if best_cars:
        lines.append("")
        lines.append("Лучшие выпадения:")
        for index, car in enumerate(best_cars, start=1):
            lines.append(
                f"{index}. {car.name} — {car.rarity} — {car.value:,}".replace(",", " ")
            )

    return "\n".join(lines)


async def _show_cases(message: Message, db: Database) -> None:
    player = db.get_or_create_user(message.from_user.id, user_display_name(message.from_user))
    await message.answer(
        _cases_text(player.money),
        reply_markup=cases_keyboard(UNCOMMON_CASE_COST, RARE_CASE_COST, engine.get_exclusive_cars()),
    )


@router.message(Command("cases"))
@router.message(F.text == BTN_CASES)
async def cases_handler(message: Message, db: Database) -> None:
    await _show_cases(message, db)


@router.callback_query(F.data.startswith("case:"))
async def open_case(callback: CallbackQuery, db: Database) -> None:
    parts = callback.data.split(":")
    case_key = ":".join(parts[:2])
    if case_key not in CASES:
        await callback.answer("Некорректный кейс.", show_alert=True)
        return
    if len(parts) > 3:
        await callback.answer("Некорректный кейс.", show_alert=True)
        return

    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    case_name, min_rarity, cost = CASES[case_key]

    if len(parts) == 3:
        try:
            count = int(parts[2])
        except ValueError:
            await callback.answer("Некорректное количество кейсов.", show_alert=True)
            return
        if count not in BULK_CASE_COUNTS:
            await callback.answer("Некорректное количество кейсов.", show_alert=True)
            return

        player = db.get_or_create_user(callback.from_user.id)
        cars = engine.open_cases(min_rarity, count)
        status, summary = db.open_case_bulk(callback.from_user.id, cost * count, cars, player.garage_cap)
        if status == "pending":
            await callback.answer(
                "Сначала решите судьбу предыдущей машины: оставьте или продайте её.",
                show_alert=True,
            )
            return
        if status == "money":
            await callback.answer("Недостаточно денег.", show_alert=True)
            return

        await callback.answer(f"Открыто кейсов: {count}")
        await callback.message.answer(_format_bulk_case_result(case_name, count, summary))
        return

    car = engine.open_case(min_rarity)
    status, balance = db.open_case(callback.from_user.id, cost, car)

    if status == "pending":
        await callback.answer(
            "Сначала решите судьбу предыдущей машины: оставьте или продайте её.",
            show_alert=True,
        )
        return

    if status == "money":
        await callback.answer("Недостаточно денег.", show_alert=True)
        return

    await callback.answer("Кейс открыт!")
    text = _format_case_win(case_name, car, balance)
    photo = get_car_photo(car.name)
    if photo is None:
        await callback.message.answer(text, reply_markup=spin_result_keyboard(car.value))
    else:
        await callback.message.answer_photo(photo, caption=text, reply_markup=spin_result_keyboard(car.value))


@router.callback_query(F.data.startswith("exclusive_case:"))
async def open_exclusive_case(callback: CallbackQuery, db: Database) -> None:
    parts = callback.data.split(":")
    if len(parts) not in (2, 3):
        await callback.answer("Некорректный кейс.", show_alert=True)
        return

    try:
        case_index = int(parts[1])
        count = int(parts[2]) if len(parts) == 3 else 1
    except ValueError:
        await callback.answer("Некорректный кейс.", show_alert=True)
        return

    exclusive_cars = engine.get_exclusive_cars()
    if case_index < 0 or case_index >= len(exclusive_cars):
        await callback.answer("Некорректный кейс.", show_alert=True)
        return
    if count != 1 and count not in BULK_CASE_COUNTS:
        await callback.answer("Некорректное количество кейсов.", show_alert=True)
        return

    db.get_or_create_user(callback.from_user.id, user_display_name(callback.from_user))
    exclusive_car = exclusive_cars[case_index]
    case_name = f"{exclusive_car.name} кейс"

    if count == 1:
        car = engine.open_exclusive_case(exclusive_car.name)
        status, balance = db.open_case(callback.from_user.id, EXCLUSIVE_CASE_COST, car)
        if status == "pending":
            await callback.answer(
                "Сначала решите судьбу предыдущей машины: оставьте или продайте её.",
                show_alert=True,
            )
            return
        if status == "money":
            await callback.answer("Недостаточно денег.", show_alert=True)
            return

        await callback.answer("Кейс открыт!")
        text = _format_case_win(case_name, car, balance)
        photo = get_car_photo(car.name)
        if photo is None:
            await callback.message.answer(text, reply_markup=spin_result_keyboard(car.value))
        else:
            await callback.message.answer_photo(photo, caption=text, reply_markup=spin_result_keyboard(car.value))
        return

    player = db.get_or_create_user(callback.from_user.id)
    cars = engine.open_exclusive_cases(exclusive_car.name, count)
    status, summary = db.open_case_bulk(callback.from_user.id, EXCLUSIVE_CASE_COST * count, cars, player.garage_cap)
    if status == "pending":
        await callback.answer(
            "Сначала решите судьбу предыдущей машины: оставьте или продайте её.",
            show_alert=True,
        )
        return
    if status == "money":
        await callback.answer("Недостаточно денег.", show_alert=True)
        return

    await callback.answer(f"Открыто кейсов: {count}")
    await callback.message.answer(_format_bulk_case_result(case_name, count, summary))
