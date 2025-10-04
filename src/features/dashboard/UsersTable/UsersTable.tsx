// Импорт файла стилей для компонента UsersTable из SCSS модуля
import s from "./UsersTable.module.scss";
// Импорт компонента DoneRateBadge для отображения бейджа процента выполнения
import DoneRateBadge from "../DoneRateBadge/DoneRateBadge";
// Импорт компонента OverdueBadge для отображения бейджа просроченных задач
import OverdueBadge from "../OverdueBadge/OverdueBadge";

// Импорт типов TypeScript для типизации данных
import type { UserStatistic } from "../../../shared/types/types";
import type { SortMode } from "../../../store/slices/statisticsSlice";

// Определение типа Props для пропсов компонента UsersTable
type Props = {
    data: UserStatistic[];           // Массив данных статистики пользователей
    sortMode: SortMode;              // Текущий режим сортировки таблицы
    onSortChange: (m: SortMode) => void; // Функция обратного вызова для изменения сортировки
    meName: string | null;           // Имя текущего пользователя (для выделения строки)
    pageRankOffset?: number;         // Смещение для нумерации строк (для пагинации)
};

// Константа с SVG изображением для аватара по умолчанию
// Увеличенный фоллбек-аватар размером 44x44 пикселя
// data:image/svg+xml - встроенное SVG изображение в формате base64
const fallbackAva =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><rect width='100%' height='100%' rx='8' ry='8' fill='%23ecf0f1'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%23999'>no img</text></svg>";

// Экспорт компонента UsersTable по умолчанию
// Основной компонент таблицы пользователей со статистикой
export default function UsersTable({
    data,                    // Деструктуризация пропса data - массив статистики пользователей
    sortMode,                // Деструктуризация пропса sortMode - текущий режим сортировки
    onSortChange,            // Деструктуризация пропса onSortChange - функция изменения сортировки
    meName,                  // Деструктуризация пропса meName - имя текущего пользователя
    pageRankOffset = 0,      // Деструктуризация пропса pageRankOffset со значением по умолчанию 0
}: Props) {
    // Возвращение JSX разметки компонента таблицы
    return (
        // Основной контейнер таблицы
        <div className={s.tableWrap}>
            {/* Подсказка о текущей сортировке */}
            <div className={s.sortHint}>Сортировка: {humanSort(sortMode)} ↓</div>

            {/* HTML таблица с доступностью для скринридеров */}
            <table className={s.table} aria-label="Пользователи">
                {/* Заголовок таблицы */}
                <thead>
                    {/* Строка заголовков столбцов */}
                    <tr>
                        {/* Столбец с номером позиции */}
                        <th className={s.colNum}>#</th>

                        {/* Сортируемый столбец "Имя" */}
                        <th
                            className={s.sortable}  // Класс для сортируемых столбцов
                            title="Сортировать по имени A→Z"  // Подсказка при наведении
                            onClick={() => onSortChange("nameAsc")}  // Обработчик клика для сортировки по имени
                        >
                            Имя
                        </th>

                        {/* Сортируемый столбец "Выполнено" */}
                        <th
                            className={s.sortable}
                            title="Сортировать по выполнено ↓"
                            onClick={() => onSortChange("completedDesc")}
                        >
                            Выполнено
                        </th>

                        {/* Сортируемый столбец "В работе" */}
                        <th
                            className={s.sortable}
                            title="Сортировать по «в работе» ↓"
                            onClick={() => onSortChange("inWorkDesc")}
                        >
                            В работе
                        </th>

                        {/* Сортируемый столбец "Просрочено" */}
                        <th
                            className={s.sortable}
                            title="Сортировать по просрочено ↓"
                            onClick={() => onSortChange("failedDesc")}
                        >
                            Просрочено
                        </th>

                        {/* Несортируемый столбец "Всего / %" */}
                        <th>Всего / %</th>

                        {/* Столбец с визуализацией прогресса */}
                        <th className={s.colBar}>Визуал</th>
                    </tr>
                </thead>

                {/* Тело таблицы с данными */}
                <tbody>
                    {/* Маппинг массива данных пользователей для создания строк таблицы */}
                    {data.map((u, i) => {
                        // Вычисление общего количества задач пользователя
                        const total = u.completedTasks + u.inWorkTasks + u.failedTasks;

                        // Вычисление процента выполненных задач
                        const doneRate = total ? Math.round((u.completedTasks / total) * 100) : 0;

                        // Вычисление общего процента выполненных задач (дублирует doneRate)
                        const totalPct = total ? Math.round((u.completedTasks / total) * 100) : 0;

                        // Вычисление ранга пользователя с учетом смещения пагинации
                        const rank = pageRankOffset + i + 1;

                        // Возвращение строки таблицы для каждого пользователя
                        return (
                            // Строка таблицы с уникальным ключом и условным классом для текущего пользователя
                            <tr key={u.id} className={meName && u.name === meName ? s.meRow : undefined}>
                                {/* Ячейка с номером позиции (рангом) */}
                                <td className={s.colNum}>{rank}</td>

                                {/* Ячейка с информацией о пользователе (аватар и имя) */}
                                <td className={s.userCell}>
                                    {/* Аватар пользователя */}
                                    <img
                                        className={s.ava}           // CSS класс для стилизации аватара
                                        src={u.ava || fallbackAva}  // Источник изображения или фоллбек
                                        alt={u.name}                // Альтернативный текст для доступности
                                        width={44}                  // Ширина изображения 44px
                                        height={44}                 // Высота изображения 44px
                                        // Обработчик ошибки загрузки изображения
                                        onError={(e) => {
                                            const img = e.currentTarget as HTMLImageElement;  // Приведение типа к HTMLImageElement
                                            // Если текущий источник не фоллбек, заменяем на фоллбек
                                            if (img.src !== fallbackAva) img.src = fallbackAva;
                                        }}
                                    />
                                    {/* Контейнер для имени и бейджей */}
                                    <div className={s.nameBox}>
                                        {/* Имя пользователя с жирным начертанием */}
                                        <b className={s.name}>{u.name}</b>
                                        {/* Контейнер для бейджей */}
                                        <div className={s.badges}>
                                            {/* Бейдж процента выполнения */}
                                            <DoneRateBadge doneRate={doneRate} />
                                            {/* Бейдж просроченных задач */}
                                            <OverdueBadge failed={u.failedTasks} total={total} />
                                        </div>
                                    </div>
                                </td>

                                {/* Ячейка с количеством выполненных задач */}
                                <td>{u.completedTasks}</td>

                                {/* Ячейка с количеством задач в работе */}
                                <td>{u.inWorkTasks}</td>

                                {/* Ячейка с количеством просроченных задач */}
                                <td>{u.failedTasks}</td>

                                {/* Ячейка с общим количеством задач и процентом выполнения */}
                                <td>{total} / {totalPct}%</td>

                                {/* Ячейка с визуализацией прогресса */}
                                <td className={s.colBar}>
                                    {/* Контейнер для полосы прогресса */}
                                    <div className={s.bar}>
                                        {/* Заполненная часть полосы прогресса */}
                                        {/* inline стиль задает ширину в процентах */}
                                        <span className={s.barFill} style={{ width: `${totalPct}%` }} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Вспомогательная функция для преобразования режима сортировки в человеко-читаемый текст
function humanSort(mode: SortMode) {
    // Switch выражение для преобразования технического названия в понятный текст
    switch (mode) {
        case "completedDesc": return "Выполнено";      // Сортировка по выполненным задачам (по убыванию)
        case "failedDesc": return "Просрочено";        // Сортировка по просроченным задачам (по убыванию)
        case "inWorkDesc": return "В работе";          // Сортировка по задачам в работе (по убыванию)
        case "nameAsc": return "Имя (A→Z)";            // Сортировка по имени (по возрастанию)
        default: return "—";                           // Значение по умолчанию (прочерк)
    }
}

// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. СТРУКТУРА КОМПОНЕНТА:
//    - UsersTable - основной компонент таблицы пользователей
//    - humanSort - вспомогательная функция для локализации режимов сортировки
//    - Принимает 5 пропсов: data, sortMode, onSortChange, meName, pageRankOffset

// 2. ТИПИЗАЦИЯ TypeScript:
//    - UserStatistic - тип для данных пользователя
//    - SortMode - тип для режимов сортировки
//    - Props - строгая типизация всех входящих параметров

// 3. ИНТЕРАКТИВНОСТЬ:
//    - Сортируемые столбцы имеют класс s.sortable и обработчики onClick
//    - onSortChange вызывается с соответствующим режимом сортировки
//    - Подсказки title объясняют действие при клике

// 4. ОБРАБОТКА ИЗОБРАЖЕНИЙ:
//    - fallbackAva - SVG аватар по умолчанию при отсутствии изображения
//    - onError обработчик заменяет битое изображение на фоллбек
//    - Проверка img.src !== fallbackAva предотвращает бесконечный цикл

// 5. ВЫЧИСЛЕНИЯ ДАННЫХ:
//    - total - сумма всех типов задач
//    - doneRate и totalPct - процент выполненных задач (вычисляются дважды)
//    - rank - позиция в рейтинге с учетом пагинации

// 6. ВИЗУАЛЬНЫЕ ЭЛЕМЕНТЫ:
//    - Аватар 44x44px с скругленными углами
//    - Бейджи DoneRateBadge и OverdueBadge
//    - Полоса прогресса с динамической шириной
//    - Выделение строки текущего пользователя (s.meRow)

// 7. ДОСТУПНОСТЬ:
//    - aria-label="Пользователи" для скринридеров
//    - alt атрибут для изображений аватаров
//    - Подсказки title для интерактивных элементов

// 8. ОБРАБОТКА ГРАНИЧНЫХ СЛУЧАЕВ:
//    - Защита от деления на ноль при total = 0
//    - Значение по умолчанию для pageRankOffset = 0
//    - Фоллбек для отсутствующих аватаров
//    - Обработка ошибок загрузки изображений