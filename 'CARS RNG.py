'''CARS RNG'''
'''
Идеи: SE,SE-obtainable cars(A9), рынок, донатные кейсы, лидерборд, инвентарь с кейсами, очивки, top drives элементы
'''
import random
from time import sleep

class Car:
    def __init__(self, name, rarity, value, base_chance, points):
        self.name = name
        self.rarity = rarity
        self.value = value
        self.base_chance = base_chance
        self.points = points
        

    def __str__(self):
        return f"{self.name} (Rarity: {self.rarity}, Value: {self.value}, Chance: {self.base_chance})"


class spin:
    def __init__(self):
        self.car = [
            Car("Лада 2106", "Обычный", 2500, 100, 0),
            Car("Лада 2105", "Обычный", 3000, 100, 0),
            Car("Лада 2104", "Обычный", 3500, 100, 0),
            Car("Лада 2107", "Обычный", 4000, 100, 0),
            Car("LADA Priora", "Обычный", 7500, 100, 0),
            Car("LADA Granta", "Обычный", 10000, 100, 0),
            Car("LADA Vesta", "Обычный", 12500, 100, 0),
            Car("LADA Aura", "Обычный", 15000, 100, 0),
            Car("Fiat 500", "Обычный", 15000, 100, 0),
            Car("Renault Logan", "Обычный", 15000, 100, 0),
            Car("Volkswagen Beetle", "Обычный", 17000, 100, 0),
            Car("Chevrolet Spark", "Обычный", 18000, 100, 0),
            Car("Honda Fit","Обычный" ,18000 , 100, 0),
            Car("Citroen DS3", "Обычный", 19000, 100, 0),
            Car("Toyota Corolla", "Обычный", 20000, 100, 0),
            Car("Dodge Dart", "Обычный", 20000, 100, 0),
            Car("Ford Fiesta", "Обычный", 20000, 100, 0),
            Car("Ford Focus", "Обычный", 21000, 100, 0),
            Car("Chrysler 200", "Обычный", 21000, 100, 0),
            Car("Renault Kaptur", "Обычный", 21000, 100, 0),
            Car("Kia Soul", "Обычный", 21000, 100, 0),
            Car("Peugeot 208", "Обычный", 22000, 100, 0),
            Car("Honda Civic", "Обычный", 22000, 100, 0),
            Car("Chevrolet Malibu Maxx","Обычный" ,22000 , 100, 0),
            Car("Nissan Altima", "Обычный", 23000, 100, 0),
            Car("Mitsubishi Outlander", "Обычный", 23000, 100, 0),
            Car("Mazda 3", "Обычный", 23000, 100, 0),
            Car("Subaru Legacy", "Обычный", 23000, 100, 0),
            Car("Volkswagen Golf", "Обычный", 23000, 100, 0),
            Car("Chevrolet Malibu", "Обычный", 24000, 95, 0),
            Car("Kia Niro","Обычный" , 24000, 100, 0),
            Car("Kia Sportage", "Обычный", 25000, 90, 0),
            Car("Kia Optima", "Обычный", 25000, 90, 0),
            Car("Fiat Tipo","Обычный" ,25000 , 90, 0),
            Car("Hyundai Sonata", "Обычный", 25000, 90, 0),
            Car("Honda Civic", "Обычный", 25000, 90, 0),
            Car("Buick Verano", "Обычный", 25000, 90, 0),
            Car("Mazda 6", "Обычный", 26000, 85, 0),
            Car("Mini Cooper", "Обычный", 26000, 85, 0),
            Car("Toyota Prius","Обычный" ,26000 , 85, 0),
            Car("Scion FR-S", "Обычный", 27000, 80, 0),
            Car("Mazda MX-5", "Обычный", 27000, 80, 0),
            Car("Chevrolet Equinox","Обычный" , 27000, 80, 0),
            Car("Honda HR-V","Обычный" , 27000, 80, 0),
            Car("Subaru Impreza", "Обычный", 28000, 75, 0),
            Car("Honda Accord", "Обычный", 28000, 75, 0),
            Car("Toyota 86", "Обычный", 28000, 75, 0),
            Car("Subaru BRZ", "Обычный", 29000, 70, 0),
            Car("Toyota Camry", "Обычный", 29000, 70, 0),
            Car("Renault Duster", "Обычный", 29000, 70, 0),

            Car("Hyundai Elantra", "Необычный", 30000, 20, 0),
            Car("Ford Mustang", "Необычный", 30000, 20, 0),
            Car("Hyundai Santa Fe", "Необычный", 30000, 20, 0),
            Car("Fiat 124 Spider", "Необычный", 30000, 20, 0),
            Car("Volkswagen Beetle", "Необычный", 31000, 18, 0),
            Car("Chevrolet Camaro", "Необычный", 31000, 18, 0),
            Car("Volkswagen Jetta", "Необычный", 31000, 18, 0),
            Car("Peugeot 308", "Необычный", 32000, 16.5, 0),
            Car("Kia Sportage", "Необычный", 32000, 16.5, 0),
            Car("Mazda CX-5", "Необычный", 33000, 15, 0),
            Car("Opel Astra", "Необычный", 33000, 15, 0),
            Car("Nissan 370Z", "Необычный", 33000, 15, 0),
            Car("Volvo Cs60", "Необычный", 34000, 13.5, 0),
            Car("Hyundai Veloster N","Необычный", 34000, 13.5, 0),
            Car("Subaru WRX", "Необычный", 35000, 12, 0),
            Car("Fiat Topolino", "Необычный", 35000, 12, 0),
            Car("Tesla Model 3", "Необычный", 35000, 12, 0),
            Car("Dodge Charger", "Необычный", 35000, 12, 0),
            Car("Mitsubishi Lancer", "Необычный", 40000, 9, 0),
            Car("Kia Stinger", "Необычный", 40000, 9, 0),
            Car("Audi TT", "Необычный", 40000, 9, 0),
            Car("Chevrolet Corvette Stingray", "Необычный", 40000, 9, 0),
            Car("BMW 2 Series", "Необычный", 45000, 7, 0),
            Car("Infiniti Q50", "Необычный", 45000, 7, 0),
            Car("BMW Z4", "Необычный", 45000, 7, 0),
            Car("Lexus ES", "Необычный", 46000, 6, 0),
            Car("Volvo XC60", "Необычный", 46000, 6, 1),
            Car("BMW 3-Series", "Необычный", 47000, 5, 0),
            Car("Dodge Challenger", "Необычный", 47000, 5, 1),
            Car("Audi A4", "Необычный", 48000, 4, 0),

            Car("Nissan Z", "Редкий", 60000, 0.9, 1),
            Car("Porsche Boxster", "Редкий", 60000, 0.9, 1),
            Car("Mercedes-Benz C-Class", "Редкий", 65000, 0.85, 1),
            Car("Chevrolet Corvette", "Редкий", 65000, 0.85, 1),
            Car("Porsche Cayman", "Редкий", 65000, 0.85, 1),
            Car("Lincoln MKZ", "Редкий", 68000, 0.82, 1),
            Car("Porsche Macan", "Редкий", 70000, 0.8, 1),
            Car("BMW M3", "Редкий", 70000, 0.8, 1),
            Car("Jaguar F-PACE", "Редкий", 70000, 0.8, 1),
            Car("Mitsubishi Lancer Evolution", "Редкий", 70000, 0.8, 1),
            Car("Maserati Ghibli", "Редкий", 75000, 0.75, 1),
            Car("Porsche Cayenne", "Редкий", 75000, 0.75, 1),
            Car("Jaguar F-Type", "Редкий", 80000, 0.7, 1),
            Car("Cadillac Escalade", "Редкий", 80000, 0.7, 1),
            Car("Land Rover Range Rover Velar", "Редкий", 85000, 0.65, 1),
            Car("Lexus RX", "Редкий", 90000, 0.6, 1),
            Car("Audi Q8", "Редкий", 90000, 0.6, 1),
            Car("Lotus Evora", "Редкий", 90000, 0.6, 1),
            Car("Nissan GT-R", "Редкий", 100000, 0.5, 1),
            Car("Tesla Model S", "Редкий", 100000, 0.5, 1),
            Car("Lexus LS", "Редкий", 110000, 0.46, 2),
            Car("Mercedes-Benz S-класс", "Редкий", 120000, 0.42, 2),
            Car("Porsche 911", "Редкий", 150000, 0.3, 2),
            Car("Aston Martin Vantage", "Редкий", 150000, 0.3, 2),
            Car("Maserati Levante", "Редкий", 150000, 0.3, 2),

            Car("McLaren 570S", "Эпический", 200000, 0.12, 7),
            Car("McLaren GT", "Эпический", 200000, 0.12, 7),
            Car("Lamborghini Urus", "Эпический", 200000, 0.1, 8),
            Car("Aston Martin DB11", "Эпический", 200000, 0.1, 8),
            Car("Bentley Continental GT", "Эпический", 220000, 0.095, 9),
            Car("Ferrari 488", "Эпический", 300000, 0.075, 12),
            Car("Lamborghini Huracan", "Эпический", 300000, 0.075, 12),
            Car("Noble M600", "Эпический", 300000, 0.075, 12),
            Car("Ferrari 812 Superfast", "Эпический", 330000, 0.0705, 13),
            Car("McLaren 720S", "Эпический", 350000, 0.065, 15),
            Car("Rolls-Royce Phantom", "Эпический", 400000, 0.06, 17),
            Car("Lamborghini Aventador", "Эпический", 400000, 0.06, 17),
            Car("Aston Martin DB5", "Эпический", 600000, 0.05, 20),
            Car("Mercedes-Benz 300SL", "Эпический", 750000, 0.04, 23),
            Car("Jaguar E-Type", "Эпический", 800000, 0.0375, 24),
            Car("Ford GT40", "Эпический", 950000, 0.032, 29),
            Car("Pagani Zonda", "Эпический", 1000000, 0.03, 35),
            Car("Lamborghini Miura", "Эпический", 1000000, 0.03, 35),
            Car("Bugatti Veyron", "Эпический", 1000000, 0.03, 35),
            Car("Shelby Cobra", "Эпический", 1200000, 0.026, 41),
            Car("McLaren F1", "Эпический", 1200000, 0.026, 41),
            Car("Lamborghini Countach", "Эпический", 1200000, 0.026, 41),
            Car("Ferrari F50", "Эпический", 1400000, 0.022, 44),
            Car("Ferrari LaFerrari", "Эпический", 1500000, 0.02, 46),
            Car("Bugatti Type 35", "Эпический", 1800000, 0.014, 70),

            Car("Lamborghini Centenario", "Легендарный", 2000000, 0.01, 100),
            Car("McLaren Speedtail", "Легендарный", 2000000, 0.01, 100),
            Car("Bugatti EB110", "Легендарный", 2000000, 0.01, 100),
            Car("Maybach 62", "Легендарный", 2000000, 0.01, 100),
            Car("Ferrari 275 GTB", "Легендарный", 2400000, 0.0092, 112),
            Car("Ferrari F40", "Легендарный", 2500000, 0.009, 115),
            Car("Pagani Huayra", "Легендарный", 2600000, 0.009, 115),
            Car("Koenigsegg Regera", "Легендарный", 3000000, 0.008, 130),
            Car("Porsche 917", "Легендарный", 3000000, 0.008, 130),
            Car("Porsche 917K", "Легендарный", 3000000, 0.008, 130),
            Car("Bugatti Chiron", "Легендарный", 3000000, 0.008, 130),
            Car("Lamborghini Sian", "Легендарный", 3000000, 0.008, 130),
            Car("Koenigsegg Jesko", "Легендарный", 3000000, 0.008, 130),
            Car("Pagani Huayra Roadster", "Легендарный", 3000000, 0.008, 130),
            Car("Pagani Huayra BC", "Легендарный", 3000000, 0.008, 130),
            Car("Aston Martin Vulcan", "Легендарный", 3500000, 0.007, 145),
            Car("Koenigsegg Agera RS", "Легендарный", 3500000, 0.007, 145),
            Car("Mercedes-Benz CLK GTR", "Легендарный", 4000000, 0.006, 160),
            Car("Lamborghini Veneno", "Легендарный", 4000000, 0.006, 160),
            Car("McLaren F1 LM", "Легендарный", 4000000, 0.006, 160),
            Car("Bugatti Tourbillon", "Легендарный", 4000000, 0.006, 160),
            Car("Bugatti Divo", "Легендарный", 5000000, 0.0055, 170),
            Car("Aston Martin DB5 Goldfinger", "Легендарный", 6000000, 0.005, 190),
            Car("Maybach Exelero", "Легендарный", 8000000, 0.004, 225),
            Car("Bugatti Centodieci", "Легендарный", 8800000, 0.004, 225),
            Car("Ferrari SP1", "Легендарный", 10000000, 0.003, 350),
            Car("Bugatti La Voiture Noire", "Легендарный", 12000000, 0.002, 500),
            Car("Rolls-Royce Sweptail", "Легендарный", 13000000, 0.00175, 700),
            Car("Pagani Zonda HP Barchetta", "Легендарный", 17000000, 0.001, 1300),
            Car("Ferrari 330 P4", "Легендарный", 18000000, 0.0009, 1500),

            Car("Saleen S7 Twin Turbo", "Эксклюзивный", 600000, 0.4, 180),
            Car("TVR Cerbera Speed 12", "Эксклюзивный", 750000, 0.3, 100),
            Car("McLaren Senna", "Эксклюзивный", 1400000, 0.2, 270),
            Car("Porsche Carrera GT", "Эксклюзивный", 1500000, 0.175, 300),

            Car("McLaren P1", "Эксклюзивный", 1700000, 0.15, 350),
            Car("Volkswagen W12 Nardo", "Эксклюзивный", 3000000, 0.1, 625),
            Car("Maserati Birdcage 75th", "Эксклюзивный", 3500000, 0.09, 750),
            Car("Koenigsegg CCGT", "Эксклюзивный", 4500000, 0.07, 1000)
        ]
        self.se1_570s_done = False
        self.se1_720s_done = False
        self.se1_speedtail_done = False
        self.se1_bonus_done = False
        self.se2_570s_done = False
        self.se2_f1_done = False
        self.se2_f1lm_done = False
        self.se2_bonus_done = False

    def _has_car_in_garage(self, name):
        return any(c.name == name for c in garage)

    def _record_rarity(self, car):
        global common_cars, uncommon_cars, rare_cars, epic_cars, legendary_cars, exclusive_cars
        rarity = car.rarity.strip()
        if rarity == "Обычный":
            common_cars += 1
        elif rarity == "Необычный":
            uncommon_cars += 1
        elif rarity == "Редкий":
            rare_cars += 1
        elif rarity == "Эпический":
            epic_cars += 1
        elif rarity == "Легендарный":
            legendary_cars += 1
        elif rarity == "Эксклюзивный":
            exclusive_cars += 1

    def _do_spin(self, min_index=0, max_index=None, se_mode=False):
        global ourcar, chance_mult
        if max_index is None:
            max_index = len(self.car) - 9
        tries = 0
        while True:
            carnum = random.randint(min_index, max_index)
            ourcar = self.car[carnum]
            ourcarchance = ourcar.base_chance * 100000 * chance_mult
            spinresult = random.randint(0, 10000000)
            if spinresult <= ourcarchance:
                if se_mode:
                    print(f"Вы выиграли машину {ourcar.name}")
                    sleep(1)
                else:
                    print(f"Вы выиграли машину {ourcar.name} стоимостью {ourcar.value} {ourcar.rarity}")
                    self._record_rarity(ourcar)
                    print(common_cars, uncommon_cars, rare_cars, epic_cars, legendary_cars, exclusive_cars)
                return True
            tries += 1
            if tries > 100:
                print("За сто попыток ничего не выпало!")
                return False

    def spin_wheel(self):
        return self._do_spin()

    def spin_wheel_se11(self):
        return self._do_spin(50, len(self.car) - 9, se_mode=True)

    def spin_wheel_se12(self):
        return self._do_spin(80, len(self.car) - 9, se_mode=True)

    def spin_wheel_se21(self):
        return self._do_spin(50, len(self.car) - 9, se_mode=True)

    def spin_wheel_se22(self):
        return self._do_spin(80, len(self.car) - 9, se_mode=True)

    def play(self):
        global money, tokens, garage, chance_mult, garage_cap, chance_mult_cost, chance_slot_cost
        print("Добро пожаловать в Cars RNG! Открывайте кейсы с автомобилями, зарабатывайте деньги и расширяйте свой гараж")
        while True:
            action = input("Введите 's', чтобы закрутить колесо, или 'as', чтобы колесо крутилось автоматически! ").strip().lower()
            if action == 's':
                if self.spin_wheel():
                    action2 = input("Введите 's', если хотите продать машину, или 'a', если хотите оставить: ").strip().lower()
                    if action2 == 'a':
                        if len(garage) >= garage_cap:
                            print(f"Гараж полон ({garage_cap} мест). Продайте машину или расширьте гараж (bs).")
                        else:
                            garage.append(ourcar)
                            print(f"{ourcar.name} добавлена в гараж.")
                    elif action2 == 's':
                        money += ourcar.value
                        print(f"Машина продана за {ourcar.value}. Баланс: {money}")
            elif action == 'as':
                while True:
                    self.spin_wheel()
                    sleep(1)
            elif action == 'se1':
                if self._has_car_in_garage("McLaren 570S") and not self.se1_570s_done:
                    self.se1_570s_done = True
                    for _ in range(10):
                        self.spin_wheel_se11()
                if self._has_car_in_garage("McLaren 720S") and not self.se1_720s_done:
                    self.se1_720s_done = True
                    for _ in range(15):
                        self.spin_wheel_se11()
                if self._has_car_in_garage("McLaren Speedtail") and not self.se1_speedtail_done:
                    self.se1_speedtail_done = True
                    for _ in range(10):
                        self.spin_wheel_se12()
                if (self.se1_570s_done and self.se1_720s_done and self.se1_speedtail_done
                        and not self.se1_bonus_done):
                    self.se1_bonus_done = True
                    for _ in range(25):
                        self.spin_wheel_se12()
            elif action == 'se2':
                if self._has_car_in_garage("McLaren 570S") and not self.se2_570s_done:
                    self.se2_570s_done = True
                    for _ in range(10):
                        self.spin_wheel_se21()
                if self._has_car_in_garage("McLaren F1") and not self.se2_f1_done:
                    self.se2_f1_done = True
                    for _ in range(25):
                        self.spin_wheel_se21()
                if self._has_car_in_garage("McLaren F1 LM") and not self.se2_f1lm_done:
                    self.se2_f1lm_done = True
                    for _ in range(20):
                        self.spin_wheel_se22()
                if (self.se2_570s_done and self.se2_f1_done and self.se2_f1lm_done
                        and not self.se2_bonus_done):
                    self.se2_bonus_done = True
                    for _ in range(50):
                        self.spin_wheel_se22()
            elif action == 'b':
                action2 = input("Введите 't', если хотите обменять деньги на токены, или 'm', если наоборот: ").strip().lower()
                if action2 == 't':
                    amount = int(input("Сколько денег вы хотите обменять? "))
                    if amount > money:
                        print("У вас недостаточно денег")
                    elif amount <= 0:
                        print("Сумма должна быть больше нуля")
                    else:
                        money -= amount
                        tokens += amount / 50000
                        print(f"Обмен выполнен. Деньги: {money}, токены: {tokens}")
                elif action2 == 'm':
                    amount = int(input("Сколько токенов вы хотите обменять? "))
                    if amount > tokens:
                        print("У вас недостаточно токенов")
                    elif amount <= 0:
                        print("Сумма должна быть больше нуля")
                    else:
                        tokens -= amount
                        money += amount * 30000
                        print(f"Обмен выполнен. Деньги: {money}, токены: {tokens}")
            elif action == 'g':
                if garage:
                    for car in garage:
                        print(car)
                else:
                    print("Гараж пуст.")
            elif action == 'bu':
                if money < chance_mult_cost:
                    print("У вас недостаточно денег")
                else:
                    money -= chance_mult_cost
                    chance_mult += 0.1
                    print(f"Шанс улучшен до x{chance_mult:.1f}. Баланс: {money}")
            elif action == 'bs':
                if money < chance_slot_cost:
                    print("У вас недостаточно денег")
                else:
                    money -= chance_slot_cost
                    garage_cap += 1
                    print(f"Гараж расширен до {garage_cap} мест. Баланс: {money}")
            elif action == 'sp':
                print('''Список команд:
                    sp - список команд
                    s - крутить колесо
                        s - продать машину (только после прокрутки)
                        a - добавить машину в гараж
                    as - крутить колесо автоматически (Ctrl+C для остановки)
                    se1, se2 - спецсобытия McLaren
                    bu - купить улучшение шанса
                    bs - купить место в гараже
                    g - показать гараж
                    b - зайти в банк
                ''')
            else:
                print("Неверная команда. Введите 'sp' для списка команд.")
common_cars = 0
uncommon_cars = 0
rare_cars = 0
epic_cars = 0
legendary_cars = 0
exclusive_cars = 0
money = 0
tokens = 0
garage = []
inventory = []
garage_cap = 20
chance_slot_cost = 50000
chance_mult_cost = 20000
chance_mult = 1
if __name__ == "__main__":
    s = spin()
    s.play()
'''
'''