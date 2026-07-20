import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from game.models import Car, InventoryCar, Player

DB_PATH = Path(__file__).resolve().parent.parent / "cars_rng.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    user_id     INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'Игрок',
    money       INTEGER NOT NULL DEFAULT 0,
    chance_mult REAL NOT NULL DEFAULT 1.0,
    garage_cap  INTEGER NOT NULL DEFAULT 20
);

CREATE TABLE IF NOT EXISTS inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    car_name    TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    value       INTEGER NOT NULL,
    base_chance REAL NOT NULL,
    points      INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS pending_spins (
    user_id     INTEGER PRIMARY KEY,
    car_name    TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    value       INTEGER NOT NULL,
    base_chance REAL NOT NULL,
    points      INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
"""


def _row_to_car(row: sqlite3.Row) -> Car:
    return Car(
        name=row["car_name"],
        rarity=row["rarity"],
        value=row["value"],
        base_chance=row["base_chance"],
        points=row["points"],
    )


def _row_to_inventory_car(row: sqlite3.Row) -> InventoryCar:
    return InventoryCar(inventory_id=row["id"], **_row_to_car(row).__dict__)


def _process_auto_spin_car_conn(conn: sqlite3.Connection, user_id: int, car: Car, garage_cap: int) -> dict:
    row = conn.execute(
        "SELECT money FROM users WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    if row is None:
        conn.execute("INSERT INTO users (user_id) VALUES (?)", (user_id,))
        money = 0
    else:
        money = int(row["money"])

    count = conn.execute(
        "SELECT COUNT(*) AS cnt FROM inventory WHERE user_id = ?",
        (user_id,),
    ).fetchone()["cnt"]

    if count < garage_cap:
        conn.execute(
            """
            INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
        )
        return {
            "action": "added",
            "balance": money,
            "count": count + 1,
            "sold_car": None,
        }

    cheapest_row = conn.execute(
        """
        SELECT id, car_name, rarity, value, base_chance, points
        FROM inventory
        WHERE user_id = ?
        ORDER BY value ASC, id ASC
        LIMIT 1
        """,
        (user_id,),
    ).fetchone()
    if cheapest_row is None:
        return {
            "action": "skipped",
            "balance": money,
            "count": count,
            "sold_car": None,
        }

    cheapest_car = _row_to_car(cheapest_row)
    if cheapest_car.value > car.value:
        balance = money + car.value
        conn.execute(
            "UPDATE users SET money = ? WHERE user_id = ?",
            (balance, user_id),
        )
        return {
            "action": "sold_new",
            "balance": balance,
            "count": count,
            "sold_car": car,
        }

    balance = money + cheapest_car.value
    conn.execute(
        "DELETE FROM inventory WHERE id = ? AND user_id = ?",
        (cheapest_row["id"], user_id),
    )
    conn.execute(
        "UPDATE users SET money = ? WHERE user_id = ?",
        (balance, user_id),
    )
    conn.execute(
        """
        INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
    )
    return {
        "action": "replaced",
        "balance": balance,
        "count": count,
        "sold_car": cheapest_car,
    }


class Database:
    def __init__(self, path: Path = DB_PATH) -> None:
        self.path = path

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init(self) -> None:
        with self._connect() as conn:
            conn.executescript(_SCHEMA)
            columns = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            }
            if "display_name" not in columns:
                conn.execute("ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT 'Игрок'")

    def get_or_create_user(self, user_id: int, display_name: str | None = None) -> Player:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT user_id, display_name, money, chance_mult, garage_cap FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                conn.execute(
                    "INSERT INTO users (user_id, display_name) VALUES (?, ?)",
                    (user_id, display_name or "Игрок"),
                )
                return Player(user_id=user_id, display_name=display_name or "Игрок")
            if display_name and display_name != row["display_name"]:
                conn.execute(
                    "UPDATE users SET display_name = ? WHERE user_id = ?",
                    (display_name, user_id),
                )
            return Player(
                user_id=row["user_id"],
                money=row["money"],
                chance_mult=row["chance_mult"],
                garage_cap=row["garage_cap"],
                display_name=display_name or row["display_name"],
            )

    def get_pending_car(self, user_id: int) -> Car | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT car_name, rarity, value, base_chance, points FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                return None
            return _row_to_car(row)

    def set_pending_car(self, user_id: int, car: Car) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO pending_spins (user_id, car_name, rarity, value, base_chance, points)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    car_name = excluded.car_name,
                    rarity = excluded.rarity,
                    value = excluded.value,
                    base_chance = excluded.base_chance,
                    points = excluded.points
                """,
                (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
            )

    def clear_pending_car(self, user_id: int) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM pending_spins WHERE user_id = ?", (user_id,))

    def add_to_inventory(self, user_id: int, car: Car) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
            )

    def keep_pending_car(self, user_id: int, garage_cap: int) -> Car | None:
        """Move a pending car to inventory, returning None when unavailable or full."""
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT car_name, rarity, value, base_chance, points "
                "FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                return None

            count = conn.execute(
                "SELECT COUNT(*) AS cnt FROM inventory WHERE user_id = ?",
                (user_id,),
            ).fetchone()["cnt"]
            if count >= garage_cap:
                return None

            car = _row_to_car(row)
            conn.execute(
                """
                INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
            )
            conn.execute("DELETE FROM pending_spins WHERE user_id = ?", (user_id,))
            return car

    def sell_pending_car(self, user_id: int) -> tuple[Car, int] | None:
        """Sell a pending car and return it with the new balance atomically."""
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT car_name, rarity, value, base_chance, points "
                "FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                return None

            car = _row_to_car(row)
            conn.execute(
                "UPDATE users SET money = money + ? WHERE user_id = ?",
                (car.value, user_id),
            )
            balance = conn.execute(
                "SELECT money FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()["money"]
            conn.execute("DELETE FROM pending_spins WHERE user_id = ?", (user_id,))
            return car, int(balance)

    def sell_inventory_car(self, user_id: int, inventory_id: int) -> tuple[Car, int] | None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT id, car_name, rarity, value, base_chance, points
                FROM inventory WHERE id = ? AND user_id = ?
                """,
                (inventory_id, user_id),
            ).fetchone()
            if row is None:
                return None

            car = _row_to_car(row)
            conn.execute("DELETE FROM inventory WHERE id = ? AND user_id = ?", (inventory_id, user_id))
            conn.execute("UPDATE users SET money = money + ? WHERE user_id = ?", (car.value, user_id))
            balance = conn.execute(
                "SELECT money FROM users WHERE user_id = ?", (user_id,)
            ).fetchone()["money"]
            return car, int(balance)

    def process_auto_spin_car(self, user_id: int, car: Car, garage_cap: int) -> dict:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            return _process_auto_spin_car_conn(conn, user_id, car, garage_cap)

    def process_pending_auto_spin_car(self, user_id: int, garage_cap: int) -> tuple[Car, dict] | None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT car_name, rarity, value, base_chance, points "
                "FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                return None

            car = _row_to_car(row)
            user_row = conn.execute(
                "SELECT money FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            money = int(user_row["money"]) if user_row is not None else 0
            count = conn.execute(
                "SELECT COUNT(*) AS cnt FROM inventory WHERE user_id = ?",
                (user_id,),
            ).fetchone()["cnt"]

            conn.execute("DELETE FROM pending_spins WHERE user_id = ?", (user_id,))

            if count < garage_cap:
                conn.execute(
                    """
                    INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
                )
                return car, {
                    "action": "added",
                    "balance": money,
                    "count": count + 1,
                    "sold_car": None,
                }

            cheapest_row = conn.execute(
                """
                SELECT id, car_name, rarity, value, base_chance, points
                FROM inventory
                WHERE user_id = ?
                ORDER BY value ASC, id ASC
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
            if cheapest_row is None:
                return car, {
                    "action": "skipped",
                    "balance": money,
                    "count": count,
                    "sold_car": None,
                }

            cheapest_car = _row_to_car(cheapest_row)
            if cheapest_car.value > car.value:
                balance = money + car.value
                conn.execute(
                    "UPDATE users SET money = ? WHERE user_id = ?",
                    (balance, user_id),
                )
                return car, {
                    "action": "sold_new",
                    "balance": balance,
                    "count": count,
                    "sold_car": car,
                }

            balance = money + cheapest_car.value
            conn.execute(
                "DELETE FROM inventory WHERE id = ? AND user_id = ?",
                (cheapest_row["id"], user_id),
            )
            conn.execute(
                "UPDATE users SET money = ? WHERE user_id = ?",
                (balance, user_id),
            )
            conn.execute(
                """
                INSERT INTO inventory (user_id, car_name, rarity, value, base_chance, points)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
            )
            return car, {
                "action": "replaced",
                "balance": balance,
                "count": count,
                "sold_car": cheapest_car,
            }

    def open_case(self, user_id: int, cost: int, car: Car) -> tuple[str, int]:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT money FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                conn.execute("INSERT INTO users (user_id) VALUES (?)", (user_id,))
                money = 0
            else:
                money = int(row["money"])

            pending = conn.execute(
                "SELECT 1 FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if pending is not None:
                return "pending", money

            if money < cost:
                return "money", money

            balance = money - cost
            conn.execute(
                "UPDATE users SET money = ? WHERE user_id = ?",
                (balance, user_id),
            )
            conn.execute(
                """
                INSERT INTO pending_spins (user_id, car_name, rarity, value, base_chance, points)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, car.name, car.rarity, car.value, car.base_chance, car.points),
            )
            return "ok", balance

    def open_case_bulk(self, user_id: int, total_cost: int, cars: list[Car], garage_cap: int) -> tuple[str, dict]:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT money FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row is None:
                conn.execute("INSERT INTO users (user_id) VALUES (?)", (user_id,))
                money = 0
            else:
                money = int(row["money"])

            pending = conn.execute(
                "SELECT 1 FROM pending_spins WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if pending is not None:
                return "pending", {"balance": money}

            if money < total_cost:
                return "money", {"balance": money}

            balance_after_purchase = money - total_cost
            conn.execute(
                "UPDATE users SET money = ? WHERE user_id = ?",
                (balance_after_purchase, user_id),
            )

            summary = {
                "opened": len(cars),
                "spent": total_cost,
                "added": 0,
                "replaced": 0,
                "sold_new": 0,
                "earned": 0,
                "balance": balance_after_purchase,
                "best_cars": [],
            }

            for car in cars:
                result = _process_auto_spin_car_conn(conn, user_id, car, garage_cap)
                summary[result["action"]] = summary.get(result["action"], 0) + 1
                if result["action"] == "sold_new":
                    summary["earned"] += car.value
                elif result["action"] == "replaced" and result["sold_car"] is not None:
                    summary["earned"] += result["sold_car"].value
                summary["balance"] = result["balance"]
                summary["best_cars"].append(car)

            summary["best_cars"].sort(key=lambda item: item.value, reverse=True)
            summary["best_cars"] = summary["best_cars"][:10]
            return "ok", summary

    def buy_chance_upgrade(self, user_id: int, base_cost: int, chance_step: float) -> Player | None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT user_id, money, chance_mult, garage_cap FROM users WHERE user_id = ?", (user_id,)
            ).fetchone()
            if row is None:
                return None

            cost = int(base_cost * row["chance_mult"])
            if row["money"] < cost:
                return None

            conn.execute(
                "UPDATE users SET money = money - ?, chance_mult = chance_mult + ? WHERE user_id = ?",
                (cost, chance_step, user_id),
            )
            return Player(
                user_id=user_id,
                money=row["money"] - cost,
                chance_mult=row["chance_mult"] + chance_step,
                garage_cap=row["garage_cap"],
            )

    def buy_garage_upgrade(
        self, user_id: int, base_cost: int, cost_step: int, garage_step: int, initial_cap: int
    ) -> Player | None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT user_id, money, chance_mult, garage_cap FROM users WHERE user_id = ?", (user_id,)
            ).fetchone()
            if row is None:
                return None

            level = max(0, (row["garage_cap"] - initial_cap) // garage_step)
            cost = base_cost + level * cost_step
            if row["money"] < cost:
                return None

            conn.execute(
                "UPDATE users SET money = money - ?, garage_cap = garage_cap + ? WHERE user_id = ?",
                (cost, garage_step, user_id),
            )
            return Player(
                user_id=user_id,
                money=row["money"] - cost,
                chance_mult=row["chance_mult"],
                garage_cap=row["garage_cap"] + garage_step,
            )

    def get_inventory(self, user_id: int) -> list[InventoryCar]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, car_name, rarity, value, base_chance, points
                FROM inventory
                WHERE user_id = ?
                ORDER BY
                    CASE rarity
                        WHEN 'Легендарный' THEN 0
                        WHEN 'Эксклюзивный' THEN 1
                        WHEN 'Эпический' THEN 2
                        WHEN 'Редкий' THEN 3
                        WHEN 'Необычный' THEN 4
                        WHEN 'Обычный' THEN 5
                        ELSE 6
                    END,
                    value DESC,
                    id ASC
                """,
                (user_id,),
            ).fetchall()
            return [_row_to_inventory_car(row) for row in rows]

    def count_inventory(self, user_id: int) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM inventory WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            return int(row["cnt"])

    def add_money(self, user_id: int, amount: int) -> int:
        with self._connect() as conn:
            conn.execute(
                "UPDATE users SET money = money + ? WHERE user_id = ?",
                (amount, user_id),
            )
            row = conn.execute(
                "SELECT money FROM users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            return int(row["money"])

    def get_leaderboard(self, limit: int = 10) -> list[tuple[str, int]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT
                    COALESCE(NULLIF(users.display_name, ''), CAST(users.user_id AS TEXT)) AS display_name,
                    SUM(inventory.points) AS total_points
                FROM inventory
                JOIN users ON users.user_id = inventory.user_id
                GROUP BY inventory.user_id
                ORDER BY total_points DESC, users.user_id ASC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [(row["display_name"], int(row["total_points"] or 0)) for row in rows]
