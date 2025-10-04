// Импорт базовой конфигурации ESLint для JavaScript
// @eslint/js предоставляет рекомендованные настройки для JavaScript
import js from '@eslint/js'
// Импорт глобальных переменных для различных сред выполнения
// globals предоставляет предопределенные глобальные переменные для browser, node и других сред
import globals from 'globals'
// Импорт плагина ESLint для React Hooks
// reactHooks предоставляет правила для правильного использования React хуков
import reactHooks from 'eslint-plugin-react-hooks'
// Импорт плагина ESLint для React Refresh (Hot Module Replacement)
// reactRefresh обеспечивает правила для корректной работы Fast Refresh в Vite
import reactRefresh from 'eslint-plugin-react-refresh'
// Импорт TypeScript конфигурации для ESLint
// tseslint предоставляет правила и конфигурации для TypeScript
import tseslint from 'typescript-eslint'
// Импорт функций defineConfig и globalIgnores из ESLint config API
// defineConfig - функция для создания конфигурации ESLint с поддержкой TypeScript
// globalIgnores - функция для определения глобально игнорируемых путей
import { defineConfig, globalIgnores } from 'eslint/config'

// Экспорт конфигурации ESLint по умолчанию
// defineConfig используется для типобезопасной конфигурации ESLint
export default defineConfig([
  // Глобальное игнорирование директории dist
  // dist содержит собранные production файлы, которые не нужно проверять линтером
  globalIgnores(['dist']),

  // Основная конфигурация для TypeScript и TypeScript React файлов
  {
    // Определение файлов, к которым применяется эта конфигурация
    // **/*.{ts,tsx} - все файлы с расширениями .ts и .tsx в любых поддиректориях
    files: ['**/*.{ts,tsx}'],

    // Набор расширений конфигураций, которые применяются к файлам
    extends: [
      // Рекомендованная конфигурация для JavaScript от ESLint
      js.configs.recommended,
      // Рекомендованная конфигурация для TypeScript
      tseslint.configs.recommended,
      // Последняя рекомендованная конфигурация для React Hooks
      reactHooks.configs['recommended-latest'],
      // Конфигурация для React Refresh (Vite HMR)
      reactRefresh.configs.vite,
    ],

    // Настройки языка и окружения
    languageOptions: {
      // Версия ECMAScript 2020 (ES11)
      // Поддерживает современные возможности JavaScript
      ecmaVersion: 2020,
      // Глобальные переменные браузерного окружения
      // Включает window, document, console, setTimeout и другие браузерные API
      globals: globals.browser,
    },
  },
])




/* ===== ПОЯСНЕНИЯ К КОММЕНТАРИЯМ ===== */

/*
1. Назначение файла eslint.config.js:
   - Конфигурация ESLint для статического анализа кода
   - Определяет правила и настройки для проверки JavaScript/TypeScript кода
   - Обеспечивает единый стиль кода и выявление потенциальных ошибок

2. Архитектура плоской конфигурации (Flat Config):
   - Новый формат конфигурации ESLint начиная с версии 9.x
   - Заменяет традиционный .eslintrc.js
   - Более простой и понятный синтаксис
   - Лучшая производительность

3. Импортируемые модули и их назначение:

   @eslint/js:
   - Официальные конфигурации ESLint для JavaScript
   - js.configs.recommended - рекомендованные правила для JS

   globals:
   - Предопределенные глобальные переменные для разных сред
   - globals.browser - переменные браузерного окружения

   eslint-plugin-react-hooks:
   - Правила для React хуков (useState, useEffect и др.)
   - Проверяет правила использования хуков

   eslint-plugin-react-refresh:
   - Поддержка React Fast Refresh (Hot Module Replacement)
   - Обеспечивает корректную работу HMR в Vite

   typescript-eslint:
   - Парсер и правила для TypeScript
   - Заменяет устаревший @typescript-eslint/parser

4. Структура конфигурации:

   globalIgnores(['dist']):
   - Глобальное игнорирование директории dist
   - dist содержит собранный код, который не нужно линтить

   Основной конфигурационный объект:
   - files: определяет целевые файлы (.ts и .tsx)
   - extends: наследует настройки из рекомендованных конфигураций
   - languageOptions: настройки языка и окружения

5. Расширения (extends) конфигурации:

   js.configs.recommended:
   - Базовые правила ESLint для JavaScript
   - Включает основные best practices

   tseslint.configs.recommended:
   - Рекомендованные правила для TypeScript
   - Проверка TypeScript специфичных конструкций

   reactHooks.configs['recommended-latest']:
   - Правила для React Hooks (правила хуков)
   - Проверяет зависимости useEffect, правильное использование хуков

   reactRefresh.configs.vite:
   - Конфигурация для React Refresh в Vite
   - Отключает определенные правила для корректной работы HMR

6. Настройки языка (languageOptions):

   ecmaVersion: 2020:
   - Поддержка возможностей ES2020 (ES11)
   - Включает optional chaining, nullish coalescing и др.

   globals: globals.browser:
   - Предопределяет глобальные переменные браузера
   - Избегает ошибок "is not defined" для window, document и др.

7. Преимущества данной конфигурации:

   Для TypeScript проектов:
   - Полная поддержка TypeSyntax
   - Проверка типов в сочетании с ESLint

   Для React проектов:
   - Специальные правила для React и хуков
   - Поддержка современного React с Hooks

   Для Vite проектов:
   - Интеграция с React Refresh
   - Оптимизировано для development workflow

8. Процесс работы линтера:
   - Анализирует все .ts и .tsx файлы в проекте
   - Игнорирует файлы в dist директории
   - Применяет все указанные правила и конфигурации
   - Выдает предупреждения и ошибки в соответствии с правилами

9. Интеграция с инструментами разработки:
   - Работает с ESLint расширениями в VS Code
   - Может быть интегрирован в pre-commit хуки
   - Используется в CI/CD пайплайнах

10. Масштабируемость:
    - Легко добавлять дополнительные плагины и конфигурации
    - Можно создавать кастомные правила
    - Поддерживает конфигурацию для разных типов файлов

11. Best practices:
    - Использовать рекомендованные конфигурации как основу
    - Игнорировать сгенерированные файлы и директории
    - Настраивать под конкретные потребности проекта

12. Отладка и решение проблем:
    - При ошибках конфигурации проверять версии плагинов
    - Убедиться что все зависимости установлены правильно
    - Проверить совместимость версий ESLint и плагинов
*/