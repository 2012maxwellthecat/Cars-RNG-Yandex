import random
from math import isfinite

from game.cars_data import get_all_cars
from game.models import Car


class SpinEngine:
    MAX_ATTEMPTS = 10_000

    def __init__(self) -> None:
        self.cars = get_all_cars()
        self.normal_cars = [car for car in self.cars if car.rarity != "Эксклюзивный"]

    def spin(self, chance_mult: float = 1.0) -> Car:
        if not isfinite(chance_mult) or chance_mult <= 0:
            raise ValueError("chance_mult must be a positive finite number")

        for _ in range(self.MAX_ATTEMPTS):
            car = random.choice(self.normal_cars)
            win_threshold = car.base_chance * 100_000 * chance_mult
            roll = random.randint(0, 10_000_000)

            if roll <= win_threshold:
                return car

        raise RuntimeError("Spin did not produce a car within the attempt limit")


RARITY_RANKS = {
    "Обычный": 0,
    "Необычный": 1,
    "Редкий": 2,
    "Эпический": 3,
    "Легендарный": 4,
    "Эксклюзивный": 5,
}


class CaseEngine:
    def __init__(self) -> None:
        self.cars = get_all_cars()
        self.exclusive_cars = [car for car in self.cars if car.rarity == "Эксклюзивный"]

    def _case_pool(self, min_rarity: str, include_exclusive: bool = False) -> list[Car]:
        min_rank = RARITY_RANKS[min_rarity]
        return [
            car
            for car in self.cars
            if RARITY_RANKS[car.rarity] >= min_rank and (include_exclusive or car.rarity != "Эксклюзивный")
        ]

    def get_exclusive_cars(self) -> list[Car]:
        return list(self.exclusive_cars)

    def open_case(self, min_rarity: str) -> Car:
        cars = self._case_pool(min_rarity)
        weights = [max(car.base_chance, 0.0001) for car in cars]
        return random.choices(cars, weights=weights, k=1)[0]

    def open_cases(self, min_rarity: str, count: int) -> list[Car]:
        cars = self._case_pool(min_rarity)
        weights = [max(car.base_chance, 0.0001) for car in cars]
        return random.choices(cars, weights=weights, k=count)

    def open_exclusive_case(self, exclusive_car_name: str) -> Car:
        cars = self._exclusive_case_pool(exclusive_car_name)
        weights = [max(car.base_chance, 0.0001) for car in cars]
        return random.choices(cars, weights=weights, k=1)[0]

    def open_exclusive_cases(self, exclusive_car_name: str, count: int) -> list[Car]:
        cars = self._exclusive_case_pool(exclusive_car_name)
        weights = [max(car.base_chance, 0.0001) for car in cars]
        return random.choices(cars, weights=weights, k=count)

    def _exclusive_case_pool(self, exclusive_car_name: str) -> list[Car]:
        target = next(
            (car for car in self.exclusive_cars if car.name == exclusive_car_name),
            None,
        )
        if target is None:
            raise ValueError(f"Unknown exclusive car: {exclusive_car_name}")
        return self._case_pool("Редкий") + [target]
