from aiogram.types import User


def user_display_name(user: User) -> str:
    name = " ".join(part for part in (user.first_name, user.last_name) if part).strip()
    if name:
        return name
    if user.username:
        return f"@{user.username}"
    return str(user.id)
