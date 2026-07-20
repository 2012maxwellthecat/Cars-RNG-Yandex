import asyncio

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from game.car_images import get_car_photo
from game.engine import SpinEngine
from game.models import Car
from handlers.keyboards import BTN_SPIN, auto_spin_keyboard, spin_result_keyboard
from handlers.user_names import user_display_name
from storage.db import Database

router = Router()
engine = SpinEngine()
AUTO_SPIN_INTERVAL_SECONDS = 3
AUTO_SPIN_TASKS: dict[int, asyncio.Task] = {}


def _format_win(car) -> str:
    return (
        f"Вы выиграли: {car.name}\n"
        f"Редкость: {car.rarity}\n"
        f"Стоимость: {car.value:,}".replace(",", " ")
        + "\n\nЧто сделать с машиной?"
    )


def _format_auto_spin(car: Car, result: dict, garage_cap: int) -> str:
    lines = [
        f"Авто-крутка: {car.name}",
        f"Редкость: {car.rarity}",
        f"Стоимость: {car.value:,}".replace(",", " "),
        "",
    ]

    if result["action"] == "added":
        lines.append("Машина добавлена в гараж.")
    elif result["action"] == "sold_new":
        lines.append(f"Новая машина продана за {car.value:,}.".replace(",", " "))
    elif result["action"] == "replaced":
        sold_car = result["sold_car"]
        lines.append(f"Продана самая дешёвая машина: {sold_car.name} за {sold_car.value:,}.".replace(",", " "))
        lines.append("Новая машина добавлена в гараж.")
    else:
        lines.append("Не удалось обработать машину.")

    lines.append(f"Машин: {result['count']} / {garage_cap}")
    lines.append(f"Баланс: {result['balance']:,}".replace(",", " "))
    return "\n".join(lines)


async def _edit_spin_message(callback: CallbackQuery, text: str) -> None:
    if callback.message.photo:
        await callback.message.edit_caption(caption=text)
        return
    await callback.message.edit_text(text)


async def _send_auto_spin_result(message: Message, text: str, car: Car) -> None:
    photo = get_car_photo(car.name)
    if photo is None:
        await message.answer(text, reply_markup=auto_spin_keyboard())
    else:
        await message.answer_photo(photo, caption=text, reply_markup=auto_spin_keyboard())


async def _auto_spin_loop(user_id: int, message: Message, db: Database) -> None:
    try:
        while True:
            await asyncio.sleep(AUTO_SPIN_INTERVAL_SECONDS)
            player = db.get_or_create_user(user_id)
            car = engine.spin(player.chance_mult)
            result = db.process_auto_spin_car(user_id, car, player.garage_cap)
            await _send_auto_spin_result(message, _format_auto_spin(car, result, player.garage_cap), car)
    except asyncio.CancelledError:
        raise
    except Exception as error:
        AUTO_SPIN_TASKS.pop(user_id, None)
        await message.answer(f"Авто-крутка остановлена из-за ошибки: {error}")


async def _handle_spin(message: Message, db: Database) -> None:
    user_id = message.from_user.id
    player = db.get_or_create_user(user_id, user_display_name(message.from_user))

    if db.get_pending_car(user_id) is not None:
        await message.answer(
            "Сначала решите судьбу предыдущей машины: оставьте или продайте её."
        )
        return

    try:
        car = engine.spin(player.chance_mult)
    except (ValueError, RuntimeError):
        await message.answer("Не удалось выполнить спин. Попробуйте ещё раз позже.")
        return

    db.set_pending_car(user_id, car)
    photo = get_car_photo(car.name)
    if photo is None:
        await message.answer(_format_win(car), reply_markup=spin_result_keyboard(car.value))
    else:
        await message.answer_photo(photo, caption=_format_win(car), reply_markup=spin_result_keyboard(car.value))


@router.message(Command("spin"))
@router.message(F.text == BTN_SPIN)
async def spin_handler(message: Message, db: Database) -> None:
    await _handle_spin(message, db)


@router.callback_query(F.data == "spin:keep")
async def keep_car(callback: CallbackQuery, db: Database) -> None:
    user_id = callback.from_user.id
    player = db.get_or_create_user(user_id, user_display_name(callback.from_user))
    if db.count_inventory(user_id) >= player.garage_cap:
        await callback.answer(
            f"Инвентарь полон ({player.garage_cap} мест). Продайте машину.",
            show_alert=True,
        )
        return

    car = db.keep_pending_car(user_id, player.garage_cap)
    if car is None:
        await callback.answer("Машина уже обработана или инвентарь заполнен.", show_alert=True)
        return

    await callback.answer("Добавлено в инвентарь!")
    await _edit_spin_message(
        callback,
        f"{car.name} добавлена в инвентарь.\n"
        f"Машин: {db.count_inventory(user_id)} / {player.garage_cap}",
    )


@router.callback_query(F.data == "spin:sell")
async def sell_car(callback: CallbackQuery, db: Database) -> None:
    user_id = callback.from_user.id
    db.get_or_create_user(user_id, user_display_name(callback.from_user))
    result = db.sell_pending_car(user_id)
    if result is None:
        await callback.answer("Нет машины для продажи.", show_alert=True)
        return

    car, balance = result
    await callback.answer("Продано!")
    await _edit_spin_message(
        callback,
        f"{car.name} продана за {car.value:,}.\nБаланс: {balance:,}".replace(",", " "),
    )


@router.callback_query(F.data == "autospin:start")
async def start_auto_spin(callback: CallbackQuery, db: Database) -> None:
    user_id = callback.from_user.id
    db.get_or_create_user(user_id, user_display_name(callback.from_user))

    if user_id in AUTO_SPIN_TASKS and not AUTO_SPIN_TASKS[user_id].done():
        await callback.answer("Авто-крутка уже запущена.", show_alert=True)
        return

    task = asyncio.create_task(_auto_spin_loop(user_id, callback.message, db))
    AUTO_SPIN_TASKS[user_id] = task
    await callback.answer("Авто-крутка запущена!")

    player = db.get_or_create_user(user_id)
    pending_result = db.process_pending_auto_spin_car(user_id, player.garage_cap)
    if pending_result is not None:
        pending_car, result = pending_result
        await _send_auto_spin_result(
            callback.message,
            _format_auto_spin(pending_car, result, player.garage_cap),
            pending_car,
        )

    await callback.message.answer(
        "Авто-крутка запущена. Новая машина будет выпадать каждые 3 секунды.",
        reply_markup=auto_spin_keyboard(),
    )


@router.callback_query(F.data == "autospin:stop")
async def stop_auto_spin(callback: CallbackQuery) -> None:
    user_id = callback.from_user.id
    task = AUTO_SPIN_TASKS.pop(user_id, None)
    if task is None or task.done():
        await callback.answer("Авто-крутка уже остановлена.", show_alert=True)
        return

    task.cancel()
    await callback.answer("Авто-крутка остановлена!")
    await callback.message.answer("Авто-крутка остановлена.")
