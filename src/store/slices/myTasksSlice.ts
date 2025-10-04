// Импорт функций createAsyncThunk и createSlice из Redux Toolkit для создания асинхронных действий и срезов состояния
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// Импорт типа PayloadAction для типизации действий с полезной нагрузкой
import type { PayloadAction } from "@reduxjs/toolkit";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";
// Импорт типа Task из файла с типами для типизации задач
import type { Task } from "../../shared/types/types";
// Импорт API объекта для выполнения запросов к серверу
import { api } from "../../api/api";

/* --- State --- */
// Определение интерфейса для состояния моих задач
interface MyTasksState {
  // Массив задач пользователя
  items: Task[];
  // Флаг, указывающий выполняется ли в данный момент запрос
  loading: boolean;
  // Сообщение об ошибке или null если ошибок нет
  error: string | null;
  // Флаг, указывающий на отсутствие авторизации
  unauthorized: boolean;
}

// Начальное состояние для среза моих задач
const initialState: MyTasksState = {
  // Пустой массив задач по умолчанию
  items: [],
  // Загрузка не выполняется по умолчанию
  loading: false,
  // Ошибок нет по умолчанию
  error: null,
  // Пользователь авторизован по умолчанию
  unauthorized: false,
};

/* --- Thunks --- */
// Создание асинхронного действия для получения списка моих задач
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Task[])
// - второй: тип аргументов (объект с start и limit или undefined)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const fetchMyTasks = createAsyncThunk<
  Task[],
  { start?: number; limit?: number } | undefined,
  { state: RootState; rejectValue: string }
>
  // Название действия и асинхронная функция-исполнитель
  (
    "myTasks/fetchAll",
    async (params, { getState, rejectWithValue }) => {
      // Получение состояния аутентификации из глобального состояния
      const { username, password, isAuthenticated } = getState().auth;
      // Проверка аутентификации пользователя
      if (!isAuthenticated) {
        // Возврат специальной ошибки "unauthorized" если пользователь не аутентифицирован
        return rejectWithValue("unauthorized");
      }

      // Блок try для обработки успешного выполнения
      try {
        // Вызов API метода для получения всех задач пользователя с опциональными параметрами пагинации
        return await api.myTasksApi.getAll({
          username,
          password,
          start: params?.start,
          limit: params?.limit,
        });
        // Блок catch для обработки ошибок
      } catch (e: any) {
        // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
        return rejectWithValue(
          e?.response?.data?.detail || "Ошибка загрузки моих задач"
        );
      }
    }
  );

// Создание асинхронного действия для завершения моей задачи
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Task - обновленная задача)
// - второй: тип аргументов (объект с taskId и result)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const completeMyTask = createAsyncThunk<
  Task,
  { taskId: number; result: string },
  { state: RootState; rejectValue: string }
>
  // Название действия и асинхронная функция-исполнитель
  (
    "myTasks/complete",
    async ({ taskId, result }, { getState, rejectWithValue }) => {
      // Получение состояния аутентификации из глобального состояния
      const { username, password, isAuthenticated } = getState().auth;
      // Проверка аутентификации пользователя
      if (!isAuthenticated) {
        // Возврат специальной ошибки "unauthorized" если пользователь не аутентифицирован
        return rejectWithValue("unauthorized");
      }
      // Блок try для обработки успешного выполнения
      try {
        // Вызов API метода для завершения задачи с указанным результатом
        return await api.myTasksApi.complete({
          username,
          password,
          taskId,
          result,
        });
        // Блок catch для обработки ошибок
      } catch (e: any) {
        // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
        return rejectWithValue(
          e?.response?.data?.detail || "Ошибка завершения задачи"
        );
      }
    }
  );

/* --- Slice --- */
// Создание среза (slice) для управления состоянием моих задач
const myTasksSlice = createSlice({
  // Уникальное имя среза
  name: "myTasks",
  // Начальное состояние
  initialState,
  // Синхронные редюсеры (редюсеры для синхронных действий)
  reducers: {
    // Редюсер для очистки ошибок и сброса флага неавторизации
    clearError: (state) => {
      // Очистка сообщения об ошибке
      state.error = null;
      // Сброс флага неавторизации
      state.unauthorized = false;
    },
  },
  // Дополнительные редюсеры для обработки асинхронных действий
  extraReducers: (builder) => {
    // Использование builder для цепочного добавления обработчиков
    builder
      // Обработчики для действия fetchMyTasks
      // Обработчик для состояния pending (запрос выполняется)
      .addCase(fetchMyTasks.pending, (state) => {
        // Установка флага загрузки в true
        state.loading = true;
        // Очистка предыдущих ошибок
        state.error = null;
        // Сброс флага неавторизации
        state.unauthorized = false;
      })
      // Обработчик для состояния fulfilled (запрос успешно завершен)
      .addCase(fetchMyTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        // Сброс флага загрузки
        state.loading = false;
        // Сохранение полученного массива задач в состояние
        state.items = action.payload;
      })
      // Обработчик для состояния rejected (запрос завершен с ошибкой)
      .addCase(fetchMyTasks.rejected, (state, action) => {
        // Сброс флага загрузки
        state.loading = false;
        // Проверка типа ошибки
        if (action.payload === "unauthorized") {
          // Установка флага неавторизации если ошибка связана с аутентификацией
          state.unauthorized = true;
        } else {
          // Сохранение обычной ошибки из payload или использование сообщения по умолчанию
          state.error = (action.payload as string) ?? "Неизвестная ошибка";
        }
      })
      // Обработчики для действия completeMyTask
      // Обработчик для состояния pending (запрос выполняется)
      .addCase(completeMyTask.pending, (state) => {
        // Очистка предыдущих ошибок (loading не устанавливается для этого действия)
        state.error = null;
        // Сброс флага неавторизации
        state.unauthorized = false;
      })
      // Обработчик для состояния fulfilled (запрос успешно завершен)
      .addCase(completeMyTask.fulfilled, (state, action: PayloadAction<Task>) => {
        // Поиск индекса завершенной задачи в массиве
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        // Проверка что задача найдена (индекс не равен -1)
        if (idx !== -1) {
          // Замена старой задачи на обновленную версию с результатом выполнения
          state.items[idx] = action.payload;
        }
      })
      // Обработчик для состояния rejected (запрос завершен с ошибкой)
      .addCase(completeMyTask.rejected, (state, action) => {
        // Проверка типа ошибки
        if (action.payload === "unauthorized") {
          // Установка флага неавторизации если ошибка связана с аутентификацией
          state.unauthorized = true;
        } else {
          // Сохранение обычной ошибки из payload или использование сообщения по умолчанию
          state.error = (action.payload as string) ?? "Неизвестная ошибка";
        }
      });
  },
});

/* --- Export --- */
// Экспорт синхронных действий (action creators)
export const { clearError } = myTasksSlice.actions;

// Селектор для получения всего состояния моих задач
export const selectMyTasks = (state: RootState) => state.myTasks;

// Экспорт редюсера по умолчанию для использования в хранилище
export default myTasksSlice.reducer;



/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Структура файла:
   - Разделен на три основные секции: State, Thunks, Slice
   - Четкое разделение ответственности для лучшей читаемости

2. MyTasksState интерфейс:
   - items - массив задач пользователя
   - loading - флаг загрузки для операций чтения
   - error - сообщение об ошибке для пользователя
   - unauthorized - специальный флаг для случаев отсутствия авторизации

3. Асинхронные действия (thunks):
   - fetchMyTasks - получение списка задач с опциональной пагинацией
   - completeMyTask - завершение задачи с указанием результата
   - Оба действия проверяют аутентификацию перед выполнением API запроса

4. Особенности аутентификации:
   - Использование getState() для доступа к состоянию auth
   - Проверка isAuthenticated перед выполнением запросов
   - Возврат специального значения "unauthorized" для различения типов ошибок

5. Обработка ошибок в thunks:
   - Использование rejectWithValue для типизированного возврата ошибок
   - Приоритет детализированных сообщений от сервера (e?.response?.data?.detail)
   - Fallback сообщения на русском языке для разных операций

6. Структура среза myTasksSlice:
   - name: "myTasks" - идентификатор для Redux DevTools
   - reducers - только clearError для очистки ошибок и неавторизации
   - extraReducers - обработка всех асинхронных действий с детальной логикой

7. Логика в extraReducers:
   - fetchMyTasks: управление loading состоянием и обработка разных типов ошибок
   - completeMyTask: обновление конкретной задачи в массиве без управления loading
   - Раздельная обработка ошибок "unauthorized" и обычных ошибок

8. Обновление состояния при completeMyTask.fulfilled:
   - Поиск задачи по ID в массиве items
   - Замена найденной задачи на обновленную версию из action.payload
   - Сохранение иммутабельности через прямое присваивание (благодаря Immer)

9. Управление состоянием загрузки:
   - loading устанавливается только для fetchMyTasks (операция чтения)
   - completeMyTask не управляет loading (операция изменения)
   - Позволяет показывать индикатор загрузки только при загрузке списка

10. Обработка неавторизации:
    - separate флаг unauthorized для случаев когда пользователь не аутентифицирован
    - Позволяет компонентам различать обычные ошибки и ошибки аутентификации
    - Очистка через clearError действие

11. Селекторы:
    - selectMyTasks - получение всего состояния моих задач
    - Позволяет компонентам подписываться на все изменения состояния

12. Типизация:
    - Использование PayloadAction для типизации действий с полезной нагрузкой
    - Строгая типизация всех действий и состояний
    - Правильная обработка опциональных параметров в thunks

13. Особенности API вызовов:
    - Передача учетных данных в каждом запросе
    - Поддержка пагинации через start и limit параметры
    - Структурированные параметры для complete операции

14. Пользовательский опыт:
    - Разные сообщения об ошибках для разных операций
    - Четкое разделение ошибок аутентификации и серверных ошибок
    - Возможность очистки ошибок через clearError
*/