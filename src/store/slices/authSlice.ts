// Импорт функций createAsyncThunk и createSlice из Redux Toolkit для создания асинхронных действий и срезов состояния
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// Импорт типа Credentials из файла с типами для типизации учетных данных
import type { Credentials } from "../../shared/types/types";
// Импорт API объекта для выполнения запросов к серверу
import { api } from "../../api/api.ts";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";

// Определение интерфейса для состояния аутентификации
interface AuthState {
    // Имя пользователя (логин)
    username: string;
    // Пароль пользователя
    password: string;
    // Флаг, указывающий аутентифицирован ли пользователь
    isAuthenticated: boolean;
    // Флаг, указывающий выполняется ли в данный момент запрос аутентификации
    loading: boolean;
    // Сообщение об ошибке или null если ошибок нет
    error: string | null;
}

// Начальное состояние для среза аутентификации
const initialState: AuthState = {
    // Пустое имя пользователя по умолчанию
    username: "",
    // Пустой пароль по умолчанию
    password: "",
    // Пользователь не аутентифицирован по умолчанию
    isAuthenticated: false,
    // Загрузка не выполняется по умолчанию
    loading: false,
    // Ошибок нет по умолчанию
    error: null,
};

// Создание асинхронного действия для входа в систему
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Credentials)
// - второй: тип аргументов (Credentials)
// - третий: тип конфигурации с rejectValue типа string
export const login = createAsyncThunk<
    Credentials,
    Credentials,
    { rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("auth/login", async (creds, { rejectWithValue }) => {
        // Блок try для обработки успешного выполнения
        try {
            // Вызов API метода для проверки аутентификации с переданными учетными данными
            await api.checkAuth(creds);
            // Возврат учетных данных при успешной аутентификации
            return creds;
            // Блок catch для обработки ошибок
        } catch (err: any) {
            // Получение статуса ошибки из ответа сервера
            const status = err?.response?.status;
            // Проверка если статус ошибки 401 (неавторизован)
            if (status === 401) {
                // Возврат ошибки с сообщением о неверных учетных данных
                return rejectWithValue("Неверный логин или пароль");
            }
            // Возврат общей ошибки подключения для других типов ошибок
            return rejectWithValue("Ошибка подключения к API");
        }
    });

// Создание среза (slice) для управления состоянием аутентификации
export const authSlice = createSlice({
    // Уникальное имя среза
    name: "auth",
    // Начальное состояние
    initialState,
    // Синхронные редюсеры (редюсеры для синхронных действий)
    reducers: {
        // Редюсер для выхода из системы
        logOut: (state) => {
            // Сброс имени пользователя
            state.username = "";
            // Сброс пароля
            state.password = "";
            // Установка флага аутентификации в false
            state.isAuthenticated = false;
            // Очистка ошибок
            state.error = null;
        },
    },
    // Дополнительные редюсеры для обработки асинхронных действий
    extraReducers: (builder) => {
        // Использование builder для цепочного добавления обработчиков
        builder
            // Обработчик для состояния pending (запрос выполняется) действия login
            .addCase(login.pending, (state) => {
                // Установка флага загрузки в true
                state.loading = true;
                // Очистка предыдущих ошибок
                state.error = null;
            })
            // Обработчик для состояния fulfilled (запрос успешно завершен) действия login
            .addCase(login.fulfilled, (state, action) => {
                // Сброс флага загрузки
                state.loading = false;
                // Сохранение имени пользователя из payload действия
                state.username = action.payload.username;
                // Сохранение пароля из payload действия
                state.password = action.payload.password;
                // Установка флага аутентификации в true
                state.isAuthenticated = true;
                // Очистка ошибок
                state.error = null;
            })
            // Обработчик для состояния rejected (запрос завершен с ошибкой) действия login
            .addCase(login.rejected, (state, action) => {
                // Проверка если пользователь не был аутентифицирован до этой ошибки
                if (!state.isAuthenticated) {
                    // Сброс флага загрузки
                    state.loading = false;
                    // Подтверждение что пользователь не аутентифицирован
                    state.isAuthenticated = false;
                    // Сохранение ошибки из payload или использование сообщения по умолчанию
                    state.error = action.payload ?? "Ошибка авторизации";
                } else {
                    // Если пользователь уже был аутентифицирован (случай смены аккаунта)
                    state.loading = false;
                    // Сохранение ошибки смены аккаунта
                    state.error = action.payload ?? "Ошибка Смены аккаунта";
                }
            });
    },
});

// Экспорт синхронных действий (action creators)
export const { logOut } = authSlice.actions;

// Селекторы для доступа к данным из состояния аутентификации

// Селектор для получения всего состояния аутентификации
export const selectAuth = (state: RootState) => state.auth;

// Селектор для получения имени пользователя
export const selectUsername = (state: RootState) => state.auth.username;

// Селектор для получения флага аутентификации
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

// Селектор для получения ошибки аутентификации
export const selectAuthError = (state: RootState) => state.auth.error;

// Селектор для получения флага загрузки
export const selectAuthLoading = (state: RootState) => state.auth.loading;




/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Импорты:
   - createAsyncThunk - для создания асинхронных действий с автоматической обработкой состояний pending/fulfilled/rejected
   - createSlice - для создания среза состояния с редюсерами и действиями
   - Credentials - тип для учетных данных (username и password)
   - api - объект для работы с API
   - RootState - тип глобального состояния Redux

2. AuthState интерфейс:
   - Определяет структуру состояния аутентификации
   - username и password хранят учетные данные
   - isAuthenticated - флаг успешной аутентификации
   - loading - индикатор выполнения запроса
   - error - сообщение об ошибке или null

3. initialState:
   - Начальные значения для всех полей состояния
   - Пустые строки для учетных данных, false для аутентификации и загрузки, null для ошибки

4. createAsyncThunk для login:
   - "auth/login" - уникальное имя действия
   - Асинхронная функция принимает creds (учетные данные) и объект с rejectWithValue
   - try/catch блок для обработки успеха и ошибок API запроса
   - Проверка статуса ошибки 401 для специфичного сообщения
   - Использование rejectWithValue для типизированного возврата ошибок

5. authSlice:
   - name: "auth" - имя среза для DevTools и отладки
   - initialState - начальное состояние
   - reducers - синхронные действия (только logOut в данном случае)
   - extraReducers - обработка асинхронных действий (login)

6. Редюсер logOut:
   - Сбрасывает все поля состояния к начальным значениям
   - Очищает учетные данные и ошибки
   - Устанавливает isAuthenticated в false

7. extraReducers для login:
   - pending: устанавливает loading=true и очищает ошибки
   - fulfilled: сохраняет учетные данные, устанавливает isAuthenticated=true, сбрасывает loading
   - rejected: обрабатывает ошибки с учетом текущего состояния аутентификации

8. Логика в rejected случае:
   - Если пользователь не был аутентифицирован - обычная ошибка авторизации
   - Если пользователь уже был аутентифицирован - ошибка смены аккаунта
   - action.payload ?? "сообщение по умолчанию" - использование переданной ошибки или fallback

9. Селекторы:
   - Функции для извлечения конкретных данных из состояния
   - Типизированы с RootState для безопасности типов
   - Позволяют компонентам подписываться на конкретные части состояния

10. Особенности безопасности:
    - Пароль хранится в состоянии (в реальном приложении безопасность)
    - Ошибки содержат пользовательские сообщения на русском языке
    - Четкое разделение ошибок авторизации и ошибок подключения

11. Управление состоянием загрузки:
    - loading устанавливается в true при начале запроса
    - Сбрасывается в false при завершении (успешном или с ошибкой)
    - Позволяет показывать индикаторы загрузки в UI

12. Обработка ошибок:
    - Разные сообщения для разных типов ошибок
    - Сохранение состояния аутентификации при ошибках смены аккаунта
    - Очистка ошибок при новом запросе
*/