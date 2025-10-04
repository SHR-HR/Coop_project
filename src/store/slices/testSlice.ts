// Импорт функций createAsyncThunk и createSlice из Redux Toolkit для создания асинхронных действий и срезов состояния
// Импорт типа PayloadAction для типизации действий с полезной нагрузкой
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
// Импорт testApi объекта для выполнения тестовых запросов к API
import { testApi } from "../../api/testApi";

// Определение интерфейса для тестового состояния
interface TestState {
  // Статус API в виде строки (пустая строка, "API работает", "API не доступен")
  apiStatus: string;
  // Флаг, указывающий выполняется ли в данный момент запрос
  loading: boolean;
  // Сообщение об ошибке или null если ошибок нет
  error: string | null;
  // Счетчик для демонстрационных целей
  counter: number;
}

// Начальное состояние для тестового среза
const initialState: TestState = {
  // Пустой статус API по умолчанию
  apiStatus: "",
  // Загрузка не выполняется по умолчанию
  loading: false,
  // Ошибок нет по умолчанию
  error: null,
  // Счетчик начинается с 0
  counter: 0,
};

// Создание асинхронного действия для проверки статуса API
// Дженерик параметры не указаны явно, используются значения по умолчанию
export const checkApiStatus = createAsyncThunk(
  // Название действия
  "test/checkApiStatus",
  // Асинхронная функция-исполнитель
  async (_, { rejectWithValue }) => {
    // Блок try для обработки успешного выполнения
    try {
      // Вызов API метода для проверки статуса API
      const response = await testApi.checkApiStatus();
      // Возврат сообщения из ответа API
      return response.message;
      // Блок catch для обработки ошибок
    } catch (error: any) {
      // Возврат детали ошибки из ответа сервера или общего сообщения об ошибке
      return rejectWithValue(
        error.response?.data?.detail || "Ошибка подключения к API"
      );
    }
  }
);

// Создание среза (slice) для управления тестовым состоянием
export const testSlice = createSlice({
  // Уникальное имя среза
  name: "test",
  // Начальное состояние
  initialState,
  // Синхронные редюсеры (редюсеры для синхронных действий)
  reducers: {
    // Редюсер для очистки ошибок
    clearError: (state) => {
      // Очистка сообщения об ошибке
      state.error = null;
    },
    // Редюсер для увеличения счетчика
    increment: (state) => {
      // Увеличение счетчика на 1
      state.counter += 1;
    },
    // Редюсер для уменьшения счетчика
    decrement: (state) => {
      // Уменьшение счетчика на 1
      state.counter -= 1;
    },
    // Редюсер для сброса счетчика
    resetCounter: (state) => {
      // Установка счетчика в 0
      state.counter = 0;
    },
  },
  // Дополнительные редюсеры для обработки асинхронных действий
  extraReducers: (builder) => {
    // Использование builder для цепочного добавления обработчиков
    builder
      // Обработчики для действия checkApiStatus - Проверка статуса API
      // Обработчик для состояния pending (запрос выполняется)
      .addCase(checkApiStatus.pending, (state) => {
        // Установка флага загрузки в true
        state.loading = true;
        // Очистка предыдущих ошибок
        state.error = null;
        // Сброс статуса API
        state.apiStatus = "";
      })
      // Обработчик для состояния fulfilled (запрос успешно завершен)
      .addCase(checkApiStatus.fulfilled, (state, action) => {
        // Сброс флага загрузки
        state.loading = false;
        // Установка статуса API в "API работает"
        state.apiStatus = "API работает";
      })
      // Обработчик для состояния rejected (запрос завершен с ошибкой)
      .addCase(checkApiStatus.rejected, (state, action) => {
        // Сброс флага загрузки
        state.loading = false;
        // Сохранение ошибки из payload
        state.error = action.payload as string;
        // Установка статуса API в "API не доступен"
        state.apiStatus = "API не доступен";
      });
  },
});

// Экспорт синхронных действий (action creators)
export const { clearError, increment, decrement, resetCounter } = testSlice.actions;

// Селекторы для доступа к данным из тестового состояния

// Селектор для получения статуса API
export const selectApiStatus = (state: { test: TestState }) => state.test.apiStatus;

// Селектор для получения флага загрузки
export const selectTestLoading = (state: { test: TestState }) => state.test.loading;

// Селектор для получения ошибки
export const selectTestError = (state: { test: TestState }) => state.test.error;

// Селектор для получения значения счетчика
export const selectCounter = (state: { test: TestState }) => state.test.counter;

/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Назначение тестового среза:
   - Демонстрационный срез для тестирования работы Redux и API
   - Проверка connectivity с сервером
   - Пример реализации счетчика для демонстрации синхронных действий

2. TestState интерфейс:
   - apiStatus: string - текстовый статус работы API
   - loading: boolean - индикатор выполнения асинхронного запроса
   - error: string | null - сообщение об ошибке для отображения пользователю
   - counter: number - демонстрационный счетчик для тестирования синхронных действий

3. Асинхронное действие checkApiStatus:
   - Не принимает аргументов (использует _)
   - Использует rejectWithValue для типизированного возврата ошибок
   - Возвращает response.message при успехе
   - Обрабатывает ошибки с приоритетом детализированных сообщений от сервера

4. Синхронные редюсеры:
   - clearError: очищает сообщение об ошибке
   - increment: увеличивает счетчик на 1
   - decrement: уменьшает счетчик на 1
   - resetCounter: сбрасывает счетчик в 0
   - Простые операции для демонстрации работы синхронных действий

5. Обработка асинхронного действия в extraReducers:
   - pending: сброс состояния и установка loading в true
   - fulfilled: установка успешного статуса и сброс loading
   - rejected: сохранение ошибки и установка статуса недоступности API

6. Особенности обработки ошибок:
   - error.response?.data?.detail - приоритет детализированных сообщений от сервера
   - "Ошибка подключения к API" - fallback сообщение на русском языке
   - action.payload as string - приведение типа для TypeScript

7. Селекторы:
   - selectApiStatus - получение текстового статуса API
   - selectTestLoading - получение флага загрузки
   - selectTestError - получение сообщения об ошибке
   - selectCounter - получение значения счетчика
   - Все селекторы используют inline типизацию вместо RootState

8. Демонстрационные возможности:
   - Счетчик показывает работу синхронных действий
   - Проверка API демонстрирует асинхронные операции
   - Обработка ошибок показывает работу с rejected состояниями

9. Использование в разработке:
   - Тестирование подключения к бэкенду
   - Демонстрация работы Redux Toolkit начинающим разработчикам
   - Отладка проблем с сетью и API

10. Особенности TypeScript:
    - type PayloadAction - импорт типа для действий с payload
    - Явная типизация состояния в селекторах
    - Обработка возможных undefined значений через optional chaining (?.)

11. Паттерны проектирования:
    - Разделение синхронных и асинхронных действий
    - Централизованная обработка ошибок
    - Чистые функции-редюсеры (благодаря Immer)

12. Пользовательский опыт:
    - Четкие сообщения о статусе API на русском языке
    - Визуальная обратная связь через состояния loading
    - Возможность сброса ошибок через clearError

13. Масштабируемость:
    - Простая структура, которую легко расширять
    - Отдельные селекторы для каждой части состояния
    - Четкое разделение ответственности между действиями
*/