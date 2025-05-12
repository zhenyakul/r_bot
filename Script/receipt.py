from PIL import Image, ImageDraw, ImageFont
import os

def create_receipt(amount, name, custom_time):
    # Пути к шрифтам
    font_regular_path = "SB-Sans-Display.ttf"      # Regular
    font_semibold_path = "SB-Sans-Display-SemiBold.ttf"    # Bold
    font_sfpro_path = "SFPRODISPLAYMEDIUM.OTF"    # SF Pro Display Medium для времени

    # Проверка существования файлов шрифтов
    for font_path in [font_regular_path, font_semibold_path, font_sfpro_path]:
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"Файл шрифта {font_path} не найден в {os.getcwd()}")

    # Шаблоны и имена выходных файлов
    templates = [
        {"file": "template_light_upd.png", "output": "check_light.png", "name_color_bottom": (0, 0, 0, 255)},  # Черное имя внизу
        {"file": "template_dark.png", "output": "check_dark.png", "name_color_bottom": (255, 255, 255, 255)}  # Белое имя внизу
    ]

    # Загрузка шрифтов
    font_amount = ImageFont.truetype(font_semibold_path, 33)
    font_name = ImageFont.truetype(font_semibold_path, 14)
    font_name_black = ImageFont.truetype(font_regular_path, 16)  # Больший размер для имени внизу
    font_time = ImageFont.truetype(font_sfpro_path, 18)  # Шрифт SF Pro для времени

    # Цвет текста
    white = (255, 255, 255, 255)  # RGBA для прозрачности

    for template_info in templates:
        template_file = template_info["file"]
        output_file = template_info["output"]
        name_color_bottom = template_info["name_color_bottom"]

        # Проверка существования шаблона
        if not os.path.exists(template_file):
            raise FileNotFoundError(f"Файл шаблона {template_file} не найден в {os.getcwd()}")

        # Загрузка шаблона
        template = Image.open(template_file).convert("RGBA")
        draw = ImageDraw.Draw(template)

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

        # Рисуем имя внизу (цвет зависит от шаблона)
        y_name_black = H - 161  # Позиция внизу с отступом 50 пикселей
        x_name_black = 18
        draw.text((x_name_black, y_name_black), name_text, font=font_name_black, fill=name_color_bottom)

        # Сохраняем результат
        template.save(output_file, quality=100, optimize=False)
        template.show()

# Пример использования:
if __name__ == "__main__":
    create_receipt("238 000 ₽", "Сунь Хуй С.", "20:09")