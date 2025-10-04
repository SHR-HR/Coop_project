// Импорт функций и типов из Redux Toolkit для создания slice
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// Импорт типа PayloadAction для типизации действий с полезной нагрузкой
import type { PayloadAction } from "@reduxjs/toolkit";
// Импорт API клиента для выполнения запросов к серверу
import { api } from "../../api/api";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";
// Импорт TypeScript типов для статистики
import type { MyStatistic, UserStatistic } from "../../shared/types/types";

/**
 * Режимы сортировки для Главной (Dashboard/Overview).
 * - completedDesc — по выполненным задачам, по убыванию.
 * - failedDesc    — по просроченным, по убыванию.
 * - inWorkDesc    — по «в работе», по убыванию.
 * - nameAsc       — по имени, A→Z.
 */
// Определение типа для режимов сортировки таблицы пользователей
export type SortMode = "completedDesc" | "nameAsc" | "failedDesc" | "inWorkDesc";

// Определение интерфейса для состояния статистики
interface StatisticsState {
    global: UserStatistic[];      // Массив глобальной статистики всех пользователей
    my: MyStatistic | null;       // Статистика текущего пользователя или null если не авторизован
    loading: boolean;             // Флаг загрузки данных
    error: string | null;         // Сообщение об ошибке или null если ошибок нет
    sortMode: SortMode;           // Текущий режим сортировки таблицы
}

// Чтение сохраненного режима сортировки из localStorage
// localStorage.getItem получает значение по ключу "dashboard:sortMode"
// as SortMode | null - приведение типа TypeScript
// ?? null - оператор нулевого слияния, возвращает null если значение не найдено
const persistedSort =
    (localStorage.getItem("dashboard:sortMode") as SortMode | null) ?? null;

// Начальное состояние slice статистики
const initialState: StatisticsState = {
    global: [],                    // Пустой массив глобальной статистики
    my: null,                      // Нет данных о текущем пользователе
    loading: false,                // Флаг загрузки не активен
    error: null,                   // Нет ошибок
    sortMode: persistedSort ?? "completedDesc",  // Режим сортировки из localStorage или "completedDesc" по умолчанию
};

/** Глобальная статистика — PUBLIC (без авторизации). */
// Создание асинхронного thunk действия для загрузки глобальной статистики
// createAsyncThunk создает действие для асинхронных операций
// <UserStatistic[]> - тип возвращаемого значения (массив статистики пользователей)
// <void> - тип аргумента (не принимает аргументов)
// <{ rejectValue: string }> - тип конфигурации (возвращает строку при ошибке)
export const fetchGlobalStatistic = createAsyncThunk<
    UserStatistic[],
    void,
    { rejectValue: string }
>(
    // Уникальное имя действия: "statistics/fetchGlobal"
    "statistics/fetchGlobal",
    // Асинхронная функция-исполнитель
    async (_, { rejectWithValue }) => {
        try {
            // Вызов API для получения глобальной статистики
            return await api.statisticsApi.getGlobal();
        } catch (err: unknown) {
            // Обработка ошибок с извлечением понятного сообщения
            const msg =
                err instanceof Error
                    ? err.message  // Если ошибка является экземпляром Error, берем message
                    : (err as any)?.response?.data?.detail ?? "Ошибка загрузки глобальной статистики"; // Иначе пытаемся извлечь из response или используем сообщение по умолчанию
            // Возврат ошибки через rejectWithValue
            return rejectWithValue(msg);
        }
    }
);

/** Моя статистика — требует Basic Auth. */
// Создание асинхронного thunk действия для загрузки статистики текущего пользователя
// <MyStatistic | null> - тип возвращаемого значения (статистика пользователя или null)
// <void> - тип аргумента (не принимает аргументов)
// <{ state: RootState; rejectValue: string }> - тип конфигурации (доступ к состоянию и возврат строки при ошибке)
export const fetchMyStatistic = createAsyncThunk<
    MyStatistic | null,
    void,
    { state: RootState; rejectValue: string }
>(
    // Уникальное имя действия: "statistics/fetchMy"
    "statistics/fetchMy",
    // Асинхронная функция-исполнитель с доступом к состоянию
    async (_, { getState, rejectWithValue }) => {
        // Получение данных аутентификации из состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Если пользователь не авторизован, возвращаем null
        if (!isAuthenticated) return null;
        try {
            // Вызов API для получения статистики текущего пользователя с учетными данными
            return await api.statisticsApi.getMy({ username, password });
        } catch (err: unknown) {
            // Обработка ошибок с извлечением понятного сообщения
            const msg =
                err instanceof Error
                    ? err.message  // Если ошибка является экземпляром Error, берем message
                    : (err as any)?.response?.data?.detail ?? "Ошибка загрузки моей статистики"; // Иначе пытаемся извлечь из response или используем сообщение по умолчанию
            // Возврат ошибки через rejectWithValue
            return rejectWithValue(msg);
        }
    }
);

// Создание slice статистики с помощью createSlice
const statisticsSlice = createSlice({
    name: "statistics",  // Имя slice для генерации типов действий
    initialState,        // Начальное состояние
    reducers: {
        // Редюсер для установки режима сортировки
        setSortMode: (state, action: PayloadAction<SortMode>) => {
            // Обновление режима сортировки в состоянии
            state.sortMode = action.payload;
        },
        // Редюсер для очистки ошибок
        clearError: (state) => {
            state.error = null;  // Установка ошибки в null
        },
        // Редюсер для сброса состояния статистики к начальному
        resetStatistics: () => initialState,
    },
    // Обработчики для асинхронных действий (extraReducers)
    extraReducers: (builder) => {
        builder
            // Обработчик для начала загрузки глобальной статистики
            .addCase(fetchGlobalStatistic.pending, (state) => {
                state.loading = true;   // Установка флага загрузки
                state.error = null;     // Очистка предыдущих ошибок
            })
            // Обработчик для успешной загрузки глобальной статистики
            .addCase(fetchGlobalStatistic.fulfilled, (state, action) => {
                state.loading = false;           // Сброс флага загрузки
                state.global = action.payload;   // Сохранение полученных данных
            })
            // Обработчик для ошибки загрузки глобальной статистики
            .addCase(fetchGlobalStatistic.rejected, (state, action) => {
                state.loading = false;  // Сброс флага загрузки
                // Сохранение сообщения об ошибке из action.payload или сообщения по умолчанию
                state.error = (action.payload as string) ?? "Неизвестная ошибка";
            })
            // Обработчик для успешной загрузки статистики текущего пользователя
            .addCase(fetchMyStatistic.fulfilled, (state, action) => {
                state.my = action.payload;  // Сохранение статистики текущего пользователя
            })
            // Обработчик для ошибки загрузки статистики текущего пользователя
            .addCase(fetchMyStatistic.rejected, (state, action) => {
                // Сохранение ошибки только если другой ошибки еще нет
                state.error = state.error ?? (action.payload as string) ?? null;
            });
    },
});

// Экспорт действий (actions) из slice
export const { setSortMode, clearError, resetStatistics } = statisticsSlice.actions;

/** Базовый селектор стейта статистики */
// Селектор для получения всего состояния статистики
export const selectStatistics = (state: RootState) => state.statistics;

/** Суммы по глобальной статистике для пончика */
// Селектор для вычисления общих сумм по всем пользователям
export const selectGlobalTotals = (state: RootState) => {
    const { global } = state.statistics;  // Получение глобальной статистики из состояния
    // Вычисление сумм с помощью reduce
    return global.reduce(
        (acc, u) => {
            acc.completed += u.completedTasks;  // Сумма выполненных задач
            acc.inWork += u.inWorkTasks;        // Сумма задач в работе
            acc.failed += u.failedTasks;        // Сумма просроченных задач
            return acc;  // Возврат аккумулятора для следующей итерации
        },
        // Начальное значение аккумулятора
        { completed: 0, inWork: 0, failed: 0 }
    );
};

// Экспорт редюсера по умолчанию
export default statisticsSlice.reducer;

// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. REDUX TOOLKIT ARCHITECTURE:
//    - createSlice автоматически генерирует actions и reducers
//    - createAsyncThunk обрабатывает асинхронные операции (запросы к API)
//    - Immer включен по умолчанию, позволяет мутировать состояние в редюсерах

// 2. ТИПИЗАЦИЯ TypeScript:
//    - SortMode - union тип для строгой проверки режимов сортировки
//    - StatisticsState - интерфейс описывает всю структуру состояния
//    - PayloadAction - типизация действий с полезной нагрузкой

// 3. PERSISTENCE (СОХРАНЕНИЕ СОСТОЯНИЯ):
//    - localStorage используется для сохранения выбора сортировки между сессиями
//    - persistedSort читает значение при инициализации приложения
//    - Ключ "dashboard:sortMode" уникален для этого функционала

// 4. АСИНХРОННЫЕ ДЕЙСТВИЯ:
//    - fetchGlobalStatistic - публичный запрос, не требует аутентификации
//    - fetchMyStatistic - приватный запрос, требует учетных данных
//    - Оба thunk обрабатывают ошибки и возвращают понятные сообщения

// 5. ОБРАБОТКА ОШИБОК:
//    - try-catch блоки в асинхронных функциях
//    - Извлечение сообщений об ошибках из разных источников (Error, response)
//    - rejectWithValue для возврата структурированных ошибок

// 6. СЕЛЕКТОРЫ:
//    - selectStatistics - базовый селектор всего состояния
//    - selectGlobalTotals - вычисляемый селектор для агрегированных данных
//    - Селекторы используются в компонентах через useSelector

// 7. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - loading флаг показывает состояние загрузки
//    - error хранит сообщения об ошибках
//    - clearError действие для очистки ошибок

// 8. АВТОРИЗАЦИЯ:
//    - fetchMyStatistic проверяет isAuthent