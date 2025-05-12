from PIL import Image, ImageDraw, ImageFont
import os
import json
import sys

def create_receipt(amount, name, custom_time):
    # Пути к шрифтам
    font_regular_path = "SB-Sans-Display.ttf"      # Regular
    font_semibold_path = "SB-Sans-Display-SemiBold.ttf"    # Bold (новый файл)
    

    # Проверка существования файлов
    if not os.path.exists(font_regular_path):
        raise FileNotFoundError(f"Файл шрифта {font_regular_path} не найден в {os.getcwd()}")
    if not os.path.exists(font_semibold_path):
        raise FileNotFoundError(f"Файл шрифта {font_semibold_path} не найден в {os.getcwd()}")

    # Загрузка шаблона
    template = Image.open("template_light_2.png").convert("RGBA")
    draw = ImageDraw.Draw(template)

    # Загрузка шрифтов
    font_amount = ImageFont.truetype(font_semibold_path, 33)
    font_name = ImageFont.truetype(font_semibold_path, 14)
    font_name_black = ImageFont.truetype(font_regular_path, 16)  # Больший размер для черного имени
    font_time = ImageFont.truetype(font_semibold_path, 17)  # Шрифт для времени

    # Цвет текста
    white = (255, 255, 255, 255)  # RGBA для прозрачности
    black = (0, 0, 0, 255)  # RGBA для черного цвета

    # Размер изображения
    W, H = template.size

    # --- ВРЕМЯ ---
    time_text = custom_time
    bbox_time = draw.textbbox((0, 0), time_text, font=font_time)
    time_w = bbox_time[2] - bbox_time[0]
    time_h = bbox_time[3] - bbox_time[1]

    # Позиция времени в левом верхнем углу с отступами
    x_time = 42  # Отступ слева
    y_time = 21  # Отступ сверху

    # Рисуем время
    draw.text((x_time, y_time), time_text, font=font_time, fill=white)

    # --- СУММА ---
    amount_text = amount
    bbox_amount = draw.textbbox((0, 0), amount_text, font=font_amount)
    amount_w = bbox_amount[2] - bbox_amount[0]
    amount_h = bbox_amount[3] - bbox_amount[1]

    x_amount = (W - amount_w) / 2
    y_amount = 278 - (amount_h / 2) - 16  # Поднятие на 24 пикселя (293 - 24)

    # Рисуем сумму
    draw.text((x_amount, y_amount), amount_text, font=font_amount, fill=white)

    # --- ИМЯ ---
    name_text = name
    bbox_name = draw.textbbox((0, 0), name_text, font=font_name)
    name_w = bbox_name[2] - bbox_name[0]
    name_h = bbox_name[3] - bbox_name[1]
    x_name = (W - name_w) / 2
    y_name = y_amount + amount_h + 30  # Имя ниже суммы

    # Рисуем имя белым цветом
    draw.text((x_name, y_name), name_text, font=font_name, fill=white)

    # Рисуем имя черным цветом внизу
    y_name_black = H - 161  # Позиция внизу с отступом 50 пикселей
    x_name_black = 18
    draw.text((x_name_black, y_name_black), name_text, font=font_name_black, fill=black)

    # Сохраняем результат
    template.save("check_with_name_shifted_v4.png", quality=100, optimize=False)
    template.show()

# Example usage:
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python receipt.py '{\"name\": \"John Doe\", \"amount\": \"238 000 ₽\", \"time\": \"20:09\"}'")
        sys.exit(1)
    
    try:
        # Parse the dictionary string from command line argument
        data = json.loads(sys.argv[1])
        
        # Extract values from dictionary
        amount = data.get("amount", "")
        name = data.get("name", "")
        time = data.get("time", "")
        
        # Create receipt with the data
        create_receipt(amount, name, time)
    except json.JSONDecodeError:
        print("Error: Invalid JSON format")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)