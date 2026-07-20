from dataclasses import dataclass


@dataclass
class Car:
    name: str
    rarity: str
    value: int
    base_chance: float
    points: int

    def display_line(self) -> str:
        return f"{self.name} — {self.rarity} — {self.value:,}".replace(",", " ")


@dataclass
class InventoryCar(Car):
    inventory_id: int = 0


@dataclass
class Player:
    user_id: int
    money: int = 0
    chance_mult: float = 1.0
    garage_cap: int = 20
    display_name: str = "Игрок"
