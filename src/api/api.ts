// Импорт библиотеки axios для выполнения HTTP-запросов
import axios from "axios";
// Импорт TypeScript типов из файла с общими типами приложения
import type { Credentials, Profile, User, UserStatistic, MyStatistic, TaskCreatePayload, Task } from "../shared/types/types";

// Определение базового URL для API запросов - локальный сервер на порту 8000
const API_URL = "http://localhost:8000";
// Создание экземпляра axios с предварительной настройкой базового URL
const axios_api = axios.create({ baseURL: API_URL });

// API для работы с пользователями
export const usersApi = {
    // Метод для получения списка всех пользователей
    getUsers: async (creds?: Credentials): Promise<User[]> => {
        // Выполнение GET-запроса к эндпоинту /task-api/users
        const res = await axios_api.get<User[]>("/task-api/users", {
            // Передача учетных данных для Basic аутентификации, если они предоставлены
            auth: creds ? { username: creds.username, password: creds.password } : undefined,
        });
        return res.data; // Возвращение данных из ответа
    },
};

// API для работы с профилем пользователя
export const profileApi = {
    // Метод для получения профиля текущего пользователя
    getProfile: async (creds?: Credentials): Promise<Profile> => {
        const res = await axios_api.get<Profile>("/task-api/myProfile", {
            auth: creds ? { username: creds.username, password: creds.password } : undefined,
        });
        return res.data;
    },

    // Метод для обновления профиля пользователя
    updateProfile: async (creds?: Credentials, newProfile?: Partial<Profile>): Promise<Profile> => {
        // Проверка наличия новых данных для обновления
        if (!newProfile) {
            // Создание кастомной ошибки с деталями
            const error: any = new Error("Новые данные для профиля не были переданы");
            error.response = {
                data: { detail: "Новые данные для профиля не были переданы" },
                status: 400
            };
            throw error; // Выброс ошибки если данные не переданы
        }
        // Выполнение PUT-запроса для обновления профиля
        const res = await axios_api.put<Profile>(
            "/task-api/updateUser",
            newProfile, // Данные для обновления
            {
                auth: creds ? { username: creds.username, password: creds.password } : undefined,
            }
        );
        return res.data;
    }
};

// ↓↓↓ НОВОЕ - добавил блок statisticsApi и экспорт его из api
// API для работы со статистикой
export const statisticsApi = {
    // глобальная статистика — без авторизации
    getGlobal: async (): Promise<UserStatistic[]> => {
        // GET-запрос для получения глобальной статистики (не требует аутентификации)
        const res = await axios_api.get<UserStatistic[]>("/task-api/globalStatistic");
        return res.data;
    },
    // моя статистика — требует Basic Auth
    getMy: async (creds?: Credentials): Promise<MyStatistic> => {
        // GET-запрос для получения персональной статистики (требует аутентификации)
        const res = await axios_api.get<MyStatistic>("/task-api/myStatistic", {
            auth: creds ? { username: creds.username, password: creds.password } : undefined,
        });
        return res.data;
    },
};
// ↑↑↑ НОВОЕ - добавил блок statisticsApi и экспорт его из api

// myTaskApi - API для работы с задачами пользователя
interface TaskResponse {
    taskId: number;
    title: string;
    author: number;
    performer: number;
    deadline: string;
    status: string;
    description: string;
    result: string | null;
}

export const myTasksApi = {
    // Метод для получения всех задач пользователя с поддержкой пагинации
    getAll: async ({
        username,
        password,
        start,
        limit,
    }: Credentials & { start?: number; limit?: number }): Promise<Task[]> => {
        const res = await axios_api.get<TaskResponse[]>("/task-api/myTasks", {
            auth: { username, password }, // Basic аутентификация
            params: { start, limit }, // Параметры пагинации
        });

        // Преобразование данных из формата API в формат приложения
        return res.data.map((t) => ({
            id: t.taskId,
            title: t.title,
            description: t.description,
            deadline: t.deadline,
            status: t.status,
            author: t.author,
            result: t.result,
            performer: t.performer,
        }));
    },

    // Метод для завершения задачи с указанием результата
    complete: async ({
        username,
        password,
        taskId,
        result,
    }: Credentials & { taskId: number; result: string }): Promise<Task> => {
        const res = await axios_api.put<TaskResponse>(
            `/task-api/myTasks/${taskId}`,
            { result }, // Данные результата выполнения
            { auth: { username, password } }
        );

        // Преобразование ответа в формат приложения
        return {
            id: res.data.taskId,
            title: res.data.title,
            description: res.data.description,
            deadline: res.data.deadline,
            status: res.data.status,
            author: res.data.author,
            result: res.data.result,
            performer: res.data.performer,
        };
    },
};
// ↑↑↑ myTaskApi

// Функция для проверки аутентификации пользователя
export const checkAuth = async (creds: Credentials): Promise<void> => {
    await axios_api.get("/task-api/myProfile", {
        auth: { username: creds.username, password: creds.password },
    });
};

// --- НОВОЕ: API для задач ---
export const tasksApi = {
    // Метод для создания новой задачи
    createTask: async (taskData: TaskCreatePayload, creds?: Credentials): Promise<Task> => {
        try {
            const res = await axios_api.post<Task>(
                "/task-api/createTask",
                taskData, // Данные новой задачи
                {
                    auth: creds ? { username: creds.username, password: creds.password } : undefined,
                }
            );
            return res.data;
        } catch (err) {
            console.error('API Error:', err); // Логирование ошибки
            throw err; // Проброс ошибки дальше
        }
    },
};

// --- DELEGATED TASKS - API для делегированных задач ---
export const delegatedTasksApi = {
    // Метод для получения делегированных задач (которые пользователь назначил другим)
    getTasks: async (
        creds?: Credentials,
        start = 0, // Начальный индекс для пагинации (по умолчанию 0)
        limit = 10 // Лимит задач (по умолчанию 10)
    ): Promise<Task[]> => {
        const res = await axios_api.get("/task-api/delegatedTasks", {
            params: { start, limit }, // Параметры пагинации
            auth: creds ? { username: creds.username, password: creds.password } : undefined,
        });

        // Преобразование данных и приведение типа author к string
        return res.data.map((t: any) => ({
            id: t.taskId,
            title: t.title,
            description: t.description,
            deadline: t.deadline,
            status: t.status,
            author: String(t.author), // Явное приведение к string
            result: t.result,
            performer: t.performer,
        }));
    },

    // Метод для удаления делегированной задачи
    deleteTask: async (taskId: number, creds?: Credentials): Promise<void> => {
        await axios_api.delete(`/task-api/delegatedTasks/${taskId}`, {
            auth: creds ? { username: creds.username, password: creds.password } : undefined,
        });
    },

    // Метод для обновления делегированной задачи
    updateTask: async (
        taskId: number,
        update: Partial<Pick<TaskCreatePayload, "title" | "description" | "deadline">>,
        creds?: Credentials
    ): Promise<Task> => {
        const res = await axios_api.put(
            `/task-api/delegatedTasks/${taskId}`,
            update, // Данные для обновления
            {
                auth: creds ? { username: creds.username, password: creds.password } : undefined,
            }
        );

        const t = res.data;
        return {
            id: t.taskId,
            title: t.title,
            description: t.description,
            deadline: t.deadline,
            status: t.status,
            author: String(t.author), // Явное приведение к string
            result: t.result,
            performer: t.performer,
        };
    },
};

// --- КОНЕЦ НОВОГО ---

// Объект для группировки всех API модулей
export const api = {
    usersApi,
    profileApi,
    statisticsApi,  // <— Мой экспорт
    myTasksApi,
    checkAuth,
    tasksApi,
    delegatedTasksApi,
};


/*
ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:

1. СТРУКТУРА API МОДУЛЯ:
   - Модуль организован как коллекция объектов, каждый отвечает за свою предметную область
   - usersApi - работа с пользователями
   - profileApi - управление профилем
   - statisticsApi - получение статистики
   - myTasksApi - задачи назначенные на пользователя
   - tasksApi - создание задач
   - delegatedTasksApi - задачи, которые пользователь делегировал другим

2. АУТЕНТИФИКАЦИЯ:
   - Большинство методов поддерживают опциональную Basic аутентификацию
   - checkAuth функция для проверки валидности учетных данных
   - creds параметр передает логин и пароль для аутентификации

3. ПАГИНАЦИЯ:
   - Методы getAll и getTasks поддерживают пагинацию через start и limit параметры
   - Это позволяет эффективно работать с большими списками данных

4. ПРЕОБРАЗОВАНИЕ ДАННЫХ:
   - Многие методы преобразуют данные из формата API в формат приложения
   - Например, taskId → id, приведение типов полей
   - Это обеспечивает единообразие данных в приложении

5. ОБРАБОТКА ОШИБОК:
   - Используется try-catch для обработки сетевых ошибок
   - Кастомные ошибки с детализированной информацией
   - Логирование ошибок в консоль для отладки

6. TypeScript ТИПИЗАЦИЯ:
   - Строгая типизация всех методов и параметров
   - Интерфейсы для структур данных (TaskResponse)
   - Дженерики для axios запросов

7. МОДУЛЬНОСТЬ И ПЕРЕИСПОЛЬЗОВАНИЕ:
   - Каждый API модуль независим и может использоваться отдельно
   - Объект api объединяет все модули для удобного импорта
   - Легкость добавления новых API методов

8. HTTP МЕТОДЫ И REST:
   - GET для получения данных
   - POST для создания новых ресурсов
   - PUT для обновления существующих ресурсов
   - DELETE для удаления ресурсов

9. БЕЗОПАСНОСТЬ:
   - Чувствительные данные (пароли) передаются через Basic Auth
   - Валидация входных данных перед отправкой на сервер
   - Обработка различных сценариев ошибок

Комментарии сохранены на русском языке в соответствии с требованиями,
без изменения логики и структуры исходного кода.
*/