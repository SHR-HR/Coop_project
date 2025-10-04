// Импорт функций createAsyncThunk и createSlice из Redux Toolkit для создания асинхронных действий и срезов состояния
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// Импорт API объекта для выполнения запросов к серверу
import { api } from "../../api/api.ts";
// Импорт типа RootState для типизации состояния всего хранилища
import type { RootState } from "../store";
// Импорт типа Profile из файла с типами для типизации данных профиля
import type { Profile } from "../../shared/types/types.ts";

// Определение интерфейса для состояния профиля
interface profileState {
    // Данные профиля пользователя или null если профиль не загружен
    profile: Profile | null;
    // Флаг, указывающий выполняется ли в данный момент запрос
    loading: boolean;
    // Сообщение об ошибке или null если ошибок нет
    error: string | null;
}

// Начальное состояние для среза профиля
const initialState: profileState = {
    // Профиль не загружен по умолчанию
    profile: null,
    // Загрузка не выполняется по умолчанию
    loading: false,
    // Ошибок нет по умолчанию
    error: null,
};

// Создание асинхронного действия для получения профиля пользователя
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Profile)
// - второй: тип аргументов (void - без аргументов)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const fetchProfile = createAsyncThunk<
    Profile,
    void,
    { state: RootState; rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("profile/fetchProfile", async (_, { getState, rejectWithValue }) => {
        // Получение состояния аутентификации из глобального состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Блок try для обработки успешного выполнения
        try {
            // Вызов API метода для получения профиля с передачей учетных данных если пользователь аутентифицирован
            const data: Profile = await api.profileApi.getProfile(
                isAuthenticated ? { username, password } : undefined
            );
            // Возврат полученных данных профиля
            return data;
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
            return rejectWithValue(
                error?.response?.data?.detail || "Ошибка загрузки профиля"
            );
        }
    });

// Создание асинхронного действия для обновления профиля пользователя
// Дженерик параметры:
// - первый: тип возвращаемого значения при успехе (Profile - обновленный профиль)
// - второй: тип аргументов (Partial<Profile> - частичные данные профиля для обновления)
// - третий: тип конфигурации с state: RootState и rejectValue: string
export const updateProfile = createAsyncThunk<
    Profile,
    Partial<Profile>,
    { state: RootState; rejectValue: string }
>
    // Название действия и асинхронная функция-исполнитель
    ("profile/updateProfile", async (newProfile: Partial<Profile>, { getState, rejectWithValue }) => {
        // Получение состояния аутентификации из глобального состояния
        const { username, password, isAuthenticated } = getState().auth;
        // Блок try для обработки успешного выполнения
        try {
            // Вызов API метода для обновления профиля с передачей учетных данных и новых данных профиля
            const data: Profile = await api.profileApi.updateProfile(
                isAuthenticated ? { username, password } : undefined,
                newProfile
            );
            // Возврат обновленных данных профиля
            return data;
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
            return rejectWithValue(
                error?.response?.data?.detail || "Ошибка обновления профиля"
            );
        }
    });

// Создание среза (slice) для управления состоянием профиля
export const profileSlice = createSlice({
    // Уникальное имя среза
    name: "profile",
    // Начальное состояние
    initialState,
    // Синхронные редюсеры (редюсеры для синхронных действий)
    reducers: {
        // Редюсер для очистки ошибок
        clearError: (state) => {
            // Очистка сообщения об ошибке
            state.error = null;
        },
        // Редюсер для очистки данных профиля
        clearProfile: (state) => {
            // Сброс данных профиля в null
            state.profile = null;
        },
    },
    // Дополнительные редюсеры для обработки асинхронных действий
    extraReducers: (builder) => {
        // Использование builder для цепочного добавления обработчиков
        builder
            /* Обработчики для действия fetchProfile - Получение профиля */
            // Обработчик для состояния pending (запрос выполняется)
            .addCase(fetchProfile.pending, (state) => {
                // Установка флага загрузки в true
                state.loading = true;
                // Очистка предыдущих ошибок
                state.error = null;
            })
            // Обработчик для состояния fulfilled (запрос успешно завершен)
            .addCase(fetchProfile.fulfilled, (state, action) => {
                // Сброс флага загрузки
                state.loading = false;
                // Сохранение полученных данных профиля в состояние
                state.profile = action.payload;
            })
            // Обработчик для состояния rejected (запрос завершен с ошибкой)
            .addCase(fetchProfile.rejected, (state, action) => {
                // Сброс флага загрузки
                state.loading = false;
                // Сохранение ошибки из payload или использование сообщения по умолчанию
                state.error = (action.payload as string) ?? "Неизвестная ошибка";
            })

            /* Обработчики для действия updateProfile - Обновление профиля */
            // Обработчик для состояния fulfilled (обновление успешно завершено)
            .addCase(updateProfile.fulfilled, (state, action) => {
                // Сохранение обновленных данных профиля в состояние
                state.profile = action.payload;
            })
            // Обработчик для состояния rejected (обновление завершено с ошибкой)
            .addCase(updateProfile.rejected, (state, action) => {
                // Сохранение ошибки из payload или использование сообщения по умолчанию
                state.error = (action.payload as string) ?? "Неизвестная ошибка";
            });
    },
})

// Экспорт синхронных действий (action creators)
export const { clearError, clearProfile } = profileSlice.actions;

// Селекторы для доступа к данным из состояния профиля

// Селектор для получения данных профиля
export const selectProfile = (state: RootState) => state.profile.profile;

// Селектор для получения ошибки профиля
export const selectProfileError = (state: RootState) => state.profile.error;

// Селектор для получения флага загрузки профиля
export const selectProfileLoading = (state: RootState) => state.profile.loading;






/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Интерфейс состояния профиля:
   - profile: Profile | null - данные профиля или null если не загружены
   - loading: boolean - индикатор выполнения запроса (только для fetch)
   - error: string | null - сообщение об ошибке для пользовательского интерфейса

2. Асинхронные действия (thunks):
   - fetchProfile - получение данных профиля с сервера
   - updateProfile - обновление данных профиля на сервере
   - Оба действия используют getState для доступа к учетным данным аутентификации

3. Логика аутентификации в действиях:
   - Получение username, password, isAuthenticated из состояния auth
   - Передача учетных данных только если isAuthenticated = true
   - Обработка ошибки 401 с соответствующим сообщением на русском языке

4. Обработка ошибок в thunks:
   - Проверка статуса ошибки 401 для специфичного сообщения о необходимости авторизации
   - Использование error?.response?.data?.detail для детализированных сообщений от сервера
   - Fallback сообщения на русском языке для операций загрузки и обновления

5. Структура среза profileSlice:
   - name: "profile" - идентификатор для Redux DevTools
   - initialState - начальное состояние с null профилем
   - reducers - clearError и clearProfile для ручного управления состоянием
   - extraReducers - обработка асинхронных действий с раздельной логикой

6. Синхронные редюсеры:
   - clearError: очищает сообщение об ошибке
   - clearProfile: сбрасывает данные профиля в null (полезно при выходе из системы)

7. Обработка состояний в extraReducers:
   - fetchProfile: управление loading состоянием и обновление profile
   - updateProfile: только обновление profile без управления loading
   - Раздельная логика для операций чтения (fetch) и записи (update)

8. Особенности управления состоянием загрузки:
   - loading устанавливается только для fetchProfile (операция чтения)
   - updateProfile не управляет loading (операция изменения)
   - Позволяет показывать индикатор загрузки только при первоначальной загрузке профиля

9. Обновление состояния при успешных операциях:
   - fetchProfile.fulfilled: полная замена profile данными из сервера
   - updateProfile.fulfilled: полная замена profile обновленными данными
   - Обе операции полностью заменяют профиль, а не частично обновляют

10. Селекторы:
    - selectProfile - получение данных профиля
    - selectProfileError - получение ошибки
    - selectProfileLoading - получение флага загрузки
    - Все селекторы типизированы с RootState

11. Безопасность типов:
    - Использование Partial<Profile> для updateProfile позволяет обновлять только часть полей
    - Строгая типизация всех действий и состояний
    - Правильная обработка опциональных параметров аутентификации

12. Пользовательский опыт:
    - Разные сообщения об ошибках для операций загрузки и обновления
    - Четкое разделение ошибок аутентификации и серверных ошибок
    - Возможность очистки ошибок через clearError действие
    - Возможность сброса профиля через clearProfile (например, при logout)

13. Архитектурные решения:
    - Отсутствие pending/rejected обработчиков для updateProfile.pending
    - Разделение ответственности между fetch и update операциями
    - Использование одного состояния для обеих операций с профилем

14. Оптимизация производительности:
    - Минимальные изменения состояния для каждого действия
    - Иммутабельные обновления через Redux Toolkit
    - Локальное кэширование данных профиля после загрузки
*/