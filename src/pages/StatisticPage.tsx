// Импорт хуков из React для работы с состоянием, эффектами и мемоизацией
import { useEffect, useMemo, useState } from "react";
// Импорт главного layout компонента для структуры страницы
import MainLayout from "../layouts/MainLayout";
// Импорт компонента кнопки из shared UI компонентов
import Button from "../shared/ui/Button/Button";
// Импорт хуков Redux для работы с состоянием приложения
import { useDispatch, useSelector } from "react-redux";
// Импорт TypeScript типов для Redux store
import type { AppDispatch, RootState } from "../store/store";

// Импорт стилей из различных SCSS модулей
import u from "../features/dashboard/ui.module.scss";  // Общие UI стили для дашборда
import s from "./StatisticPage.module.scss";           // Стили конкретно для этой страницы

// Импорт компонентов дашборда для отображения различных блоков статистики
import TrendsPanel from "../features/dashboard/Trends/TrendsPanel";
import CompletedDistribution from "../features/dashboard/Distribution/CompletedDistribution";

// Импорт actions, селекторов и типов из statistics slice
import {
  fetchGlobalStatistic,    // Action для загрузки глобальной статистики
  fetchMyStatistic,        // Action для загрузки статистики текущего пользователя
  selectStatistics,        // Селектор для получения всего состояния статистики
  setSortMode,             // Action для установки режима сортировки
  type SortMode,           // TypeScript тип для режимов сортировки
} from "../store/slices/statisticsSlice";

// Импорт селекторов из auth slice для проверки аутентификации
import { selectIsAuthenticated } from "../store/slices/authSlice";
// Импорт селектора для получения профиля текущего пользователя
import { selectProfile } from "../store/slices/profileSlice";

// Импорт UI компонентов для визуализации данных
import ChartDonut from "../shared/ui/ChartDonut/ChartDonut";
import UserStatCard from "../features/dashboard/UserStatCard/UserStatCard";
import UsersTable from "../features/dashboard/UsersTable/UsersTable";
import StatsHeader from "../features/dashboard/StatsHeader/StatsHeader";
import WeeklyDelta from "../features/dashboard/WeeklyDelta/WeeklyDelta";
import MyRankBadge from "../features/dashboard/MyRankBadge/MyRankBadge";
import Podium from "../features/dashboard/Podium/Podium";
import Tooltip from "../shared/ui/Tooltip/Tooltip";

// Импорт утилит для экспорта данных в различные форматы
import { exportUsersStatToCSV } from "../shared/utils/csv";
import { exportUsersStatToXLSX } from "../shared/utils/xlsxExport";
import { exportUsersStatToJSON } from "../shared/utils/jsonExport";
import { copyUsersStatToClipboardTSV } from "../shared/utils/clipboard";
// Импорт TypeScript типа для статистики пользователя
import type { UserStatistic } from "../shared/types/types";

// Импорт мемоизированных селекторов для работы с данными статистики
import {
  makeSelectPaginated,    // Селектор для пагинации данных
  makeSelectSorted,       // Селектор для сортировки данных
  selectGlobalTotals,     // Селектор для глобальных сумм
  selectGlobalKpis,       // Селектор для KPI показателей
} from "../store/selectors/statisticsSelectors";

// Основной компонент страницы статистики
export default function StatisticPage() {
  // Инициализация dispatch для отправки actions в Redux store
  const dispatch = useDispatch<AppDispatch>();

  // Получение состояния аутентификации и данных пользователя из Redux store
  const isAuth = useSelector(selectIsAuthenticated);
  const me = useSelector(selectProfile);
  const { loading, error, sortMode } = useSelector(selectStatistics);

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    dispatch(fetchGlobalStatistic());        // Загрузка глобальной статистики
    if (isAuth) dispatch(fetchMyStatistic()); // Загрузка статистики текущего пользователя если авторизован
  }, [dispatch, isAuth]);

  // Состояние для хранения времени последнего визита пользователя
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  useEffect(() => {
    // Чтение предыдущего времени визита из localStorage
    const prevISO = localStorage.getItem("dashboard:lastVisit");
    if (prevISO) setLastVisit(new Date(prevISO));
    // Сохранение текущего времени визита в localStorage
    localStorage.setItem("dashboard:lastVisit", new Date().toISOString());
  }, []);

  // Состояния для управления видом, поиском, пагинацией и фильтрами
  const [view, setView] = useState<"cards" | "table">(
    // Восстановление сохраненного вида из localStorage или значение по умолчанию "cards"
    (localStorage.getItem("dashboard:view") as "cards" | "table") || "cards"
  );
  const [query, setQuery] = useState(localStorage.getItem("dashboard:query") || "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [copyOk, setCopyOk] = useState<null | string>(null);

  // Эффекты для сохранения состояния в localStorage
  useEffect(() => { localStorage.setItem("dashboard:view", view); }, [view]);
  useEffect(() => { localStorage.setItem("dashboard:query", query); }, [query]);

  // Мемоизация селекторов для предотвращения лишних пересчетов
  const selectSorted = useMemo(() => makeSelectSorted(), []);
  const selectPaginated = useMemo(() => makeSelectPaginated(), []);

  // Получение данных через селекторы из Redux store
  const globalTotals = useSelector(selectGlobalTotals);
  const kpis = useSelector(selectGlobalKpis);
  const sorted = useSelector((s: RootState) => selectSorted(s, query, sortMode, onlyActive));
  const { data: paginated, total, totalPages, currentPage } = useSelector((s: RootState) =>
    selectPaginated(s, query, sortMode, onlyActive, page, pageSize)
  );

  // Синхронизация текущей страницы при изменении данных
  useEffect(() => { if (page !== currentPage) setPage(currentPage); }, [currentPage, page]);

  // Функция для установки режима сортировки
  const setSort = (mode: SortMode) => {
    dispatch(setSortMode(mode));  // Отправка action в Redux
    setPage(1);                   // Сброс на первую страницу
    localStorage.setItem("dashboard:sortMode", mode);  // Сохранение в localStorage
  };

  // Функция для показа топ-N пользователей
  const showTop = (n: 1 | 3 | 5) => {
    setOnlyActive(true);          // Показывать только активных пользователей
    setSort("completedDesc");     // Сортировка по выполненным задачам (по убыванию)
    setPageSize(n);               // Установка размера страницы равным N
    setPage(1);                   // Сброс на первую страницу
  };

  // Обработчики для экспорта данных
  const handleExportCSVAll = () => exportUsersStatToCSV(sorted);
  const handleExportCSVPage = () => exportUsersStatToCSV(paginated, { filenameBase: "dashboard_stats_current_page" });
  const handleExportXLSXAll = () => {
    try { exportUsersStatToXLSX(sorted); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Не удалось создать XLSX.";
      alert("Не удалось создать XLSX. Используй CSV или JSON.\nПодробности: " + msg);
      console.error(err);
    }
  };
  const handleExportJSONAll = () => exportUsersStatToJSON(sorted);
  const handleCopyTSV = async () => {
    try {
      await copyUsersStatToClipboardTSV(sorted);
      setCopyOk("Скопировано в буфер!");
      window.setTimeout(() => setCopyOk(null), 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Не удалось скопировать в буфер.");
      console.error(err);
    }
  };
  const handleResetView = () => {
    // Очистка всех сохраненных настроек из localStorage
    localStorage.removeItem("dashboard:view");
    localStorage.removeItem("dashboard:query");
    localStorage.removeItem("dashboard:lastVisit");
    localStorage.removeItem("dashboard:lastSnapshot");
    localStorage.removeItem("dashboard:sortMode");
    setView("cards"); setQuery(""); setPage(1);
    setOnlyActive(false);
  };
  const handleClearTrends = () => {
    localStorage.removeItem("dashboard:history:v1");
  };

  // Рендеринг компонента
  return (
    <MainLayout>
      <div className={s.page}>
        <h1>Дашборд</h1>

        {/* Блок KPI показателей */}
        <StatsHeader
          total={kpis.total}
          completed={kpis.completed}
          inWork={kpis.inWork}
          failed={kpis.failed}
          doneRate={kpis.doneRate}
          avgCompletedPerUser={kpis.avgCompletedPerUser}
          topName={kpis.top?.name ?? null}
        />

        {/* Блок динамики и лидерборда */}
        <WeeklyDelta />
        <div style={{ margin: "8px 0 14px" }}>
          <Podium />
        </div>

        {/* Отображение времени последнего визита */}
        {lastVisit && (
          <div style={{ opacity: 0.7, marginTop: 4 }}>
            Последний визит: {lastVisit.toLocaleString()}
          </div>
        )}

        {/* Верхняя панель с поиском и бейджем ранга */}
        <div className={s.topbar}>
          <input
            className={u.input}
            placeholder="Поиск по имени…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
          <Tooltip label="Моя позиция в рейтинге">
            <MyRankBadge />
          </Tooltip>
        </div>

        {/* Панель инструментов с кнопками управления */}
        <div className={s.toolbar}>
          {/* Переключение между видами отображения */}
          <Tooltip label="Карточки пользователей">
            <Button className={u.btn} variant={view === "cards" ? "primary" : "secondary"} onClick={() => setView("cards")}>Карточки</Button>
          </Tooltip>

          <Tooltip label="Табличный вид">
            <Button className={u.btn} variant={view === "table" ? "primary" : "secondary"} onClick={() => setView("table")}>Таблица</Button>
          </Tooltip>

          {/* Кнопки сортировки */}
          <Tooltip label="Сортировать по выполненным ↓">
            <Button className={u.btn} variant="secondary" onClick={() => setSort("completedDesc")}>Сортировать по выполнено ↓</Button>
          </Tooltip>
          <Tooltip label="Сортировать по просроченным ↓">
            <Button className={u.btn} variant="secondary" onClick={() => setSort("failedDesc")}>По просрочено ↓</Button>
          </Tooltip>
          <Tooltip label="Сортировать по задачам в работе ↓">
            <Button className={u.btn} variant="secondary" onClick={() => setSort("inWorkDesc")}>По «в работе» ↓</Button>
          </Tooltip>
          <Tooltip label="Сортировать по имени A→Z">
            <Button className={u.btn} variant="secondary" onClick={() => setSort("nameAsc")}>По имени A→Z</Button>
          </Tooltip>

          <div style={{ flex: 1 }} />

          {/* Кнопки экспорта и управления */}
          <Tooltip label="Обновить данные">
            <Button className={u.btn} variant="secondary" onClick={() => dispatch(fetchGlobalStatistic())}>Обновить</Button>
          </Tooltip>
          <Tooltip label="Скачать всё в CSV">
            <Button className={u.btn} onClick={handleExportCSVAll}>CSV (всё)</Button>
          </Tooltip>
          <Tooltip label="Скачать текущую страницу CSV">
            <Button className={u.btn} variant="secondary" onClick={handleExportCSVPage}>CSV (страница)</Button>
          </Tooltip>
          <Tooltip label="Экспорт в Excel (XLSX)">
            <Button className={u.btn} variant="secondary" onClick={handleExportXLSXAll}>XLSX</Button>
          </Tooltip>
          <Tooltip label="Экспорт JSON">
            <Button className={u.btn} variant="secondary" onClick={handleExportJSONAll}>JSON</Button>
          </Tooltip>
          <Tooltip label="Скопировать таблицу в буфер (TSV)">
            <Button className={u.btn} variant="secondary" onClick={handleCopyTSV}>Копировать TSV</Button>
          </Tooltip>
          <Tooltip label="Сбросить выбранный вид и фильтры">
            <Button className={u.btn} variant="secondary" onClick={handleResetView}>Сбросить вид</Button>
          </Tooltip>
          <Tooltip label="Очистить сохранённую историю трендов">
            <Button className={u.btn} variant="secondary" onClick={handleClearTrends}>Очистить тренды</Button>
          </Tooltip>
        </div>

        {/* Панель мета-информации и быстрых фильтров */}
        <div className={s.meta}>
          <span>Найдено пользователей: <b>{total}</b></span>
          <span className={s.divider} />
          <span>Показывать: </span>

          {/* Кнопки быстрого доступа к топам */}
          <Tooltip label="Показать только лидера (с задачами)">
            <Button className={u.btn} variant={pageSize === 1 && onlyActive ? "primary" : "secondary"} onClick={() => showTop(1)}>Топ 1</Button>
          </Tooltip>
          <Tooltip label="Первые три по выполненным (без нулевых)">
            <Button className={u.btn} variant={pageSize === 3 && onlyActive ? "primary" : "secondary"} onClick={() => showTop(3)}>Топ 3</Button>
          </Tooltip>
          <Tooltip label="Первые пять по выполненным (без нулевых)">
            <Button className={u.btn} variant={pageSize === 5 && onlyActive ? "primary" : "secondary"} onClick={() => showTop(5)}>Топ 5</Button>
          </Tooltip>

          {/* Кнопка отображения всех пользователей */}
          <Tooltip label="Показать всех пользователей">
            <Button className={u.btn} variant={!onlyActive ? "primary" : "secondary"} onClick={() => { setOnlyActive(false); setPage(1); }}>Все</Button>
          </Tooltip>

          {/* Индикатор успешного копирования */}
          {copyOk && <span style={{ color: "#27ae60" }}>{copyOk}</span>}
        </div>

        {/* Индикаторы загрузки и ошибок */}
        {loading && <div>Загрузка…</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        {/* Блок глобальной сводки с круговой диаграммой */}
        {!loading && !error && (
          <section aria-label="Глобальная сводка" style={{ margin: "12px 0 12px" }}>
            <h3 style={{ margin: "6px 0" }}>Глобальная сводка</h3>
            <ChartDonut
              completed={globalTotals.completed}
              inWork={globalTotals.inWork}
              failed={globalTotals.failed}
              size={96}
              title="Глобальная статистика"
            />
          </section>
        )}

        {/* Компоненты трендов и распределения */}
        <TrendsPanel />
        <CompletedDistribution />

        {/* Основной контент - карточки или таблица */}
        {!loading && !error && sorted.length === 0 && (
          <div style={{ opacity: 0.7, marginTop: 12 }}>
            Нет данных для отображения. Создайте задачи на других страницах, чтобы здесь появились цифры.
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <>
            {view === "cards" ? (
              // Отображение в виде карточек
              <div className={s.cardsGrid}>
                {paginated.map((u, i) => {
                  const isMe = !!(me && u.name === me.name);
                  const totalRow = u.completedTasks + u.inWorkTasks + u.failedTasks;
                  const rank = (currentPage - 1) * pageSize + i + 1;
                  const isTop = kpis.top?.id === u.id;

                  return (
                    <UserStatCard
                      key={u.id}
                      id={u.id}
                      name={u.name}
                      ava={u.ava ?? null}
                      completed={u.completedTasks}
                      inWork={u.inWorkTasks}
                      failed={u.failedTasks}
                      highlight={isMe}
                      top={isTop}
                      rank={rank}
                      total={totalRow}
                    />
                  );
                })}
              </div>
            ) : (
              // Отображение в виде таблицы
              <UsersTable
                data={paginated as UserStatistic[]}
                sortMode={sortMode}
                onSortChange={(m) => setSort(m)}
                meName={me?.name || null}
                pageRankOffset={(currentPage - 1) * pageSize}
              />
            )}

            {/* Пагинация */}
            <div className={s.pager}>
              <Button className={u.btn} variant="secondary" onClick={() => setPage(1)} disabled={currentPage === 1}>« Первая</Button>
              <Button className={u.btn} variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Назад</Button>
              <span style={{ opacity: 0.75 }}>{currentPage} / {totalPages}</span>
              <Button className={u.btn} variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Вперёд</Button>
              <Button className={u.btn} variant="secondary" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>Последняя »</Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}



// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. АРХИТЕКТУРА КОМПОНЕНТА:
//    - StatisticPage - главная страница дашборда со статистикой
//    - Использует MainLayout для общей структуры страницы
//    - Состоит из множества smaller components для модульности

// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - Redux для глобального состояния (статистика, аутентификация)
//    - Local State для UI состояния (вид, поиск, пагинация)
//    - localStorage для сохранения пользовательских предпочтений

// 3. DATA FLOW И СЕЛЕКТОРЫ:
//    - Мемоизированные селекторы для эффективного получения данных
//    - Цепочка преобразований: фильтрация → сортировка → пагинация
//    - Автоматическая синхронизация состояния пагинации

// 4. ЭКСПОРТ ДАННЫХ:
//    - Поддержка multiple форматов: CSV, XLSX, JSON, TSV
//    - Обработка ошибок с пользовательскими сообщениями
//    - Интерактивная обратная связь (copyOk состояние)

// 5. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС:
//    - Два режима отображения: карточки и таблица
//    - Гибкая система сортировки и фильтрации
//    - Быстрый доступ к топам (1, 3, 5)
//    - Tooltip для улучшения UX

// 6. ВИЗУАЛИЗАЦИЯ ДАННЫХ:
//    - KPI панель с ключевыми показателями
//    - Круговая диаграмма для глобальной статистики
//    - Тренды и распределения для аналитики
//    - Лидерборд и подиум для мотивации

// 7. ОБРАБОТКА ОШИБОК И ЗАГРУЗКИ:
//    - Индикаторы загрузки во время запросов
//    - Отображение ошибок в понятном формате
//    - Graceful degradation при отсутствии данных

// 8. ДОСТУПНОСТЬ И SEO:
//    - Семантическая HTML разметка (section, article, h1-h3)
//    - aria-label для скринридеров
//    - Правильная структура заголовков

// 9. ПРОИЗВОДИТЕЛЬНОСТЬ:
//    - useMemo для мемоизации селекторов
//    - useEffect с правильными зависимостями
//    - Ленивая загрузка данных только при необходимости

// 10. UX/UI ОСОБЕННОСТИ:
//     - Сохранение состояния между сессиями
//     - Быстрые действия (топы, сброс)
//     - Визуальная обратная связь для всех действий
//     - Адаптивный дизайн для разных устройств