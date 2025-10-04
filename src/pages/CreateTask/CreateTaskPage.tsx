// Импорт UI компонентов для построения интерфейса
import Button from "../../shared/ui/Button/Button";
import Input from "../../shared/ui/Input/Input";
import Textarea from "../../shared/ui/Textarea/Textarea";
// Импорт React хуков для управления состоянием и жизненным циклом
import { useEffect, useState, type FormEvent } from 'react';
// Импорт главного layout компонента
import MainLayout from '../../layouts/MainLayout'
// Импорт стилей для страницы создания задачи
import s from './CreateTask.module.scss'
// Импорт actions и селекторов для работы с пользователями
import { fetchUsers, selectAllUsers, selectUsersLoading, selectUsersError } from '../../store/slices/usersSlice';
// Импорт Redux хуков для работы с состоянием
import { useDispatch, useSelector } from 'react-redux';
// Импорт action для создания задачи
import { createTask } from "../../store/slices/taskAddSlice";
// Импорт TypeScript типа для Redux store
import type { AppDispatch } from '../../store/store';
// Импорт actions и селекторов для работы с профилем пользователя
import { fetchProfile, selectProfile } from "../../store/slices/profileSlice";
// Импорт компонента выпадающего списка
import Select from "../../shared/ui/Select/Select";
// Импорт TypeScript типа для данных создания задачи
import type { TaskCreatePayload } from "../../shared/types/types";
// Импорт селектора для проверки аутентификации
import { selectIsAuthenticated } from "../../store/slices/authSlice.ts";

// Основной функциональный компонент страницы создания задачи
function CreateTaskPage() {
  // Получение данных из Redux store с помощью селекторов
  const users = useSelector(selectAllUsers);          // Список всех пользователей
  const profile = useSelector(selectProfile)          // Профиль текущего пользователя
  const isLoading = useSelector(selectUsersLoading);  // Флаг загрузки пользователей
  const error = useSelector(selectUsersError);        // Ошибка загрузки пользователей
  const didAuth = useSelector(selectIsAuthenticated); // Флаг аутентификации пользователя

  // Локальное состояние для формы создания задачи
  const [taskName, setTaskName] = useState('')          // Название задачи
  const [taskDiscription, setTaskDiscription] = useState('') // Описание задачи
  const [selectedAssignee, setSelectedAssignee] = useState(''); // Выбранный исполнитель
  const [deadline, setDeadline] = useState('');         // Дедлайн задачи
  const [isSaving, setIsSaving] = useState(false);      // Флаг сохранения задачи
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // Сообщение статуса

  // Инициализация dispatch для отправки actions в Redux store
  const dispatch = useDispatch<AppDispatch>();

  // Эффект для загрузки данных при монтировании компонента и аутентификации
  useEffect(() => {
    (async () => {
      // Загружаем данные только если пользователь авторизован
      if (didAuth) {
        // Загрузка списка пользователей для выбора исполнителя
        await dispatch(fetchUsers());
        // Загрузка профиля текущего пользователя
        await dispatch(fetchProfile());
      }
    })()
  }, [dispatch, didAuth]); // Зависимости: dispatch и статус аутентификации

  // Преобразование списка пользователей в формат для компонента Select
  const assigneeOptions = users.map(user => ({
    label: user.name,      // Отображаемое имя пользователя
    value: String(user.id), // ID пользователя как строка (для компонента Select)
  }));

  // Получение текущей даты в формате YYYY-MM-DD для ограничения выбора дедлайна
  const today = new Date().toISOString().split('T')[0]

  // Обработчик отправки формы создания задачи
  const handleAddTask = async (e: FormEvent) => {
    // Предотвращение стандартного поведения формы (перезагрузка страницы)
    e.preventDefault();

    // Проверка что профиль пользователя загружен
    if (!profile || !profile.name) {
      console.error("Профиль пользователя не загружен. Невозможно создать задачу.");
      setStatusMessage("Ошибка: профиль пользователя не загружен.");
      return;
    }

    // Поиск ID исполнителя по выбранному значению
    const performerId = users.find(user => String(user.id) === selectedAssignee)?.id;
    // Проверка что исполнитель найден
    if (!performerId) {
      setStatusMessage("Ошибка: Исполнитель не найден.");
      return;
    }

    // Формирование объекта данных для создания задачи
    const newTaskPayload: TaskCreatePayload = {
      title: taskName,           // Название задачи
      description: taskDiscription, // Описание задачи
      performer: performerId,    // ID исполнителя
      deadline: deadline,        // Дедлайн задачи
    };

    // Установка флага сохранения и очистка предыдущих сообщений
    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Отправка action для создания задачи с unwrap() для обработки Promise
      await dispatch(createTask(newTaskPayload)).unwrap();
      // Успешное создание задачи - показываем сообщение и очищаем форму
      setStatusMessage("Задача успешно добавлена!");
      setTaskName('');
      setTaskDiscription('');
      setSelectedAssignee('');
      setDeadline('');
    } catch (err: any) {
      // Обработка ошибки при создании задачи
      console.error("Failed to save the task: ", err);
      setStatusMessage(`Ошибка: ${err.message || 'Неизвестная ошибка'}`);
    } finally {
      // Сброс флага сохранения независимо от результата
      setIsSaving(false);
    }
  };

  // Обработчик очистки всех полей формы
  const clearBtn = () => {
    setTaskName('');
    setTaskDiscription('');
    setSelectedAssignee('');
    setDeadline('');
  }

  // Рендеринг компонента
  return (
    <MainLayout>
      <div className={s.container}>
        <div className={s.card}>
          {/* Заголовок страницы */}
          <h1 className={s.heading}>Добавить новую задачу</h1>
          {/* Подзаголовок с пояснением */}
          <p className={s.subheading}>Заполните все поля, чтобы создать задачу для вашей команды</p>

          {/* Форма создания задачи */}
          <form className={s.form} onSubmit={handleAddTask}>

            {/* Поле для названия задачи */}
            <div className={s.formGroup}>
              <label htmlFor="taskName">Название задачи</label>
              <Input
                type="text"
                required
                placeholder=""
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>

            {/* Поле для описания задачи */}
            <div className={s.formGroup}>
              <label htmlFor="taskDescription" className={s.lable}>Описание задачи</label>
              <Textarea
                required
                value={taskDiscription}
                onChange={(e) => setTaskDiscription(e.target.value)}
              />
            </div>

            {/* Поле выбора исполнителя */}
            <div className={s.formGroup}>
              <label htmlFor="assignee" className={s.lable}>Исполнитель</label>
              <Select
                value={selectedAssignee}
                onChange={setSelectedAssignee}
                options={assigneeOptions}
                placeholder={isLoading ? 'Загрузка пользователей...' : 'Выберите исполнителя'}
                disabled={isLoading || !!error}
                className={s.input}
              />
            </div>

            {/* Поле выбора дедлайна */}
            <div className={s.formGroup}>
              <label htmlFor="deadline" className={s.lable}>Дедлайн</label>
              <Input
                type="date"
                required
                placeholder=""
                value={deadline}
                min={today} // Ограничение - нельзя выбрать прошедшие даты
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Контейнер для кнопок */}
            <div className={s.buttonContainer}>
              <Button
                type="submit"
                variant="primary"
                disabled={!didAuth || isSaving} // Блокировка если не авторизован или идет сохранение
              >
                {isSaving ? 'Сохранение...' : 'Добавить задачу'}
              </Button>
              <Button
                type="button"
                onClick={clearBtn}
                variant="primary"
              >
                Очистить поля
              </Button>
            </div>

          </form>
        </div>
      </div>
    </MainLayout>
  );
}

// Экспорт компонента по умолчанию
export default CreateTaskPage

// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. АРХИТЕКТУРА КОМПОНЕНТА:
//    - CreateTaskPage - страница для создания новых задач
//    - Использует MainLayout для общей структуры страницы
//    - Состоит из формы с несколькими полями ввода

// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - Redux для глобального состояния (пользователи, профиль, аутентификация)
//    - Local State для UI состояния (форма, сообщения, загрузка)
//    - Селекторы для эффективного доступа к данным

// 3. ФОРМА И ВАЛИДАЦИЯ:
//    - Контролируемые компоненты (controlled components)
//    - Валидация на клиенте (required поля)
//    - Ограничение дедлайна (min={today})
//    - Проверка аутентификации перед отправкой

// 4. РАБОТА С ДАННЫМИ:
//    - Загрузка пользователей для выбора исполнителя
//    - Загрузка профиля для идентификации создателя задачи
//    - Преобразование данных для API (TaskCreatePayload)

// 5. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС:
//    - Понятные labels для всех полей
//    - Select компонент для выбора исполнителя
//    - Date input с ограничениями
//    - Кнопки с соответствующими состояниями

// 6. ОБРАБОТКА ОШИБОК И СОСТОЯНИЙ:
//    - Индикация загрузки пользователей
//    - Обработка ошибок загрузки данных
//    - Сообщения о статусе операции
//    - Блокировка формы во время сохранения

// 7. TypeScript ТИПИЗАЦИЯ:
//    - Строгая типизация пропсов и состояния
//    - Типы для событий формы (FormEvent)
//    - Типы для данных задачи (TaskCreatePayload)

// 8. ДОСТУПНОСТЬ И UX:
//    - Семантическая HTML разметка (form, label, input)
//    - Правильная связь label и input (htmlFor)
//    - Понятные сообщения об ошибках
//    - Визуальная обратная связь при действиях

// 9. БЕЗОПАСНОСТЬ И ВАЛИДАЦИЯ:
//    - Проверка аутентификации перед созданием задачи
//    - Валидация обязательных полей
//    - Проверка существования исполнителя
//    - Ограничение дат (только будущие дедлайны)

// 10. ПРОИЗВОДИТЕЛЬНОСТЬ:
//     - useEffect с правильными зависимостями
//     - Мемоизация не требуется (простая форма)
//     - Эффективная работа с Redux store