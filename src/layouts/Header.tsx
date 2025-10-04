// Импорт необходимых хуков и функций из React
import { useEffect, useRef, useState } from "react";
// Импорт хуков для навигации и получения текущего пути из react-router-dom
import { useNavigate, useLocation } from "react-router-dom";
// Импорт модуля стилей из файла Layout.module.scss
import s from './Layout.module.scss';
// Импорт иконок из библиотеки react-icons
import { SiCoop } from "react-icons/si"; // Иконка логотипа Coop
import { FiMenu, FiX } from "react-icons/fi"; // Иконки меню (бургер) и закрытия (крестик)

// Объявление функционального компонента Header
function Header() {
  // Хук useNavigate для программной навигации между страницами
  const navigate = useNavigate();
  // Хук useLocation для получения информации о текущем пути (URL)
  const location = useLocation();

  // Состояние для отслеживания открыто/закрыто мобильное меню
  const [menuOpen, setMenuOpen] = useState(false);
  // Ref для доступа к DOM-элементу навигационного меню
  const menuRef = useRef<HTMLUListElement>(null);

  // Массив объектов с данными для навигационных пунктов
  const navigationItems = [
    { path: "/", label: "Дашборд" }, // Главная страница с dashboard
    { path: "/myTasks", label: "Мои задачи" }, // Страница с задачами пользователя
    { path: "/delegatedTasks", label: "Делегированные" }, // Страница с делегированными задачами
    { path: "/createTask", label: "Создать задачу" }, // Страница создания новой задачи
    { path: "/profile", label: "Профиль" }, // Страница профиля пользователя
  ];

  // Эффект для закрытия меню при клике вне его области
  useEffect(() => {
    // Функция-обработчик клика вне меню
    const handleClickOutside = (e: MouseEvent) => {
      // Проверяем, что клик был не по элементу меню и не по его потомкам
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); // Закрываем меню
      }
    };

    // Добавляем обработчик только если меню открыто
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Функция очистки - удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]); // Зависимость - эффект перезапускается при изменении menuOpen

  // Возвращаем JSX разметку компонента Header
  return (
    // Элемент header с применением стиля из модуля SCSS
    <header className={s.header}>
      {/* Внутренний контейнер header с применением стиля headerInner */}
      <div className={s.headerInner}>
        {/* Блок логотипа с обработчиком клика для перехода на страницу /testPage */}
        <div className={s.logoBox} onClick={() => navigate("/testPage")}>
          {/* Иконка логотипа Coop с применением стиля logo */}
          <SiCoop className={s.logo} />
          {/* Текст логотипа */}
          <span>Coop Project</span>
        </div>

        {/* Кнопка бургер-меню для мобильных устройств */}
        <button
          className={s.burger}
          onClick={() => setMenuOpen(!menuOpen)} // Переключаем состояние меню при клике
        >
          {/* Условный рендеринг: показываем иконку крестика если меню открыто, иначе иконку меню */}
          {menuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>

        {/* Навигационное меню - неупорядоченный список */}
        <ul
          ref={menuRef} // Привязываем ref к элементу меню для обработки кликов вне его
          // Динамическое применение классов: всегда s.navigate, и s.open если menuOpen true
          className={`${s.navigate} ${menuOpen ? s.open : ""}`}
        >
          {/* Маппинг массива navigationItems для создания пунктов меню */}
          {navigationItems.map((item) => (
            <li
              key={item.path} // Уникальный ключ для каждого элемента (React требование)
              // Динамическое применение классов: всегда s.item, и s.active если текущий путь совпадает с путем пункта
              className={`${s.item} ${location.pathname === item.path ? s.active : ""
                }`}
              // Обработчик клика по пункту меню
              onClick={() => {
                navigate(item.path); // Переход на соответствующий путь
                setMenuOpen(false); // Закрытие меню после перехода
              }}
            >
              {/* Отображение текста пункта меню */}
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

// Экспорт компонента Header по умолчанию
export default Header;

/*
ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:

1. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
   - useState для управления видимостью мобильного меню
   - useRef для получения прямого доступа к DOM-элементу меню

2. НАВИГАЦИЯ И МАРШРУТИЗАЦИЯ:
   - useNavigate для программного перехода между страницами
   - useLocation для определения активной страницы (подсветка пункта меню)
   - navigationItems содержит все доступные маршруты приложения

3. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС:
   - Адаптивное меню: на десктопе - горизонтальное, на мобильных - выпадающее
   - Интерактивные иконки (бургер/крестик) для открытия/закрытия меню
   - Визуальная обратная связь через активное состояние пунктов меню

4. ДОСТУПНОСТЬ И UX:
   - Закрытие меню при клике вне его области улучшает пользовательский опыт
   - Автоматическое закрытие меню после выбора пункта на мобильных устройствах
   - Плавные переходы между страницами через react-router-dom

5. СТРУКТУРА КОМПОНЕНТА:
   - Логически разделен на логотип, кнопку меню и навигационные пункты
   - Используется семантический HTML (header, ul, li)
   - Четкое разделение ответственности между элементами

6. ОБРАБОТКА СОБЫТИЙ:
   - Обработчики кликов для навигации и управления состоянием меню
   - Использование делегирования событий для эффективной обработки

7. ТИПИЗАЦИЯ TypeScript:
   - Строгая типизация для useRef (HTMLUListElement)
   - Типизация объектов в массиве navigationItems

Комментарии сохранены на русском языке в соответствии с требованиями,
без изменения логики и структуры исходного кода.
*/