import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from aiogram.types import FSInputFile

CAR_IMAGES_DIR = Path(__file__).resolve().parent.parent / "assets" / "cars"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

CYRILLIC_TRANSLIT = str.maketrans(
    {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "y",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "h",
        "ц": "ts",
        "ч": "ch",
        "ш": "sh",
        "щ": "sch",
        "ы": "y",
        "э": "e",
        "ю": "yu",
        "я": "ya",
        "ь": "",
        "ъ": "",
    }
)

CAR_IMAGE_ALIASES = {
    "citroends": "citroen_ds3",
    "hondafit": "honda_jazz",
    "toyota86": "toyota_gr86",
    "bmw2series": "bmw_m2",
    "shelbycobra": "ac_cobra",
    "paganizonda": "pagani_zonda_c12",
    "koenigseggagerars": "koenigsegg_agera",
}


def _ascii_name(value: str) -> str:
    translated = value.lower().translate(CYRILLIC_TRANSLIT)
    return unicodedata.normalize("NFKD", translated).encode("ascii", "ignore").decode()


def _image_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _ascii_name(value))


def car_image_filename(car_name: str) -> str:
    normalized = _ascii_name(car_name)
    slug = re.sub(r"[^a-z0-9]+", "_", normalized).strip("_") or "car"
    return f"{CAR_IMAGE_ALIASES.get(_image_key(car_name), slug)}.jpg"


@lru_cache(maxsize=1)
def _image_index() -> dict[str, Path]:
    if not CAR_IMAGES_DIR.is_dir():
        return {}

    images: dict[str, Path] = {}
    for image_path in CAR_IMAGES_DIR.iterdir():
        if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        images.setdefault(_image_key(image_path.stem), image_path)
    return images


def get_car_photo(car_name: str) -> FSInputFile | None:
    image_key = _image_key(car_name)
    alias = CAR_IMAGE_ALIASES.get(image_key)
    image_path = _image_index().get(_image_key(alias) if alias else image_key)
    if image_path is None or not image_path.is_file():
        return None
    return FSInputFile(image_path)
