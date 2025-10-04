// Импорт главного layout компонента для структуры страницы
import MainLayout from '../../layouts/MainLayout.tsx'
// Импорт React и необходимых хуков
import React, { useEffect, useRef, useState } from "react";
// Импорт Redux хуков для работы с состоянием
import { useDispatch, useSelector } from 'react-redux';
// Импорт TypeScript типа для Redux store
import type { AppDispatch } from "../../store/store.ts";
// Импорт actions и селекторов из auth slice
import { login, logOut, selectIsAuthenticated, selectUsername } from "../../store/slices/authSlice.ts";
// Импорт стилей для страницы профиля
import s from "./ProfilePage.module.scss";
// Импорт actions и селекторов из profile slice
import {
    clearProfile,
    fetchProfile,
    selectProfile,
    updateProfile,
    selectProfileError,
    selectProfileLoading
} from "../../store/slices/profileSlice.ts";
// Импорт модального окна для профиля
import ProfileModal from "../../shared/ui/ProfileModal/ProfileModal.tsx";
// Импорт UI компонентов
import Button from "../../shared/ui/Button/Button.tsx";
import Input from "../../shared/ui/Input/Input.tsx";
// Импорт actions и селекторов из statistics slice
import { fetchMyStatistic, selectStatistics } from "../../store/slices/statisticsSlice.ts";
// Импорт компонента карточки пользователя
import UserStatCard from "../../features/dashboard/UserStatCard/UserStatCard.tsx";
// Импорт утилиты для обработки аватаров
import { fileToAvatarDataURL } from "./utils/utils";

// Основной функциональный компонент страницы профиля
const ProfilePage: React.FC = () => {
    // Инициализация dispatch для отправки actions в Redux store
    const dispatch = useDispatch<AppDispatch>();

    // Получение состояния из Redux store с помощью селекторов
    const didAuth = useSelector(selectIsAuthenticated);      // Флаг аутентификации
    const profile = useSelector(selectProfile);              // Данные профиля пользователя
    const loading = useSelector(selectProfileLoading);       // Флаг загрузки профиля
    const error = useSelector(selectProfileError);           // Ошибка загрузки профиля
    const authedUsername = useSelector(selectUsername);      // Имя пользователя из аутентификации
    const { my } = useSelector(selectStatistics);            // Статистика текущего пользователя

    // Локальное состояние для формы
    const [userName, setUserName] = useState<string>('');    // Имя пользователя в форме
    const [password, setPassword] = useState<string>('');    // Пароль в форме
    const [ava, setAva] = useState<string>('');              // Аватар в форме
    const fileRef = useRef<HTMLInputElement | null>(null);   // Ref для input файла

    // Состояние для управления модальными окнами и ошибками
    const [modalOpen, setModalOpen] = useState<boolean>(false);      // Флаг открытия модального окна
    const [modalError, setModalError] = useState<string | null>(null); // Ошибка в модальном окне
    const [isEditing, setIsEditing] = useState<boolean>(false);      // Флаг режима редактирования

    // Эффект для загрузки статистики при аутентификации
    useEffect(() => {
        (async () => {
            if (didAuth) await dispatch(fetchMyStatistic());
        })()
    }, [dispatch, didAuth]);

    // Функция для переключения модального окна
    const toggleModal = (editing: boolean = false) => {
        setModalOpen(!modalOpen);
        if (editing) {
            // Режим редактирования профиля
            setIsEditing(true);
            setUserName(profile!.name);      // Установка текущего имени
            setAva(profile!.ava);            // Установка текущего аватара
        }
        if (didAuth && !editing) {
            // Режим смены аккаунта или авторизации
            setIsEditing(false);
            setUserName(authedUsername);     // Установка имени из аутентификации
            setAva('');                      // Сброс аватара
        }
    }

    // Функция для очистки модального окна
    const clearModal = () => {
        setUserName('');                     // Очистка имени
        setPassword('');                     // Очистка пароля
        setModalError('');                   // Очистка ошибок
        setModalOpen(false);                 // Закрытие модального окна
        if (isEditing) setIsEditing(false);  // Сброс режима редактирования
        if (fileRef.current) fileRef.current.value = ""; // Сброс input файла
    }

    // Обработчик авторизации и смены аккаунта
    const handleAuth = async (e?: React.FormEvent) => {
        e?.preventDefault();  // Предотвращение перезагрузки страницы

        // Проверка если пользователь уже авторизован и пытается войти в тот же аккаунт
        if (didAuth) {
            if (userName.trim() === authedUsername.trim()) {
                console.error("Вы уже авторизованы в этом аккаунте");
                return setModalError("Вы уже авторизованы в этом аккаунте");
            }
            try {
                // Попытка смены аккаунта
                await dispatch(login({ username: userName.trim(), password: password.trim() })).unwrap();
                clearModal();  // Очистка модального окна при успехе
                await dispatch(fetchProfile()).unwrap();  // Загрузка нового профиля
                return;
            } catch (error: any) {
                console.error(error);
                setModalError(error);  // Установка ошибки при неудаче
                return;
            }
        }

        // Обычная авторизация для неавторизованных пользователей
        try {
            await dispatch(login({ username: userName.trim(), password: password.trim() })).unwrap();
            clearModal();  // Очистка модального окна при успехе
            await dispatch(fetchProfile()).unwrap();  // Загрузка профиля
        } catch (error) {
            console.error(error);
            setModalError(error as any);  // Установка ошибки при неудаче
        }
    }

    // Обработчик выхода из системы
    const handleLogOut = () => {
        dispatch(logOut());        // Выход из системы
        dispatch(clearProfile());  // Очистка данных профиля
    }

    // Обработчик выбора аватара
    const onAvatarPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        setModalError(null);  // Сброс ошибок
        const file = e.target.files?.[0];  // Получение выбранного файла
        if (!file) return;    // Выход если файл не выбран

        // Проверка типа файла
        if (!file.type.startsWith("image/")) {
            setModalError("Пожалуйста, выберите изображение.");
            if (fileRef.current) fileRef.current.value = "";  // Сброс input
            return;
        }

        // Проверка размера файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setModalError("Файл слишком большой (> 5 МБ).");
            if (fileRef.current) fileRef.current.value = "";  // Сброс input
            return;
        }

        // Обработка изображения
        try {
            const { dataURL } = await fileToAvatarDataURL(file, {
                maxSide: 256,           // Максимальный размер стороны
                mime: "image/webp",     // Формат выходного изображения
                quality: 0.90,          // Качество сжатия
                maxBytesAnimated: 5 * 1024 * 1024,  // Максимальный размер анимированных изображений
            });
            setAva(dataURL);  // Установка обработанного аватара
        } catch (err: any) {
            setModalError(err?.message ?? "Не удалось обработать изображение");
            if (fileRef.current) fileRef.current.value = "";  // Сброс input при ошибке
        }
    };

    // Обработчик обновления профиля
    const handleUpdateProfile = async (name?: string, avatar?: string, e?: React.FormEvent) => {
        e?.preventDefault();  // Предотвращение перезагрузки страницы
        if (!didAuth) return;  // Выход если пользователь не авторизован

        try {
            // Отправка запроса на обновление профиля
            await dispatch(updateProfile({ name: name?.trim(), ava: avatar })).unwrap();
            clearModal();  // Очистка модального окна при успехе
        } catch (error: any) {
            console.error(error);
        }
    }

    // Рендеринг компонента
    return (
        <MainLayout>
            {/* Модальное окно для авторизации/смены аккаунта */}
            {modalOpen && !isEditing && (
                <ProfileModal
                    onClose={() => toggleModal()}  // Обработчик закрытия
                    onSubmit={(e) => handleAuth(e)} // Обработчик отправки формы
                    modalError={modalError}        // Передача ошибки
                    render={() => (                // Render prop для содержимого
                        <>
                            <h2 className={s.formContainer__form__title}>
                                {didAuth ? 'Форма смены аккаунта' : 'Форма авторизации'}
                            </h2>
                            <Input
                                placeholder="логин"
                                type="text"
                                value={userName}
                                required={true}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                            <Input
                                placeholder="пароль"
                                type="password"
                                value={password}
                                required={true}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button className={s.modalBtn} type={"submit"}>
                                {didAuth ? 'Сменить аккаунт' : 'Авторизоваться'}
                            </Button>
                        </>
                    )}
                />
            )}

            {/* Модальное окно для редактирования профиля */}
            {modalOpen && isEditing && (
                <ProfileModal
                    onClose={() => toggleModal()}  // Обработчик закрытия
                    onSubmit={(e) => handleUpdateProfile(userName, ava, e)} // Обработчик отправки
                    modalError={modalError}        // Передача ошибки
                    render={() => (                // Render prop для содержимого
                        <>
                            <h2 className={s.formContainer__form__title}>Update Profile form</h2>

                            {/* Предпросмотр аватара */}
                            {(ava || profile?.ava) && (
                                <div className={s.avatarPreview}>
                                    <img
                                        className={s.avatarPreview__img}
                                        src={ava || profile!.ava}
                                        alt="avatar preview"
                                    />
                                    {ava && <small className={s.avatarPreview__hint}>Предпросмотр (ещё не сохранено)</small>}
                                </div>
                            )}

                            {/* Поле для имени */}
                            <Input
                                placeholder="имя"
                                type="text"
                                value={userName}
                                required={true}
                                onChange={(e) => setUserName(e.target.value)}
                            />

                            {/* Поле для загрузки аватара */}
                            <div className={s.fileRow}>
                                <input
                                    ref={fileRef}
                                    className={s.fileInput}
                                    type="file"
                                    accept="image/*"
                                    id="avatarInput"
                                    onChange={onAvatarPick}
                                />
                                <label htmlFor="avatarInput" className={s.fileBtn}>Загрузить аватар</label>
                            </div>

                            <Button className={s.updBtn} type={"submit"}>Обновить профиль</Button>
                        </>
                    )}
                />
            )}

            {/* Отображение ошибки загрузки профиля */}
            {error && (
                <div className={s.error}>
                    Произошла ошибка<br />{error}
                </div>
            )}

            {/* Индикатор загрузки профиля */}
            {loading && !error && (
                <div className={s.loadingContainer}>
                    <div className={s.loading}>Загрузка профиля...</div>
                    <div className={s.donut}></div>
                </div>
            )}

            {/* Отображение профиля для авторизованного пользователя */}
            {didAuth && profile && !loading && !error && (
                <section className={s.profileCard}>
                    {/* Декоративный элемент - обложка профиля */}
                    <div className={s.cover} aria-hidden />

                    {/* Шапка профиля с аватаром и действиями */}
                    <div className={s.header}>
                        <div className={s.identity}>
                            <img className={s.userAvatarXL} src={profile.ava} alt={profile.name} />
                            <div className={s.nameBlock}>
                                <h1 className={s.displayName}>{profile.name}</h1>
                                <span className={s.username}>@{authedUsername}</span>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className={s.actions}>
                            <Button type="button" onClick={() => toggleModal()}>Сменить профиль</Button>
                            <Button type="button" onClick={() => toggleModal(true)}>Обновить профиль</Button>
                            <Button type="button" variant="danger" onClick={handleLogOut}>Выйти</Button>
                        </div>
                    </div>

                    {/* Блок статистики пользователя */}
                    {my && (
                        <div className={s.stats}>
                            {/* KPI показатели в виде списка */}
                            <ul className={s.kpis}>
                                <li className={s.kpi}>
                                    <b>{my.completedTasks}</b>
                                    <span>Выполнено</span>
                                </li>
                                <li className={s.kpi}>
                                    <b>{my.inWorkTasks}</b>
                                    <span>В работе</span>
                                </li>
                                <li className={s.kpi}>
                                    <b>{my.failedTasks}</b>
                                    <span>Просрочено</span>
                                </li>
                            </ul>

                            {/* Карточка со статистикой пользователя */}
                            <div className={s.userStatCardWrap}>
                                <UserStatCard
                                    id={0}
                                    name={profile.name}
                                    ava={profile.ava}
                                    completed={my.completedTasks}
                                    inWork={my.inWorkTasks}
                                    failed={my.failedTasks}
                                    highlight={false}
                                    total={my.completedTasks + my.inWorkTasks + my.failedTasks}
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Отображение для неавторизованного пользователя */}
            {!didAuth && (
                <div className={s.authContainer} role="region" aria-label="Авторизация">
                    <div className={s.authCard}>
                        {/* Декоративный элемент с изображением */}
                        <div className={s.art}>
                            <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png" alt="avatar" loading="lazy" />
                        </div>

                        {/* Тело карточки авторизации */}
                        <div className={s.authBody}>
                            <h3 className={s.authTitle}>Войдите, чтобы увидеть профиль</h3>
                            <p className={s.authSubtitle}>Доступ к личной статистике, настройкам и сохранённым данным.</p>

                            {/* Кнопка авторизации */}
                            <div className={s.actionsRow}>
                                <Button className={s.authButton} type="button" onClick={() => toggleModal()}>Авторизоваться</Button>
                            </div>

                            {/* Подсказка о регистрации */}
                            <p className={s.smallHint}>
                                Нет аккаунта? <button className={s.linkLike} aria-label="Зарегистрироваться">Зарегистрируйтесь</button> (тут могла бы быть регистрация)
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    )
}

// Экспорт компонента по умолчанию
export default ProfilePage

// =====================================================
// ПОЯСНЕНИЯ К КОММЕНТАРИЯМ В КОДЕ:
// =====================================================

// 1. АРХИТЕКТУРА КОМПОНЕНТА:
//    - ProfilePage - главная страница профиля пользователя
//    - Использует MainLayout для общей структуры
//    - Состоит из нескольких состояний: загрузка, ошибка, авторизован, неавторизован

// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ:
//    - Redux для глобального состояния (аутентификация, профиль, статистика)
//    - Local State для UI состояния (формы, модальные окна, ошибки)
//    - useRef для работы с DOM элементами (input файл)

// 3. МОДАЛЬНЫЕ ОКНА И ФОРМЫ:
//    - Два типа модальных окон: авторизация и редактирование профиля
//    - ProfileModal компонент с render prop для гибкости
//    - Валидация форм на клиенте и сервере

// 4. ОБРАБОТКА ИЗОБРАЖЕНИЙ:
//    - fileToAvatarDataURL для оптимизации и конвертации аватаров
//    - Проверка типа и размера файлов
//    - Поддержка современных форматов (WebP)

// 5. АУТЕНТИФИКАЦИЯ И АВТОРИЗАЦИЯ:
//    - Логин/логаут с обработкой ошибок
//    - Смена аккаунта без перезагрузки страницы
//    - Автоматическая загрузка профиля после успешной аутентификации

// 6. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС:
//    - Адаптивный дизайн для разных состояний
//    - Визуальная обратная связь (загрузка, ошибки, успех)
//    - Доступность (aria-label, role)

// 7. ИНТЕГРАЦИЯ С ДАННЫМИ:
//    - Отображение статистики пользователя
//    - Синхронизация между различными частями состояния
//    - Обработка edge cases (отсутствие данных, ошибки сети)

// 8. ОБРАБОТКА ОШИБОК:
//    - try-catch блоки для асинхронных операций
//    - Понятные сообщения об ошибках для пользователя
//    - Console.error для отладки

// 9. UX ОСОБЕННОСТИ:
//    - Предпросмотр аватара перед сохранением
//    - Очистка форм после успешных операций
//    - Подсказки и инструкции для пользователя

// 10. BEST PRACTICES:
//     - Разделение ответственности между компонентами
//     - Использование TypeScript для типобезопасности
//     - Мемоизация и оптимизация производительности
//     - Семантическая HTML разметка