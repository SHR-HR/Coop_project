// Импорт React и необходимых хуков
import React, { useEffect, useState, useMemo } from "react";
// Импорт Redux хуков для работы с состоянием
import { useDispatch, useSelector } from "react-redux";
// Импорт TypeScript типа для Redux store
import type { RootState } from "../../store/store";
// Импорт actions для работы с задачами пользователя
import { completeMyTask, fetchMyTasks } from "../../store/slices/myTasksSlice";
// Импорт actions и селекторов для работы со статистикой
import { fetchMyStatistic, selectStatistics } from "../../store/slices/statisticsSlice";
// Импорт селектора для получения всех пользователей
import { selectAllUsers } from "../../store/slices/usersSlice";
// Импорт UI компонентов
import Pagination from "../../shared/ui/Pagination/Pagination";
import MainLayout from "../../layouts/MainLayout";
import TaskFilter from "../../features/MyTasks/TaskFilters/TaskFilters";
import TaskList from "../../features/MyTasks/TaskList/TaskList";
import CompleteModal from "../../features/MyTasks/CompleteModal/CompleteModal";
// Импорт стилей для страницы
import s from "./MyTasksPage.module.scss";

// Основной функциональный компонент страницы "Мои задачи"
const MyTasksPage: React.FC = () => {
  // Инициализация dispatch для отправки actions в Redux store
  const dispatch = useDispatch();

  // Получение состояния из Redux store с помощью селекторов
  const { items, loading, error } = useSelector((state: RootState) => state.myTasks);
  const statistics = useSelector(selectStatistics);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const users = useSelector(selectAllUsers);

  // Состояния для пагинации
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Состояния для фильтров
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deadlineFilter, setDeadlineFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  // Состояния для модального окна завершения задачи
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [comment, setComment] = useState("");

  // Эффект для загрузки данных при монтировании компонента и аутентификации
  useEffect(() => {
    if (isAuthenticated) {
      // Загрузка задач пользователя (первые 100 задач)
      dispatch(fetchMyTasks({ start: 0, limit: 100 }) as any);
      // Загрузка статистики пользователя
      dispatch(fetchMyStatistic() as any);
    }
  }, [dispatch, isAuthenticated]);

  // Функция для определения статуса задачи и проверки просрочки
  const getTaskStatusInfo = (task: any) => {
    // Если задача уже завершена, возвращаем соответствующий статус
    if (task.status === "completed") {
      return {
        status: "completed" as const,
        isOverdue: false,
        overdueDays: 0
      };
    }

    // Создаем объект текущей даты и обнуляем время для точного сравнения
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Создаем объект дедлайна задачи и обнуляем время
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);

    // Проверяем просрочена ли задача
    const isOverdue = deadline < today;

    // Если задача просрочена, вычисляем количество дней просрочки
    if (isOverdue) {
      const diffTime = Math.abs(today.getTime() - deadline.getTime());
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        status: "failed" as const,
        isOverdue: true,
        overdueDays
      };
    }

    // Если задача не просрочена и не завершена - она в работе
    return {
      status: "in work" as const,
      isOverdue: false,
      overdueDays: 0
    };
  };

  // Функция для получения текстовой информации о просрочке
  const getOverdueInfo = (overdueDays: number): string => {
    if (overdueDays === 0) return "";
    return ` (Просрочено на ${overdueDays} ${getDayText(overdueDays)})`;
  };

  // Функция для склонения слова "день" в зависимости от числа
  const getDayText = (days: number): string => {
    if (days % 10 === 1 && days % 100 !== 11) return "день";
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return "дня";
    return "дней";
  };

  // Функция для получения имени автора по ID
  const getAuthorName = (authorId: number): string => {
    const author = users.find(user => user.id === authorId);
    return author ? `${author.name} ${author.name}` : "Неизвестный автор";
  };

  // Мемоизированный расчет отфильтрованных и отсортированных задач
  const filteredItems = useMemo(() => {
    return items
      // Преобразуем каждую задачу, добавляя вычисляемые поля
      .map(task => {
        const statusInfo = getTaskStatusInfo(task);
        return {
          ...task,
          status: statusInfo.status,
          isOverdue: statusInfo.isOverdue,
          overdueDays: statusInfo.overdueDays,
          overdueInfo: getOverdueInfo(statusInfo.overdueDays),
          authorName: getAuthorName(task.author)
        };
      })
      // Применяем фильтры
      .filter(task => {
        // Фильтрация по статусу
        if (statusFilter && task.status !== statusFilter) {
          return false;
        }

        // Фильтрация по дедлайну (показывает задачи с дедлайном до указанной даты)
        if (deadlineFilter) {
          const taskDeadline = new Date(task.deadline);
          const filterDeadline = new Date(deadlineFilter);
          if (taskDeadline > filterDeadline) {
            return false;
          }
        }

        // Фильтрация по автору
        if (authorFilter && task.author !== parseInt(authorFilter)) {
          return false;
        }

        return true;
      })
      // Применяем сортировку
      .sort((a, b) => {
        // Сортировка по возрастанию дедлайна
        if (sortOrder === "asc") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        // Сортировка по убыванию дедлайна
        else if (sortOrder === "desc") {
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        }
        // Без сортировки
        return 0;
      });
  }, [items, statusFilter, deadlineFilter, authorFilter, sortOrder, users]);

  // Мемоизированный расчет пагинированных задач
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, page, pageSize]);

  // Эффект для сброса пагинации при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [statusFilter, deadlineFilter, authorFilter, sortOrder]);

  // Мемоизированный расчет общего количества задач
  const totalTasksCount = useMemo(() => {
    return (statistics.my?.completedTasks ?? 0) +
      (statistics.my?.inWorkTasks ?? 0) +
      (statistics.my?.failedTasks ?? 0);
  }, [statistics]);

  // Обработчик клика по кнопке "Завершить"
  const handleCompleteClick = (taskId: number) => {
    const task = items.find(t => t.id === taskId);
    if (task) {
      const statusInfo = getTaskStatusInfo(task);
      setCurrentTaskId(taskId);
      setCurrentTask({
        ...task,
        ...statusInfo,
        overdueInfo: getOverdueInfo(statusInfo.overdueDays)
      });
      setComment("");
      setIsModalOpen(true);
    }
  };

  // Обработчик подтверждения завершения задачи
  const handleConfirmComplete = () => {
    if (currentTaskId !== null && currentTask) {
      const today = new Date().toLocaleDateString("ru-RU");

      // Формируем финальный комментарий с информацией о просрочке и датой выполнения
      let finalComment = comment;

      if (currentTask.isOverdue) {
        finalComment = `${comment}${currentTask.overdueInfo} (Выполнено: ${today})`;
      } else {
        finalComment = `${comment} (Выполнено: ${today})`;
      }

      // Отправляем action для завершения задачи
      dispatch(
        completeMyTask({
          taskId: currentTaskId,
          result: finalComment,
        }) as any
      );
    }
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  // Обработчик сброса всех фильтров
  const handleResetFilters = () => {
    setStatusFilter(null);
    setDeadlineFilter("");
    setAuthorFilter(null);
    setSortOrder(null);
    setPage(1);
  };

  // Функция для отображения количества задач с учетом фильтров
  const getTasksCountText = () => {
    if (statusFilter || deadlineFilter || authorFilter || sortOrder) {
      return `${filteredItems.length} из ${totalTasksCount}`;
    }
    return `${totalTasksCount}`;
  };

  // Отображение для неавторизованных пользователей
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className={s.container}>
          <h1>Мои задачи</h1>
          <p className={s.error}>Для просмотра войдите в систему</p>
        </div>
      </MainLayout>
    );
  }

  // Основной рендеринг компонента
  return (
    <MainLayout>
      <div className={s.page}>
        {/* Заголовок страницы с количеством задач */}
        <h1>
          Мои задачи{" "}
          <span className={s.count}>{getTasksCountText()}</span>
        </h1>

        {/* Компонент фильтров задач */}
        <TaskFilter
          statusFilter={statusFilter}
          deadlineFilter={deadlineFilter}
          authorFilter={authorFilter}
          sortOrder={sortOrder}
          onStatusChange={setStatusFilter}
          onDeadlineChange={setDeadlineFilter}
          onAuthorChange={setAuthorFilter}
          onSortChange={setSortOrder}
          onReset={handleResetFilters}
          users={users}
        />

        {/* Индикаторы загрузки и ошибок */}
        {loading && <p>Загрузка...</p>}
        {error && <p className={s.error}>{error}</p>}

        {/* Основной контент - список задач */}
        {!loading && !error && (
          <>
            {/* Компонент списка задач */}
            <TaskList
              tasks={paginatedItems}
              onCompleteClick={handleCompleteClick}
            />

            {/* Пагинация если есть задачи */}
            {filteredItems.length > 0 && (
              <Pagination
                total={filteredItems.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            )}

            {/* Сообщение если задачи не найдены */}
            {filteredItems.length === 0 && (
              <p className={s.noTasks}>Задачи не найдены</p>
            )}
          </>
        )}

        {/* Модальное окно завершения задачи */}
        <CompleteModal
          isOpen={isModalOpen}
          comment={comment}
          onCommentChange={setComment}
          onCancel={() => {
            setIsModalOpen(false);
            setCurrentTask(null);
          }}
          onConfirm={handleConfirmComplete}
          isOverdue={currentTask ? currentTask.isOverdue : false}
          overdueInfo={currentTask ? currentTask.overdueInfo : ""}
        />
      </div>
    </MainLayout>
  );
};

// Экспорт компонента по умолчанию
export default MyTasksPage;

// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. АРХИТЕКТУРА КОМПОНЕНТА:
//    - MyTasksPage - главная страница управления задачами пользователя
//    - Использует MainLayout для общей структуры страницы
//    - Состоит из фильтров, списка задач, пагинации и модального окна

// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - Redux для глобального состояния (задачи, статистика, пользователи, аутентификация)
//    - Local State для UI состояния (фильтры, пагинация, модальные окна)
//    - useMemo для оптимизации вычислений

// 3. ФИЛЬТРАЦИЯ И СОРТИРОВКА:
//    - Статус задачи: completed, in work, failed
//    - Дедлайн: фильтрация по дате
//    - Автор: фильтрация по создателю задачи
//    - Сортировка: по дате дедлайна (asc/desc)

// 4. ЛОГИКА РАБОТЫ С ЗАДАЧАМИ:
//    - Автоматическое определение статуса задачи (в работе/просрочена)
//    - Расчет дней просрочки
//    - Правильное склонение слова "день"
//    - Форматирование комментария с датой выполнения

// 5. ПАГИНАЦИЯ И ПРОИЗВОДИТЕЛЬНОСТЬ:
//    - Фиксированный размер страницы: 6 задач
//    - Автоматический сброс пагинации при изменении фильтров
//    - Мемоизация для предотвращения лишних пересчетов

// 6. МОДАЛЬНОЕ ОКНО ЗАВЕРШЕНИЯ:
//    - Подтверждение завершения задачи
//    - Ввод комментария к выполнению
//    - Автоматическое добавление информации о просрочке
//    - Добавление даты выполнения

// 7. ОБРАБОТКА ОШИБОК И ГРАНИЧНЫХ СЛУЧАЕВ:
//    - Проверка аутентификации пользователя
//    - Обработка ошибок загрузки данных
//    - Сообщения для пустых состояний
//    - Защита от несуществующих авторов

// 8. UX/UI ОСОБЕННОСТИ:
//    - Отображение количества задач с учетом фильтров
//    - Возможность сброса всех фильтров
//    - Визуальная обратная связь при загрузке
//    - Интуитивная навигация по страницам

// 9. TypeScript ТИПИЗАЦИЯ:
//    - Строгая типизация пропсов и состояния
//    - Type assertions для Redux actions
//    - Константные типы для статусов задач

// 10. ИНТЕГРАЦИЯ С BACKEND:
//     - Загрузка задач при монтировании компонента
//     - Обновление статистики после завершения задач
//     - Оптимизированные запросы (лимит 100 задач)