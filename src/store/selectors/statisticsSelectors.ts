// Импорт функции createSelector из Redux Toolkit для создания мемоизированных селекторов
import { createSelector } from "@reduxjs/toolkit";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";
// Импорт типа SortMode для режимов сортировки
import type { SortMode } from "../slices/statisticsSlice";
// Импорт типа UserStatistic для типизации данных пользователя
import type { UserStatistic } from "../../shared/types/types";

/** Базовый селектор для получения глобальной статистики */
// Простой селектор который возвращает массив глобальной статистики пользователей из состояния
export const selectGlobal = (s: RootState) => s.statistics.global;

/** Фабрика селектора для фильтрации по имени + onlyActive (без нулевых) */
// createSelector создает мемоизированный селектор который пересчитывается только при изменении входных данных
// makeSelectFiltered возвращает функцию селектора которая принимает параметры
export const makeSelectFiltered = () =>
    createSelector(
        [
            // Массив входных селекторов:
            selectGlobal,  // Селектор глобальной статистики
            (_: RootState, query: string) => query,  // Селектор для параметра query (поисковый запрос)
            (_: RootState, __: string, ___: SortMode, onlyActive: boolean) => onlyActive,  // Селектор для параметра onlyActive (фильтр активных пользователей)
        ],
        // Функция преобразования которая получает результаты входных селекторов
        (global, query, onlyActive) => {
            // Нормализация поискового запроса: удаление пробелов и приведение к нижнему регистру
            const q = query.trim().toLowerCase();
            // Фильтрация по имени если есть поисковый запрос, иначе возврат всего массива
            let arr = q ? global.filter((u) => u.name.toLowerCase().includes(q)) : global;

            // Дополнительная фильтрация по активным пользователям если onlyActive = true
            // Активный пользователь - у которого есть хотя бы одна задача любого типа
            if (onlyActive) {
                arr = arr.filter(
                    (u) => (u.completedTasks + u.inWorkTasks + u.failedTasks) > 0
                );
            }
            // Возврат отфильтрованного массива
            return arr;
        }
    );

/** Фабрика селектора для сортировки (стабильная; при равенстве — по имени RU) */
// createSelector создает мемоизированный селектор для сортировки данных
export const makeSelectSorted = () =>
    createSelector(
        [
            // Массив входных селекторов:
            makeSelectFiltered(),  // Селектор отфильтрованных данных
            (_: RootState, __: string, sortMode: SortMode) => sortMode,  // Селектор для параметра sortMode (режим сортировки)
        ],
        // Функция преобразования для сортировки
        (filtered, sortMode) => {
            // Создание локализованного компаратора для русского языка
            // Intl.Collator обеспечивает корректную сортировку русских символов
            const collator = new Intl.Collator("ru");
            // Создание копии массива чтобы не мутировать оригинальные данные
            const arr = [...filtered];

            // Switch по режиму сортировки
            switch (sortMode) {
                case "completedDesc":
                    // Сортировка по выполненным задачам (по убыванию), при равенстве - по имени
                    arr.sort(
                        (a, b) =>
                            b.completedTasks - a.completedTasks ||  // Сравнение по выполненным задачам (убывание)
                            collator.compare(a.name, b.name)        // При равенстве - сравнение по имени на русском
                    );
                    break;
                case "failedDesc":
                    // Сортировка по просроченным задачам (по убыванию), при равенстве - по имени
                    arr.sort(
                        (a, b) =>
                            b.failedTasks - a.failedTasks ||        // Сравнение по просроченным задачам (убывание)
                            collator.compare(a.name, b.name)        // При равенстве - сравнение по имени на русском
                    );
                    break;
                case "inWorkDesc":
                    // Сортировка по задачам в работе (по убыванию), при равенстве - по имени
                    arr.sort(
                        (a, b) =>
                            b.inWorkTasks - a.inWorkTasks ||        // Сравнение по задачам в работе (убывание)
                            collator.compare(a.name, b.name)        // При равенстве - сравнение по имени на русском
                    );
                    break;
                case "nameAsc":
                default:
                    // Сортировка по имени (по возрастанию) - режим по умолчанию
                    arr.sort((a, b) => collator.compare(a.name, b.name));
            }
            // Возврат отсортированного массива
            return arr;
        }
    );

/** Фабрика селектора для пагинации */
// createSelector создает мемоизированный селектор для разбиения данных на страницы
export const makeSelectPaginated = () =>
    createSelector(
        [
            // Массив входных селекторов:
            makeSelectSorted(),  // Селектор отсортированных данных
            (_: RootState, __: string, ___: SortMode, ____: boolean, page: number) => page,  // Селектор для параметра page (текущая страница)
            (_: RootState, __: string, ___: SortMode, ____: boolean, _____: number, pageSize: number) => pageSize,  // Селектор для параметра pageSize (размер страницы)
        ],
        // Функция преобразования для пагинации
        (sorted: UserStatistic[], page, pageSize) => {
            // Вычисление общего количества элементов
            const total = sorted.length;
            // Вычисление общего количества страниц (минимум 1 страница)
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            // Нормализация текущей страницы в допустимый диапазон
            const currentPage = Math.min(Math.max(1, page), totalPages);
            // Вычисление среза данных для текущей страницы
            const data = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            // Возврат объекта с данными и метаинформацией о пагинации
            return { data, total, totalPages, currentPage };
        }
    );

/** Селектор для сводных сумм для пончика (круговой диаграммы) */
// createSelector создает мемоизированный селектор для агрегированных данных
export const selectGlobalTotals = createSelector([selectGlobal], (global) => {
    // Вычисление сумм с помощью reduce
    return global.reduce(
        (acc, u) => {
            acc.completed += u.completedTasks;  // Суммирование выполненных задач
            acc.inWork += u.inWorkTasks;        // Суммирование задач в работе
            acc.failed += u.failedTasks;        // Суммирование просроченных задач
            return acc;  // Возврат аккумулятора для следующей итерации
        },
        // Начальное значение аккумулятора
        { completed: 0, inWork: 0, failed: 0 }
    );
});

/** Селектор для KPI + лидер по выполненным */
// createSelector создает мемоизированный селектор для ключевых показателей эффективности
export const selectGlobalKpis = createSelector([selectGlobal], (global) => {
    // Количество пользователей
    const users = global.length;
    // Инициализация переменных для сумм
    let completed = 0, inWork = 0, failed = 0;

    // Вычисление сумм через цикл for...of
    for (const u of global) {
        completed += u.completedTasks;  // Сумма выполненных задач
        inWork += u.inWorkTasks;        // Сумма задач в работе
        failed += u.failedTasks;        // Сумма просроченных задач
    }

    // Общее количество задач
    const total = completed + inWork + failed;
    // Процент выполненных задач (0..100), округленный до целого
    const doneRate = total ? Math.round((completed / total) * 100) : 0;
    // Среднее количество выполненных задач на пользователя, округленное до 2 знаков
    const avgCompletedPerUser = users ? +(completed / users).toFixed(2) : 0;

    // Создание локализованного компаратора для русского языка
    const collator = new Intl.Collator("ru");

    // Сортировка пользователей по выполненным задачам (по убыванию)
    const byCompleted = [...global].sort(
        (a, b) => b.completedTasks - a.completedTasks || collator.compare(a.name, b.name)
    );
    // Определение топ-пользователя (если у него есть выполненные задачи)
    const top = byCompleted[0]?.completedTasks > 0 ? byCompleted[0] : null;

    // Создание лидерборда из топ-5 пользователей с выполненными задачами
    const leaderboard = byCompleted
        .filter((u) => u.completedTasks > 0)  // Фильтрация пользователей с выполненными задачами
        .slice(0, 5)                          // Ограничение до 5 пользователей
        .map((u, i) => ({                     // Преобразование в формат для лидерборда
            place: i + 1,                     // Позиция в рейтинге (начинается с 1)
            id: u.id,                         // ID пользователя
            name: u.name,                     // Имя пользователя
            completed: u.completedTasks,      // Количество выполненных задач
        }));

    // Возврат объекта со всеми KPI и лидербордом
    return {
        users,                    // Количество пользователей
        total,                    // Общее количество задач
        completed,                // Количество выполненных задач
        inWork,                   // Количество задач в работе
        failed,                   // Количество просроченных задач
        doneRate,                 // Процент выполненных задач (0..100)
        avgCompletedPerUser,      // Среднее выполненных задач на пользователя
        top,                      // Топ-исполнитель (может быть null)
        leaderboard,              // Массив топ-5 пользователей для лидерборда
    };
});




// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. MEMOIZED SELECTORS (МЕМОИЗИРОВАННЫЕ СЕЛЕКТОРЫ):
//    - createSelector создает селекторы которые кэшируют результаты
//    - Пересчет происходит только при изменении входных данных
//    - Улучшает производительность при частых вызовах

// 2. SELECTOR FACTORIES (ФАБРИКИ СЕЛЕКТОРОВ):
//    - makeSelectFiltered, makeSelectSorted, makeSelectPaginated - фабрики функций
//    - Позволяют создавать параметризованные селекторы с разными аргументами
//    - Используются когда селектор зависит от динамических параметров

// 3. COMPOSITION (КОМПОЗИЦИЯ):
//    - Селекторы композируются друг с другом (makeSelectSorted использует makeSelectFiltered)
//    - Создает цепочку преобразований: фильтрация → сортировка → пагинация
//    - Каждый селектор решает одну конкретную задачу

// 4. DATA TRANSFORMATION (ПРЕОБРАЗОВАНИЕ ДАННЫХ):
//    - Фильтрация по имени и активности
//    - Сортировка по разным критериям с поддержкой русского языка
//    - Пагинация с вычислением метаданных
//    - Агрегация для KPI и лидерборда

// 5. INTERNATIONALIZATION (ИНТЕРНАЦИОНАЛИЗАЦИЯ):
//    - Intl.Collator("ru") обеспечивает корректную сортировку русских имен
//    - Учитывает особенности русского алфавита и регистра

// 6. ERROR HANDLING (ОБРАБОТКА ОШИБОК):
//    - Защита от деления на ноль (doneRate, avgCompletedPerUser)
//    - Нормализация параметров (currentPage в допустимый диапазон)
//    - Проверка существования данных (top может быть null)

// 7. PERFORMANCE OPTIMIZATION (ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ):
//    - Использование for...of вместо reduce в некоторых случаях
//    - Создание копий массивов ([...filtered]) чтобы не мутировать исходные данные
//    - Мемоизация предотвращает лишние вычисления

// 8. TYPE SAFETY (ТИПОБЕЗОПАСНОСТЬ):
//    - TypeScript типы для всех параметров и возвращаемых значений
//    - Строгая типизация входных и выходных данных селекторов
//    - Автодополнение в IDE при использовании селекторов

// 9. REUSABILITY (ПЕРЕИСПОЛЬЗУЕМОСТЬ):
//    - Селекторы могут использоваться в разных компонентах
//    - Фабричный паттерн позволяет создавать селекторы с разными параметрами
//    - Единая точка истины для преобразования данных

// 10. DATA CONSISTENCY (СОГЛАСОВАННОСТЬ ДАННЫХ):
//     - Все селекторы работают с одними и теми же исходными данными
//     - Предсказуемые преобразования и вычисления
//     - Согласованные форматы возвращаемых данных