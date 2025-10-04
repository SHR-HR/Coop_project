// Импорт функций createAsyncThunk и createSlice из Redux Toolkit для создания асинхронных действий и срезов состояния
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// Импорт API объекта для выполнения запросов к серверу
import { api } from "../../api/api";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";
// Импорт типов Credentials, Task, TaskCreatePayload из файла с типами
import type { Credentials, Task, TaskCreatePayload } from "../../shared/types/types";

// Определение интерфейса для состояния делегированных задач
interface DelegatedTasksState {
    // Массив задач
    tasks: Task[];
    // Флаг, указывающий выполняется ли в данный момент запрос
    loading: boolean;
    // Сообщение об ошибке или null если ошибок нет
    error: string | null;
}

// Начальное состояние для среза делегированных задач
const initialState: DelegatedTasksState = {
    // Пустой массив задач по умолчанию
    tasks: [],
    // Загрузка не выполняется по умолчанию
    loading: false,
    // Ошибок нет по умолчанию
    error: null,
};

// Создание асинхронного действия для получения списка делегированных задач
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Task[])
// - второй: тип аргументов (объект с start и limit)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const fetchDelegatedTasks = createAsyncThunk<
    Task[],
    { start?: number; limit?: number },
    { state: RootState; rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("delegatedTasks/fetchDelegatedTasks", async ({ start = 0, limit = 10 }, { getState, rejectWithValue }) => {
        // Получение состояния аутентификации из глобального состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Блок try для обработки успешного выполнения
        try {
            // Создание объекта учетных данных если пользователь аутентифицирован
            const creds: Credentials | undefined = isAuthenticated ? { username, password } : undefined;
            // Вызов API метода для получения задач с пагинацией
            return await api.delegatedTasksApi.getTasks(creds, start, limit);
            // Блок catch для обработки ошибок
        } catch (error: any) {
            // Получение статуса ошибки из ответа сервера
            const status = error?.response?.status;
            // Проверка если статус ошибки 401 (неавторизован)
            if (status === 401) {
                // Возврат ошибки с сообщением о необходимости авторизации
                return rejectWithValue("Доступ запрещён: войдите в систему");
            }
            // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
            return rejectWithValue(error?.response?.data?.detail || "Ошибка загрузки задач");
        }
    });

// Создание асинхронного действия для удаления делегированной задачи
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (number - ID удаленной задачи)
// - второй: тип аргументов (number - ID задачи для удаления)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const deleteDelegatedTask = createAsyncThunk<
    number,
    number,
    { state: RootState; rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("delegatedTasks/deleteDelegatedTask", async (taskId: number, { getState, rejectWithValue }) => {
        // Получение состояния аутентификации из глобального состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Блок try для обработки успешного выполнения
        try {
            // Создание объекта учетных данных если пользователь аутентифицирован
            const creds: Credentials | undefined = isAuthenticated ? { username, password } : undefined;
            // Вызов API метода для удаления задачи по ID
            await api.delegatedTasksApi.deleteTask(taskId, creds);
            // Возврат ID удаленной задачи для обновления состояния
            return taskId;
            // Блок catch для обработки ошибок
        } catch (error: any) {
            // Получение статуса ошибки из ответа сервера
            const status = error?.response?.status;
            // Проверка если статус ошибки 401 (неавторизован)
            if (status === 401) {
                // Возврат ошибки с сообщением о необходимости авторизации
                return rejectWithValue("Доступ запрещён: войдите в систему");
            }
            // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
            return rejectWithValue(error?.response?.data?.detail || "Ошибка удаления задачи");
        }
    });

// Создание асинхронного действия для обновления делегированной задачи
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Task - обновленная задача)
// - второй: тип аргументов (объект с taskId и update данными)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const updateDelegatedTask = createAsyncThunk<
    Task,
    { taskId: number; update: Partial<Pick<TaskCreatePayload, "title" | "description" | "deadline">> },
    { state: RootState; rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("delegatedTasks/updateDelegatedTask", async ({ taskId, update }, { getState, rejectWithValue }) => {
        // Получение состояния аутентификации из глобального состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Блок try для обработки успешного выполнения
        try {
            // Создание объекта учетных данных если пользователь аутентифицирован
            const creds: Credentials | undefined = isAuthenticated ? { username, password } : undefined;
            // Вызов API метода для обновления задачи с переданными данными
            return await api.delegatedTasksApi.updateTask(taskId, update, creds);
            // Блок catch для обработки ошибок
        } catch (error: any) {
            // Получение статуса ошибки из ответа сервера
            const status = error?.response?.status;
            // Проверка если статус ошибки 401 (неавторизован)
            if (status === 401) {
                // Возврат ошибки с сообщением о необходимости авторизации
                return rejectWithValue("Доступ запрещён: войдите в систему");
            }
            // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
            return rejectWithValue(error?.response?.data?.detail || "Ошибка обновления задачи");
        }
    });

// Создание среза (slice) для управления состоянием делегированных задач
export const delegatedTasksSlice = createSlice({
    // Уникальное имя среза
    name: "delegatedTasks",
    // Начальное состояние
    initialState,
    // Синхронные редюсеры (редюсеры для синхронных действий)
    reducers: {
        // Редюсер для очистки ошибок
        clearError: (state) => {
            // Установка ошибки в null
            state.error = null;
        },
    },
    // Дополнительные редюсеры для обработки асинхронных действий
    extraReducers: (builder) => {
        // Использование builder для цепочного добавления обработчиков
        builder
            // Обработчики для действия fetchDelegatedTasks
            // Обработчик для состояния pending (запрос выполняется)
            .addCase(fetchDelegatedTasks.pending, (state) => {
                // Установка флага загрузки в true
                state.loading = true;
                // Очистка предыдущих ошибок
                state.error = null;
            })
            // Обработчик для состояния fulfilled (запрос успешно завершен)
            .addCase(fetchDelegatedTasks.fulfilled, (state, action) => {
                // Сброс флага загрузки
                state.loading = false;
                // Сохранение полученного массива задач в состояние
                state.tasks = action.payload;
            })
            // Обработчик для состояния rejected (запрос завершен с ошибкой)
            .addCase(fetchDelegatedTasks.rejected, (state, action) => {
                // Сброс флага загрузки
                state.loading = false;
                // Сохранение ошибки из payload или использование сообщения по умолчанию
                state.error = action.payload ?? "Неизвестная ошибка";
            })

            // Обработчики для действия deleteDelegatedTask
            // Обработчик для состояния fulfilled (удаление успешно завершено)
            .addCase(deleteDelegatedTask.fulfilled, (state, action) => {
                // Фильтрация массива задач - удаление задачи с ID из payload
                state.tasks = state.tasks.filter((t) => t.id !== action.payload);
            })
            // Обработчик для состояния rejected (удаление завершено с ошибкой)
            .addCase(deleteDelegatedTask.rejected, (state, action) => {
                // Сохранение ошибки из payload или использование сообщения по умолчанию
                state.error = action.payload ?? "Неизвестная ошибка";
            })

            // Обработчики для действия updateDelegatedTask
            // Обработчик для состояния fulfilled (обновление успешно завершено)
            .addCase(updateDelegatedTask.fulfilled, (state, action) => {
                // Поиск индекса обновленной задачи в массиве
                const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
                // Проверка что задача найдена (индекс >= 0)
                if (idx >= 0) {
                    // Замена старой задачи на обновленную версию
                    state.tasks[idx] = action.payload;
                }
            })
            // Обработчик для состояния rejected (обновление завершено с ошибкой)
            .addCase(updateDelegatedTask.rejected, (state, action) => {
                // Сохранение ошибки из payload или использование сообщения по умолчанию
                state.error = action.payload ?? "Неизвестная ошибка";
            });
    },
});

// Экспорт синхронных действий (action creators)
export const { clearError } = delegatedTasksSlice.actions;

// Селекторы для доступа к данным из состояния делегированных задач

// Селектор для получения массива делегированных задач
export const selectDelegatedTasks = (state: RootState) => state.delegatedTasks.tasks;

// Селектор для получения ошибки делегированных задач
export const selectDelegatedTasksError = (state: RootState) => state.delegatedTasks.error;

// Селектор для получения флага загрузки делегированных задач
export const selectDelegatedTasksLoading = (state: RootState) => state.delegatedTasks.loading;






/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Импорты и интерфейсы:
   - Импорт необходимых функций из Redux Toolkit и типов
   - DelegatedTasksState определяет структуру состояния для делегированных задач
   - tasks - массив объектов Task, loading - флаг загрузки, error - сообщение об ошибке

2. Асинхронные действия (createAsyncThunk):
   - fetchDelegatedTasks - получение списка задач с пагинацией
   - deleteDelegatedTask - удаление задачи по ID
   - updateDelegatedTask - обновление задачи с частичными данными
   - Все действия используют getState для доступа к учетным данным аутентификации

3. Логика аутентификации в действиях:
   - Получение username, password, isAuthenticated из состояния auth
   - Создание creds объекта только если пользователь аутентифицирован
   - Обработка ошибки 401 с соответствующим сообщением

4. Обработка ошибок:
   - Проверка статуса ошибки 401 для специфичного сообщения
   - Использование error?.response?.data?.detail для детализированных сообщений об ошибках
   - Fallback сообщения на русском языке для разных типов операций

5. Структура среза delegatedTasksSlice:
   - name: "delegatedTasks" - идентификатор для Redux DevTools
   - initialState - начальное состояние с пустым массивом задач
   - reducers - только clearError для ручной очистки ошибок
   - extraReducers - обработка всех асинхронных действий

6. Обработка состояний в extraReducers:
   - fetchDelegatedTasks: управление loading состоянием и обновление tasks
   - deleteDelegatedTask: удаление задачи из массива по ID (без loading состояния)
   - updateDelegatedTask: поиск и замена обновленной задачи в массиве

7. Логика обновления состояния:
   - Для fetch: полная замена массива tasks
   - Для delete: фильтрация массива чтобы удалить задачу
   - Для update: поиск по ID и замена элемента массива

8. Селекторы:
   - selectDelegatedTasks - получение массива задач
   - selectDelegatedTasksError - получение ошибки
   - selectDelegatedTasksLoading - получение флага загрузки
   - Все селекторы типизированы с RootState

9. Особенности пагинации:
   - fetchDelegatedTasks принимает start и limit параметры
   - Значения по умолчанию: start=0, limit=10
   - Позволяет реализовать постраничную загрузку задач

10. Безопасность типов:
    - Использование Pick для ограничения полей при обновлении
    - Partial для возможности частичного обновления
    - Строгая типизация всех действий и состояний

11. Управление ошибками:
    - Очистка ошибок при начале нового запроса (pending)
    - Сохранение ошибок при rejected состоянии
    - Возможность ручной очистки через clearError действие

12. Оптимизация производительности:
    - Иммутабельные обновления через Redux Toolkit
    - Локальные обновления при delete и update (без перезагрузки всего списка)
    - Минимальные изменения состояния для каждого действия
*/