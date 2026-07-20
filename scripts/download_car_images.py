"""Download one Wikimedia thumbnail for every car in the game catalog."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from game.car_images import CAR_IMAGES_DIR, car_image_filename
from game.cars_data import get_all_cars

USER_AGENT = "CarRNGGame image downloader/1.0"
TIMEOUT_SECONDS = 15


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def download_car(car_name: str) -> tuple[str, str]:
    target = CAR_IMAGES_DIR / car_image_filename(car_name)
    if target.exists():
        return car_name, "exists"

    title = quote(car_name.replace(" ", "_"), safe="")
    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    try:
        summary = json.loads(fetch(summary_url))
        image_url = summary.get("thumbnail", {}).get("source")
        if not image_url:
            return car_name, "not found"
        target.write_bytes(fetch(image_url))
        return car_name, "downloaded"
    except Exception as error:
        return car_name, f"failed: {error}" 


def main() -> None:
    CAR_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    car_names = sorted({car.name for car in get_all_cars()})
    counts = {"downloaded": 0, "exists": 0, "not found": 0, "failed": 0}

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(download_car, name) for name in car_names]
        for future in as_completed(futures):
            name, result = future.result()
            category = result.split(":", maxsplit=1)[0]
            counts[category] += 1
            print(f"{name}: {result}")

    print(f"Summary: {counts}")


if __name__ == "__main__":
    main()
