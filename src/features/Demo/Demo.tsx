// Импорт хука useState из React для управления состоянием компонента
import { useState } from "react"
// Импорт различных UI компонентов из папки shared UI компонентов
import Input from "../../shared/ui/Input/Input"
import Textarea from "../../shared/ui/Textarea/Textarea"
import Select from "../../shared/ui/Select/Select"
import Checkbox from "../../shared/ui/Checkbox/Checkbox"
import Radio from "../../shared/ui/Radio/Radio"
import Button from "../../shared/ui/Button/Button"
import Switch from "../../shared/ui/Switch/Switch"

// Импорт модуля стилей из файла Demo.module.scss
import s from "./Demo.module.scss"

// Объявление функционального компонента Demo
function Demo() {
  // Состояние для хранения текста из компонента Input
  const [text, setText] = useState("")
  // Состояние для хранения сообщения из компонента Textarea
  const [message, setMessage] = useState("")
  // Состояние для хранения выбранного героя из компонента Select (может быть строкой или null)
  const [hero, setHero] = useState<string | null>(null)
  // Состояние для переключателя Switch (включен/выключен)
  const [enabled, setEnabled] = useState(false)
  // Состояние для чекбокса согласия
  const [agree, setAgree] = useState(false)
  // Состояние для выбранной опции в радио-кнопках
  const [selected, setSelected] = useState("option1")

  // Дополнительные состояния для демонстрации работы с разными типами данных в Select
  const [num, setNum] = useState<number | null>(null) // Состояние для числового значения
  const [bool, setBool] = useState<boolean | null>(null) // Состояние для булевого значения

  // Массив объектов с данными о героях для выпадающего списка Select
  const heroes = [
    { value: "batman", label: "Batman" }, // Объект с значением и меткой для Batman
    { value: "superman", label: "Superman" }, // Объект с значением и меткой для Superman
    { value: "ironman", label: "Iron Man" }, // Объект с значением и меткой для Iron Man
    { value: "thor", label: "Thor" }, // Объект с значением и меткой для Thor
    { value: "hulk", label: "Hulk" }, // Объект с значением и меткой для Hulk
    { value: "spiderman", label: "Spidy" }, // Объект с значением и меткой для Spiderman (сокращенное имя)
  ]

  // Возвращаем JSX разметку компонента Demo
  return (
    // Основной контейнер с применением стиля wrapper из модуля SCSS
    <div className={s.wrapper}>
      {/* Заголовок второго уровня для страницы демонстрации */}
      <h2>UI Components Demo</h2>

      {/* Компонент Input для ввода текста */}
      <Input
        value={text} // Текущее значение из состояния text
        onChange={e => setText(e.target.value)} // Обработчик изменения - обновляет состояние text
        placeholder="Enter text" // Текст placeholder для пустого поля
      />

      {/* Компонент Textarea для ввода многострочного текста */}
      <Textarea
        value={message} // Текущее значение из состояния message
        onChange={e => setMessage(e.target.value)} // Обработчик изменения - обновляет состояние message
        placeholder="Enter message" // Текст placeholder для пустой текстовой области
      />

      {/* Компонент Select для выбора героя из списка */}
      <Select
        value={hero} // Текущее выбранное значение из состояния hero
        onChange={setHero} // Обработчик изменения - обновляет состояние hero
        options={heroes} // Массив опций для выпадающего списка
        placeholder="Choose hero" // Текст placeholder для пустого селекта
      />

      {/* Комментарий о функциональности поиска в выпадающем списке */}
      {/* Поисковик в дропдауне появляется при количестве option больше 5  */}

      {/* Компонент Select для выбора числа с числовыми значениями */}
      <Select
        value={num} // Текущее выбранное значение из состояния num (число или null)
        onChange={setNum} // Обработчик изменения - обновляет состояние num
        // Массив опций с числовыми значениями
        options={[
          { label: "Один", value: 1 }, // Опция со значением 1
          { label: "Два", value: 2 }, // Опция со значением 2
          { label: "Три", value: 3 }, // Опция со значением 3
        ]}
        placeholder="Выбери число" // Текст placeholder на русском языке
      />
      {/* Заголовок с вычислением квадрата выбранного числа */}
      <h2>{num !== null && num * num}</h2> {/* Условный рендеринг: показываем квадрат числа если num не null */}

      {/* Компонент Select для выбора булевого значения */}
      <Select
        value={bool} // Текущее выбранное значение из состояния bool (boolean или null)
        onChange={setBool} // Обработчик изменения - обновляет состояние bool
        // Массив опций с булевыми значениями
        options={[
          { label: "Да", value: true }, // Опция со значением true
          { label: "Нет", value: false }, // Опция со значением false
        ]}
        placeholder="Выбери ответ" // Текст placeholder на русском языке
      />

      {/* Компонент Switch (переключатель) */}
      <Switch
        checked={enabled} // Текущее состояние переключателя (включен/выключен)
        onChange={setEnabled} // Обработчик изменения - обновляет состояние enabled
        variant="secondary" // Вариант стиля переключателя
        label="Toggle" // Текст метки переключателя
      />

      {/* Компонент Checkbox (чекбокс) */}
      <Checkbox
        checked={agree} // Текущее состояние чекбокса (отмечен/не отмечен)
        onChange={setAgree} // Обработчик изменения - обновляет состояние agree
        label="I agree" // Текст метки чекбокса
      />

      {/* Контейнер для радио-кнопок с inline стилями */}
      <div style={{ display: "flex", gap: "1rem" }}> {/* Flexbox контейнер с расстоянием 1rem между элементами */}
        {/* Первая радио-кнопка */}
        <Radio
          checked={selected === "option1"} // Состояние checked: true если selected равен "option1"
          onChange={() => setSelected("option1")} // Обработчик изменения - устанавливает selected в "option1"
          label="Option 1" // Текст метки первой опции
        />
        {/* Вторая радио-кнопка */}
        <Radio
          checked={selected === "option2"} // Состояние checked: true если selected равен "option2"
          onChange={() => setSelected("option2")} // Обработчик изменения - устанавливает selected в "option2"
          label="Option 2" // Текст метки второй опции
        />
      </div>

      {/* Контейнер для кнопок разных вариантов с inline стилями */}
      <div style={{ display: "flex", gap: "1rem" }}> {/* Flexbox контейнер с расстоянием 1rem между кнопками */}
        {/* Кнопка с вариантом стиля "primary" */}
        <Button variant="primary">Primary</Button>
        {/* Кнопка с вариантом стиля "secondary" */}
        <Button variant="secondary">Secondary</Button>
        {/* Кнопка с вариантом стиля "danger" */}
        <Button variant="danger">Danger</Button>
      </div>
    </div>
  )
}

// Экспорт компонента Demo по умолчанию для использования в других частях приложения
export default Demo


/*
ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:

1. НАЗНАЧЕНИЕ КОМПОНЕНТА:
   - Demo компонент служит для демонстрации всех доступных UI компонентов
   - Позволяет разработчикам тестировать и просматривать различные элементы интерфейса
   - Используется для проверки функциональности и внешнего вида компонентов

2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
   - Каждый UI компонент управляется своим отдельным состоянием
   - Используются различные типы данных: string, number, boolean, null
   - Демонстрируется работа с универсальными типами в Select компоненте

3. ТИПИЗАЦИЯ TypeScript:
   - Явное указание типов для состояний с универсальными значениями
   - Состояния могут принимать null значения для представления "не выбранного" состояния
   - Строгая типизация обеспечивает безопасность при работе с разными типами данных

4. ФУНКЦИОНАЛЬНОСТЬ SELECT КОМПОНЕНТА:
   - Автоматическое включение поиска при количестве опций больше 5
   - Работа с различными типами значений: string, number, boolean
   - Демонстрация вычислений на основе выбранных значений (квадрат числа)

5. КОМПОЗИЦИЯ КОМПОНЕНТОВ:
   - Все компоненты импортируются из единой папки shared UI
   - Единообразный API для всех компонентов (value, onChange, label и т.д.)
   - Гибкая настройка через пропсы

6. СТИЛИЗАЦИЯ И РАСПОЛОЖЕНИЕ:
   - Основной контейнер использует CSS модули для изоляции стилей
   - Inline стили для простых layout задач (расположение радио-кнопок и кнопок)
   - Последовательное расположение компонентов для удобства восприятия

7. МЕЖДУНАРОДИЗАЦИЯ:
   - Смешанное использование английских и русских текстов
   - Демонстрация поддержки разных языков в компонентах

8. ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ:
   - Массив heroes содержит популярных супергероев для тестирования
   - Различные варианты данных для демонстрации гибкости компонентов
   - Интерактивные вычисления (квадрат числа) показывают практическое применение

Комментарии сохранены на русском языке в соответствии с требованиями,
без изменения логики и структуры исходного кода.
*/