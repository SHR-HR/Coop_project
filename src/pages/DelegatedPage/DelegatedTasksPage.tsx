// Импорт React и необходимых хуков
import { useEffect, useState, type FormEvent } from "react";
// Импорт Redux хуков для работы с состоянием
import { useDispatch, useSelector } from "react-redux";
// Импорт главного layout компонента
import MainLayout from "../../layouts/MainLayout";
// Импорт UI компонентов
import Button from "../../shared/ui/Button/Button";
import Input from "../../shared/ui/Input/Input";
import Textarea from "../../shared/ui/Textarea/Textarea";
// Импорт стилей для страницы
import s from "./DelegatedTask.module.scss";
// Импорт TypeScript типа для Redux store
import type { AppDispatch } from "../../store/store";

// Импорт actions для работы с делегированными задачами
import {
  fetchDelegatedTasks,    // Action для загрузки делегированных задач
  deleteDelegatedTask,    // Action для удаления делегированной задачи
  updateDelegatedTask,    // Action для обновления делегированной задачи
} from "../../store/slices/delegatedTasksSlice";

// Импорт actions и селекторов для работы с пользователями
import { fetchUsers, selectAllUsers } from "../../store/slices/usersSlice";
// Импорт TypeScript типа для RootState
import type { RootState } from "../../store/store";
// Импорт TypeScript типа для задачи
import type { Task } from "../../shared/types/types";

// Основной функциональный компонент страницы делегированных задач
function DelegatedTasksPage() {
  // Инициализация dispatch для отправки actions в Redux store
  const dispatch = useDispatch<AppDispatch>();

  // Получение состояния из Redux store с помощью селекторов
  const { tasks, loading, error } = useSelector(
    (state: RootState) => state.delegatedTasks
  );
  const users = useSelector(selectAllUsers);

  // Состояния для редактирования задачи
  const [editingTask, setEditingTask] = useState<Task | null>(null);  // Текущая редактируемая задача
  const [title, setTitle] = useState("");          // Заголовок задачи в форме
  const [description, setDescription] = useState(""); // Описание задачи в форме
  const [deadline, setDeadline] = useState("");    // Дедлайн задачи в форме

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    // Загрузка делегированных задач (пустой объект параметров)
    dispatch(fetchDelegatedTasks({}));
    // Загрузка списка пользователей
    dispatch(fetchUsers());
  }, [dispatch]);

  // Функция для получения имени пользователя по ID
  const getUserName = (id: number) => {
    // Поиск пользователя в массиве users по ID
    const user = users.find((u) => u.id === id);
    // Возврат имени пользователя или fallback текста если пользователь не найден
    return user ? user.name : `Пользователь #${id}`;
  };

  // Функция для получения аватара пользователя по ID
  const getUserAva = (id: number) => {
    // Поиск пользователя в массиве users по ID
    const user = users.find((u) => u.id === id);
    // Возврат аватара пользователя или fallback изображения если аватар не найден
    return user?.ava ?? "https://via.placeholder.com/40";
  };

  // Обработчик начала редактирования задачи
  const handleEdit = (task: Task) => {
    // Установка текущей редактируемой задачи
    setEditingTask(task);
    // Заполнение формы данными из выбранной задачи
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(task.deadline);
  };

  // Обработчик обновления задачи
  const handleUpdate = async (e: FormEvent) => {
    // Предотвращение стандартного поведения формы (перезагрузка страницы)
    e.preventDefault();
    // Выход если нет редактируемой задачи
    if (!editingTask) return;

    try {
      // Отправка action для обновления задачи с unwrap() для обработки Promise
      await dispatch(
        updateDelegatedTask({
          taskId: Number(editingTask.id),  // Преобразование ID в число
          update: { title, description, deadline },  // Новые данные задачи
        })
      ).unwrap();
      // Сброс состояния редактирования после успешного обновления
      setEditingTask(null);
    } catch (err) {
      // Обработка ошибок при обновлении задачи
      console.error("Ошибка при обновлении задачи:", err);
    }
  };

  // Обработчик удаления задачи
  const handleDelete = (taskId: number) => {
    // Отправка action для удаления задачи
    dispatch(deleteDelegatedTask(taskId));
  };

  // Рендеринг компонента
  return (
    <MainLayout>
      <div className={s.container}>
        {/* Заголовок страницы */}
        <h1 className={s.heading}>Мои делегированные задачи</h1>

        {/* Индикатор загрузки */}
        {loading && <p>Загрузка...</p>}
        {/* Сообщение об ошибке */}
        {error && <p className={s.error}>{error}</p>}

        {/* Список делегированных задач */}
        <ul className={s.taskList}>
          {/* Маппинг массива задач для отображения каждой задачи */}
          {tasks.map((task) => (
            <li key={task.id} className={s.taskCard}>
              {/* Заголовок задачи */}
              <h3>{task.title}</h3>
              {/* Описание задачи */}
              <p>{task.description}</p>
              {/* Дедлайн задачи */}
              <p>
                <strong>Дедлайн:</strong> {task.deadline}
              </p>

              {/* Блок с информацией об исполнителе */}
              <div className={s.performer}>
                {/* Аватар исполнителя */}
                <img
                  src={getUserAva(task.performer)}  // Получение URL аватара
                  alt={getUserName(task.performer)} // Альтернативный текст с именем
                  width={40}                        // Ширина изображения
                  height={40}                       // Высота изображения
                  className={s.avatar}              // CSS класс для стилизации
                />
                {/* Имя исполнителя */}
                <span>{getUserName(task.performer)}</span>
              </div>

              {/* Блок с кнопками действий */}
              <div className={s.buttons}>
                {/* Кнопка редактирования */}
                <Button variant="primary" onClick={() => handleEdit(task)}>
                  Редактировать
                </Button>
                {/* Кнопка удаления */}
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(Number(task.id))}
                >
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {/* Форма редактирования задачи (отображается условно) */}
        {editingTask && (
          <div className={s.editFormWrapper}>
            <h2>Редактирование задачи</h2>
            {/* Форма для редактирования задачи */}
            <form onSubmit={handleUpdate} className={s.form}>
              {/* Поле для заголовка задачи */}
              <div className={s.formGroup}>
                <label>Название</label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Поле для описания задачи */}
              <div className={s.formGroup}>
                <label>Описание</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Поле для дедлайна задачи */}
              <div className={s.formGroup}>
                <label>Дедлайн</label>
                <Input
                  type="date"  // Специальный тип input для выбора даты
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              {/* Блок с кнопками формы */}
              <div className={s.buttonContainer}>
                {/* Кнопка сохранения изменений */}
                <Button type="submit" variant="primary">
                  Сохранить
                </Button>
                {/* Кнопка отмены редактирования */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

// Экспорт компонента по умолчанию
export default DelegatedTasksPage


// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. АРХИТЕКТУРА КОМПОНЕНТА:
//    - DelegatedTasksPage - страница для управления делегированными задачами
//    - Использует MainLayout для общей структуры страницы
//    - Состоит из списка задач и формы редактирования

// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - Redux для глобального состояния (задачи, пользователи)
//    - Local State для UI состояния (редактирование, форма)
//    - Селекторы для эффективного доступа к данным

// 3. РАБОТА С ДАННЫМИ:
//    - Загрузка делегированных задач и пользователей при монтировании
//    - Преобразование ID пользователей в читаемые имена и аватары
//    - Обработка отсутствующих данных (fallback значения)

// 4. CRUD ОПЕРАЦИИ:
//    - Read: отображение списка задач
//    - Update: редактирование существующих задач
//    - Delete: удаление задач
//    - Create: не реализовано на этой странице (предположительно на другой)

// 5. ФОРМЫ И ВАЛИДАЦИЯ:
//    - Управляемые компоненты формы (controlled components)
//    - Обработка отправки формы с preventDefault()
//    - Обработка ошибок с try-catch

// 6. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС:
//    - Список задач в виде карточек
//    - Информация об исполнителе с аватаром
//    - Модальное/встроенное окно редактирования
//    - Индикаторы загрузки и ошибок

// 7. TypeScript ТИПИЗАЦИЯ:
//    - Строгая типизация пропсов и состояния
//    - Типы для событий формы (FormEvent)
//    - Типы для задач и пользователей

// 8. ДОСТУПНОСТЬ И UX:
//    - Семантическая HTML разметка (ul, li, form, label)
//    - Alt атрибуты для изображений
//    - Четкие labels для полей формы
//    - Визуальная обратная связь при действиях

// 9. ОБРАБОТКА ОШИБОК:
//    - Отображение ошибок загрузки
//    - Обработка ошибок при обновлении задач
//    - Console.error для отладки

// 10. ПРОИЗВОДИТЕЛЬНОСТЬ:
//     - useEffect с правильными зависимостями
//     - Локальное состояние только для необходимых данных
//     - Эффективное обновление только при изменении данных