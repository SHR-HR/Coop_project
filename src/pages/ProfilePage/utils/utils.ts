// Утилиты для работы с аватарами пользователей
// Функции для обработки, проверки и конвертации изображений для аватаров

// Тип для настроек обработки аватара
export type AvatarOptions = {
    maxSide?: number;           // Максимальная сторона изображения в пикселях (по умолчанию 256)
    mime?: string;              // MIME тип для выходного изображения (по умолчанию "image/webp")
    quality?: number;           // Качество сжатия от 0 до 1 (по умолчанию 0.85)
    maxBytesAnimated?: number;  // Максимальный размер анимированного изображения в байтах (по умолчанию 5MB)
};

// Вспомогательная функция для чтения текста из массива байтов
// Преобразует последовательность байтов в строку
const textFrom = (bytes: Uint8Array, start: number, len: number) =>
    String.fromCharCode(...bytes.slice(start, start + len));

// Функция для чтения начала файла (заголовка) для анализа формата
async function readHead(file: File, cap = 128 * 1024): Promise<Uint8Array> {
    // file.slice(0, Math.min(file.size, cap)) - читаем первые cap байт файла (или весь файл если он меньше)
    // arrayBuffer() - преобразуем в ArrayBuffer
    // new Uint8Array(buf) - создаем массив байтов для удобной работы
    const buf = await file.slice(0, Math.min(file.size, cap)).arrayBuffer();
    return new Uint8Array(buf);
}

// Функция для определения является ли GIF анимированным
function isAnimatedGIF(head: Uint8Array): boolean {
    // Проверка сигнатуры GIF файла (должна быть "GIF87a" или "GIF89a")
    const sig = textFrom(head, 0, 6);
    if (!(sig === "GIF87a" || sig === "GIF89a")) return false;

    // Подсчет количества кадров в GIF
    // 0x2c (44) - код начала блока изображения в GIF
    let frames = 0;
    for (let i = 0; i < head.length; i++) {
        if (head[i] === 0x2c) {
            frames++;
            // Если найдено больше одного кадра - GIF анимированный
            if (frames > 1) return true;
        }
    }
    return false;
}

// Функция для определения является ли PNG анимированным (APNG)
function isAnimatedPNG(head: Uint8Array): boolean {
    // Проверка сигнатуры PNG файла (8 байт)
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < pngSignature.length; i++) {
        if (head[i] !== pngSignature[i]) return false;
    }

    // Поиск блока "acTL" (animation control) в PNG
    // "acTL" указывает что это анимированный PNG (APNG)
    const needle = "acTL";
    const hay = new TextDecoder().decode(head);
    return hay.includes(needle);
}

// Функция для чтения 32-битного числа в little-endian формате
function readU32LE(bytes: Uint8Array, off: number): number {
    // Объединение 4 байт в 32-битное число (little-endian порядок)
    return bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
}

// Функция для определения является ли WebP анимированным
function isAnimatedWebP(head: Uint8Array): boolean {
    // Проверка сигнатуры WebP файла ("RIFF" и "WEBP")
    if (textFrom(head, 0, 4) !== "RIFF") return false;
    if (textFrom(head, 8, 4) !== "WEBP") return false;

    // Анализ чанков WebP файла
    let p = 12; // Начало после заголовка "RIFF" и "WEBP"
    while (p + 8 <= head.length) {
        const fourCC = textFrom(head, p, 4);  // 4-символьный код чанка
        const size = readU32LE(head, p + 4);  // Размер чанка
        const dataStart = p + 8;              // Начало данных чанка

        // Проверка чанка VP8X (расширенный WebP)
        if (fourCC === "VP8X") {
            const flags = head[dataStart];
            // Бит 0x02 указывает на анимацию
            if ((flags & 0x02) !== 0) return true;
        }

        // Проверка на чанки анимации
        if (fourCC === "ANIM" || fourCC === "ANMF") return true;

        // Переход к следующему чанку
        const chunkLen = 8 + ((size + 1) & ~1); // Выравнивание до четного числа
        p += chunkLen;
    }
    return false;
}

// Функция для чтения файла как Data URL
async function readAsDataURL(file: File): Promise<string> {
    return await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onerror = () => rej(fr.error || new Error("readAsDataURL error"));
        fr.onload = () => res(String(fr.result));
        fr.readAsDataURL(file);
    });
}

// Функция для загрузки изображения как ImageBitmap или HTMLImageElement
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
    try {
        // Пытаемся использовать современный API createImageBitmap
        return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        // Fallback для старых браузеров - создаем HTMLImageElement
        const blobURL = URL.createObjectURL(file);
        try {
            const img = await new Promise<HTMLImageElement>((res, rej) => {
                const i = new Image();
                i.onload = () => res(i);
                i.onerror = rej;
                i.src = blobURL;
            });
            return img;
        } finally {
            // Всегда освобождаем URL объекта
            URL.revokeObjectURL(blobURL);
        }
    }
}

// Основная функция для конвертации файла в Data URL аватара
export async function fileToAvatarDataURL(
    file: File,                    // Входной файл изображения
    {                             // Опции с значениями по умолчанию
        maxSide = 256,
        mime = "image/webp",
        quality = 0.85,
        maxBytesAnimated = 5 * 1024 * 1024
    }: AvatarOptions = {}
): Promise<{ dataURL: string; animated: boolean; mime: string }> {

    // Проверка что файл является изображением
    if (!file.type.startsWith("image/")) {
        throw new Error("Пожалуйста, выберите изображение.");
    }

    // Чтение заголовка файла для анализа
    const head = await readHead(file);

    // Определение является ли изображение анимированным
    const animated =
        (file.type === "image/gif" && isAnimatedGIF(head)) ||
        (file.type === "image/webp" && isAnimatedWebP(head)) ||
        (file.type === "image/png" && isAnimatedPNG(head));

    // Обработка анимированных изображений
    if (animated) {
        if (file.size > maxBytesAnimated) {
            throw new Error("Анимированное изображение слишком большое (> лимита).");
        }
        // Для анимированных изображений просто читаем как Data URL без обработки
        const dataURL = await readAsDataURL(file);
        return { dataURL, animated: true, mime: file.type };
    }

    // Обработка статических изображений

    // Загрузка изображения для обработки
    const bmp = await loadBitmap(file);
    const width = (bmp as any).width;    // Ширина исходного изображения
    const height = (bmp as any).height;  // Высота исходного изображения

    // Расчет масштаба для ресайза
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));  // Новая ширина
    const h = Math.max(1, Math.round(height * scale)); // Новая высота

    // Создание canvas для обработки изображения
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");

    // Настройка качества рендеринга
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Отрисовка изображения на canvas с новыми размерами
    ctx.drawImage(bmp as any, 0, 0, w, h);

    // Конвертация canvas в Data URL с указанным форматом и качеством
    let out = canvas.toDataURL(mime, quality);

    // Fallback для браузеров которые не поддерживают WebP
    if (mime === "image/webp" && out.startsWith("data:image/png")) {
        out = canvas.toDataURL("image/png");
    }

    // Возврат результата с определением фактического MIME типа
    return { dataURL: out, animated: false, mime: out.substring(5, out.indexOf(";")) };
}


// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. ОБРАБОТКА РАЗЛИЧНЫХ ФОРМАТОВ ИЗОБРАЖЕНИЙ:
//    - GIF: проверка на анимацию через подсчет кадров
//    - PNG: поиск блока "acTL" для APNG
//    - WebP: анализ чанков для определения анимации
//    - Поддержка как статических так и анимированных форматов

// 2. ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ:
//    - Чтение только начала файла (128KB) для анализа
//    - Использование createImageBitmap для эффективной декодирования
//    - Fallback на HTMLImageElement для старых браузеров
//    - Правильное освобождение ресурсов (URL.revokeObjectURL)

// 3. КОНТРОЛЬ КАЧЕСТВА И РАЗМЕРА:
//    - Автоматический ресайз до maxSide пикселей
//    - Настройка качества сжатия (0.85 - хороший баланс)
//    - Ограничение размера анимированных файлов (5MB)
//    - Сохранение пропорций изображения

// 4. БЕЗОПАСНОСТЬ И ОБРАБОТКА ОШИБОК:
//    - Проверка что файл является изображением
//    - Обработка ошибок декодирования
//    - Fallback механизмы для разных браузеров
//    - Ясные сообщения об ошибках на русском языке

// 5. WebP ПРИОРИТЕТ И FALLBACK:
//    - WebP как формат по умолчанию (лучшее сжатие)
//    - Автоматический fallback на PNG если WebP не поддерживается
//    - Определение фактического использованного формата

// 6. РАБОТА С БИНАРНЫМИ ДАННЫМИ:
//    - Uint8Array для эффективной работы с байтами
//    - Анализ бинарных сигнатур форматов
//    - Little-endian чтение чисел для WebP

// 7. АСИНХРОННОСТЬ И PROMISES:
//    - Весь код асинхронный для неблокирующей работы
//    - Правильная обработка Promise и ошибок
//    - Использование async/await для читаемости

// 8. ИСПОЛЬЗОВАНИЕ В ПРОФИЛЕ ПОЛЬЗОВАТЕЛЯ:
//    - Оптимизация аватаров для быстрой загрузки
//    - Поддержка анимированных аватаров (GIF, WebP, APNG)
//    - Единообразный размер всех аватаров
//    - Автоматическое сжатие без потери визуального качества