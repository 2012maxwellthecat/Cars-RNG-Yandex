from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup

BTN_SPIN = "Крутить"
BTN_INVENTORY = "Инвентарь"
BTN_UPGRADES = "Улучшения"
BTN_CASES = "Кейсы"
BTN_LEADERBOARD = "Лидерборд"


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BTN_SPIN)],
            [KeyboardButton(text=BTN_INVENTORY)],
            [KeyboardButton(text=BTN_CASES)],
            [KeyboardButton(text=BTN_LEADERBOARD)],
            [KeyboardButton(text=BTN_UPGRADES)],
        ],
        resize_keyboard=True,
    )


def inventory_keyboard(cars, page: int = 0, total_pages: int = 1) -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text=f"Продать {car.name}", callback_data=f"inventory:sell:{car.inventory_id}")]
        for car in cars
    ]
    if total_pages > 1:
        nav_buttons = []
        if page > 0:
            nav_buttons.append(InlineKeyboardButton(text="Назад", callback_data=f"inventory:page:{page - 1}"))
        nav_buttons.append(InlineKeyboardButton(text=f"{page + 1}/{total_pages}", callback_data="inventory:noop"))
        if page + 1 < total_pages:
            nav_buttons.append(InlineKeyboardButton(text="Вперёд", callback_data=f"inventory:page:{page + 1}"))
        buttons.append(nav_buttons)
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def upgrades_keyboard(chance_cost: int, garage_cost: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"Шанс +0.1 за {chance_cost:,}".replace(",", " "), callback_data="upgrade:chance")],
            [InlineKeyboardButton(text=f"Гараж +5 за {garage_cost:,}".replace(",", " "), callback_data="upgrade:garage")],
        ]
    )


def cases_keyboard(uncommon_cost: int, rare_cost: int, exclusive_cases=None) -> InlineKeyboardMarkup:
    exclusive_cases = exclusive_cases or []
    buttons = [
        [
            InlineKeyboardButton(
                text=f"Необычный+ за {uncommon_cost:,}".replace(",", " "),
                callback_data="case:uncommon",
            )
        ],
        [
            InlineKeyboardButton(text="Необычный+ x10", callback_data="case:uncommon:10"),
            InlineKeyboardButton(text="Необычный+ x100", callback_data="case:uncommon:100"),
        ],
        [
            InlineKeyboardButton(
                text=f"Редкий+ за {rare_cost:,}".replace(",", " "),
                callback_data="case:rare",
            )
        ],
        [
            InlineKeyboardButton(text="Редкий+ x10", callback_data="case:rare:10"),
            InlineKeyboardButton(text="Редкий+ x100", callback_data="case:rare:100"),
        ],
    ]
    for index, car in enumerate(exclusive_cases):
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"{car.name} кейс",
                    callback_data=f"exclusive_case:{index}",
                )
            ]
        )
        buttons.append(
            [
                InlineKeyboardButton(text="x10", callback_data=f"exclusive_case:{index}:10"),
                InlineKeyboardButton(text="x100", callback_data=f"exclusive_case:{index}:100"),
            ]
        )
    return InlineKeyboardMarkup(
        inline_keyboard=buttons
    )


def spin_result_keyboard(value: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Оставить", callback_data="spin:keep"),
                InlineKeyboardButton(
                    text=f"Продать за {value:,}".replace(",", " "),
                    callback_data="spin:sell",
                ),
            ],
            [InlineKeyboardButton(text="Авто-крутка", callback_data="autospin:start")],
        ]
    )


def auto_spin_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Стоп", callback_data="autospin:stop")]
        ]
    )
