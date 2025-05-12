from PIL import Image, ImageDraw, ImageFont
import os

def create_receipt():
    # Пути к шрифтам
    font_regular_path = "SB-Sans-Display.ttf"      # Regular
    font_semibold_path = "SB-Sans-Display-SemiBold.ttf"    # Bold
    font_sfpro_path = "SFPRODISPLAYMEDIUM.OTF"    # SF Pro Display Medium

    # Проверка существования шрифтов
    for font_path in [font_regular_path, font_semibold_path, font_sfpro_path]:
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"Шрифт {font_path} не найден в {os.getcwd()}")

    # Входной и выходной файлы
    input_file = "balance_sber_main.png"
    output_file = "updated_receipt.png"

    # Проверка существования входного файла
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Файл {input_file} не найден в {os.getcwd()}")

    # Загрузка изображения
    template = Image.open(input_file).convert("RGBA")
    draw = ImageDraw.Draw(template)

    # Загрузка шрифтов
    font_time = ImageFont.truetype(font_sfpro_path, 18)  # Для времени
    font_amount = ImageFont.truetype(font_semibold_path, 26)  # Для суммы
    font_regular = ImageFont.truetype(font_regular_path, 12)  # Для остальных значений
    font_420 = ImageFont.truetype(font_semibold_path, 18)  # Для значения 420,52
    font_10000 = ImageFont.truetype(font_semibold_path, 23)  # Для значения 10 000

    # Цвета текста (HEX преобразованы в RGBA)
    black = (0, 0, 0, 255)  # #000000
    amount_main_color = (18, 17, 18, 255)  # #121112
    amount_decimal_color = (87, 94, 102, 255)  # #575E66
    value_420_color = (7, 8, 9, 255)  # #070809
    value_gray_color = (115, 115, 115, 255)  # #737373

    # Размер изображения
    W, H = template.size

    # --- ВРЕМЯ ---
    time_text = "12:33"
    bbox_time = draw.textbbox((0, 0), time_text, font=font_time)
    x_time = 42
    y_time = 21
    draw.text((x_time, y_time), time_text, font=font_time, fill=black)

    # --- СУММА 5 500,50 ---
    amount_main_text = "11 500"
    amount_decimal_text = ",77"

    # Размеры текста суммы
    bbox_amount_main = draw.textbbox((0, 0), amount_main_text, font=font_amount)
    amount_main_w = bbox_amount_main[2] - bbox_amount_main[0]
    amount_main_h = bbox_amount_main[3] - bbox_amount_main[1]

    bbox_amount_decimal = draw.textbbox((0, 0), amount_decimal_text, font=font_amount)
    amount_decimal_w = bbox_amount_decimal[2] - bbox_amount_decimal[0]

    # Установка точных координат для суммы
    x_amount = 18
    y_amount = 172

    # Отрисовка суммы
    draw.text((x_amount, y_amount), amount_main_text, font=font_amount, fill=amount_main_color)
    draw.text((x_amount + amount_main_w, y_amount), amount_decimal_text, font=font_amount, fill=amount_decimal_color)

    # --- ДОПОЛНИТЕЛЬНЫЕ ЗНАЧЕНИЯ ---
    values = [
        {"text": "420,52", "color": value_420_color, "x": 108, "y": 315, "font": font_420},
        {"text": "1234", "color": value_gray_color, "x": 110, "y": 269},
        {"text": "9876", "color": value_gray_color, "x": 153, "y": 344},
        {"text": "10 000", "color": black,  "x": 34, "y": 782, "font": font_10000}
    ]

    # Начальная позиция для значений (ниже суммы)
    y_current = y_amount + amount_main_h + 30
    spacing = 30  # Отступ между строками

    for value in values:
        text = value["text"]
        color = value["color"]
        font = value.get("font", font_regular)  # Используем специальный шрифт если указан, иначе обычный
        if "x" in value and "y" in value:
            # Используем точные координаты, если они указаны
            x = value["x"]
            y = value["y"]
        else:
            # Иначе центрируем текст
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            x = (W - text_w) / 2
            y = y_current
            y_current += spacing
        draw.text((x, y), text, font=font, fill=color)

    # Сохранение и отображение результата
    template.save(output_file, quality=100, optimize=False)
    template.show()

if __name__ == "__main__":
    create_receipt()