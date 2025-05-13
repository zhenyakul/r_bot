from PIL import Image, ImageDraw, ImageFont
import os
import json
import sys

def create_receipt(
    time_text,
    amount_main,
    amount_decimal,
    value_420,
    value_1234,
    value_9876,
    value_10000
):
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Пути к шрифтам
    font_regular_path = os.path.join(script_dir, "fonts", "SB-Sans-Text.ttf")      # Regular
    font_semibold_path = os.path.join(script_dir, "fonts", "SB-Sans-Display-Semibold.ttf")    # Bold
    font_sfpro_path = os.path.join(script_dir, "fonts", "SFPRODISPLAYMEDIUM.OTF")    # SF Pro Display Medium

    # Проверка существования шрифтов
    for font_path in [font_regular_path, font_semibold_path, font_sfpro_path]:
        if not os.path.exists(font_path):
            print(f"Error: Font file not found: {font_path}")
            raise FileNotFoundError(f"Файл шрифта {font_path} не найден")

    # Входной и выходной файлы
    input_file = os.path.join(script_dir, "balance_sber_main_1.png")
    output_file = os.path.join(script_dir, "updated_receipt.png")

    # Проверка существования входного файла
    if not os.path.exists(input_file):
        print(f"Error: Template file not found: {input_file}")
        raise FileNotFoundError(f"Файл {input_file} не найден")

    try:
        # Загрузка изображения
        template = Image.open(input_file).convert("RGBA")
        draw = ImageDraw.Draw(template)

        # Загрузка шрифтов
        font_time = ImageFont.truetype(font_sfpro_path, 18)  # Для времени
        font_amount = ImageFont.truetype(font_semibold_path, 26)  # Для суммы
        font_amount_arrow = ImageFont.truetype(font_semibold_path, 18)  # Для стрелки
        font_regular = ImageFont.truetype(font_regular_path, 12)  # Для остальных значений
        font_420 = ImageFont.truetype(font_semibold_path, 18)  # Для значения 420,52
        font_10000 = ImageFont.truetype(font_semibold_path, 23)  # Для значения 10 000

        # Цвета текста (HEX преобразованы в RGBA)
        black = (0, 0, 0, 255)  # #000000
        amount_main_color = (18, 17, 18, 255)  # #121112
        amount_decimal_color = (87, 94, 102, 255)  # #575E66
        amount_arrow_color = (144, 149, 169, 255)  # #9095A9
        value_420_color = (7, 8, 9, 255)  # #070809
        value_gray_color = (115, 115, 115, 255)  # #737373

        # Размер изображения
        W, H = template.size

        # --- ВРЕМЯ ---
        bbox_time = draw.textbbox((0, 0), time_text, font=font_time)
        x_time = 42
        y_time = 21
        draw.text((x_time, y_time), time_text, font=font_time, fill=black)

        # --- СУММА ---
        # Размеры текста суммы
        bbox_amount_main = draw.textbbox((0, 0), amount_main, font=font_amount)
        amount_main_w = bbox_amount_main[2] - bbox_amount_main[0]
        amount_main_h = bbox_amount_main[3] - bbox_amount_main[1]

        bbox_amount_decimal = draw.textbbox((0, 0), amount_decimal, font=font_amount)
        amount_decimal_w = bbox_amount_decimal[2] - bbox_amount_decimal[0]

        # Установка точных координат для суммы
        x_amount = 18
        y_amount = 172

        # Отрисовка суммы
        draw.text((x_amount, y_amount), amount_main, font=font_amount, fill=amount_main_color)
        draw.text((x_amount + amount_main_w, y_amount), "," + amount_decimal + "₽", font=font_amount, fill=amount_decimal_color)
        draw.text((x_amount + amount_main_w + 63, y_amount + 5), ">", font=font_amount_arrow, fill=amount_arrow_color)

        # --- ДОПОЛНИТЕЛЬНЫЕ ЗНАЧЕНИЯ ---
        values = [
            {"text": value_420, "color": value_420_color, "x": 108, "y": 315, "font": font_420},
            {"text": value_1234, "color": value_gray_color, "x": 110, "y": 269},
            {"text": value_9876, "color": value_gray_color, "x": 153, "y": 344},
            {"text": value_10000, "color": black,  "x": 34, "y": 782, "font": font_10000}
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
        print(f"Successfully saved receipt to: {output_file}")
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python receipt_sber_bill.py '{\"time\": \"14:25\", \"amount\": \"15 750\", \"amount_decimal\": \",50\", \"value_420\": \"420,52\", \"value_1234\": \"5678\", \"value_9876\": \"4321\", \"value_10000\": \"15 000\"}'")
        sys.exit(1)
    
    try:
        # Parse the dictionary string from command line argument
        data = json.loads(sys.argv[1])
        
        # Extract values from dictionary
        time_text = data.get("time", "")
        amount_main = data.get("amount", "")
        amount_decimal = data.get("amount_decimal", "")
        value_420 = data.get("value_420", "")
        value_1234 = data.get("value_1234", "")
        value_9876 = data.get("value_9876", "")
        value_10000 = data.get("value_10000", "")
        
        # Create receipt with the data
        create_receipt(
            time_text=time_text,
            amount_main=amount_main,
            amount_decimal=amount_decimal,
            value_420=value_420,
            value_1234=value_1234,
            value_9876=value_9876,
            value_10000=value_10000
        )
    except json.JSONDecodeError:
        print("Error: Invalid JSON format")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)