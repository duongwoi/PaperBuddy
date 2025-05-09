"use strict";

// ===== USER AUTH & DATA SCOPING =====
const AUTH_KEY = 'paperBuddyLoggedInUser';

function getCurrentUsername() {
    return localStorage.getItem(AUTH_KEY);
}

function isUserLoggedIn() {
    return !!getCurrentUsername();
}

function loginUser(username) {
    if (!username) return false;
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return false;
    localStorage.setItem(AUTH_KEY, trimmedUsername);
    console.log(`User "${trimmedUsername}" logged in.`);
    return true;
}

function logoutUser() {
    const username = getCurrentUsername();
    if (username) {
        localStorage.removeItem(AUTH_KEY);
        console.log(`User "${username}" logged out.`);
    }
}

// --- LocalStorage Helpers ---
function getStorageItem(key, defaultValue = {}) {
    if (!key) return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading or parsing localStorage key “${key}”. Returning default.`, e);
        return defaultValue;
    }
}
function setStorageItem(key, value) {
    if (!key) {
        console.error("Error setting localStorage: Key is null or undefined.");
        return false;
    }
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Error setting localStorage key “${key}”. Error:`, e);
        displayUserMessage(`Error saving preferences (${key}). LocalStorage might be full.`, 'error');
        return false;
    }
}

function getUserStorageKey(baseKey) {
    const username = getCurrentUsername();
    if (!username) return null;
    return `${baseKey}_user_${username}`;
}

function getUserData(baseKey, defaultValue = {}) {
    const userKey = getUserStorageKey(baseKey);
    if (!userKey) return defaultValue;
    return getStorageItem(userKey, defaultValue);
}

function setUserData(baseKey, value) {
    const userKey = getUserStorageKey(baseKey);
    if (!userKey) {
        console.error(`Error saving user data (${baseKey}): User not logged in.`);
        return false;
    }
    return setStorageItem(userKey, value);
}

// Constants for Base Storage Keys
const BASE_STORAGE_KEYS = {
    USER_SUBJECTS: 'paperBuddyUserSubjects',
    // PAPER_STATUSES and ATTEMPT_DURATIONS are now primarily managed by the backend.
    // We will use a local mock for PAPER_STATUSES for UI testing on papers.html initially.
    PAPER_STATUSES_MOCK: 'paperBuddyPaperStatusesMock' // For local UI testing
};

// ===== UTILITY FUNCTIONS =====
const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = Math.floor(totalSeconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

function getPaperInfoFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');
    const paperId = urlParams.get('paperId');
    const validAttemptId = attemptId && typeof attemptId === 'string' && attemptId.trim() !== '';
    const validPaperId = paperId && typeof paperId === 'string' && paperId.trim() !== '' && paperId !== 'unknown' && paperId !== 'unknown-paper';
    return { attemptId: validAttemptId ? attemptId : null, paperId: validPaperId ? paperId : null, validAttemptId, validPaperId };
}

function formatPaperCode(paperId) {
    if (!paperId || typeof paperId !== 'string') return "Unknown Paper";
    const parts = paperId.split('-');
    if (parts.length >= 5) {
        const subjectCode = parts[1] || '????';
        const paperNum = parts[2] || '?';
        const session = (parts[3] || '??').toUpperCase();
        const yearYY = parts[4] ? String(parts[4]).slice(-2) : '??';
        return `${subjectCode}/${paperNum}/${session}/${yearYY}`;
    }
    return paperId;
}

function displayUserMessage(message, type = 'info', duration = 5000) {
    const toast = document.getElementById('user-message-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast'; // Reset classes
        toast.classList.add(`toast--${type}`, 'toast--visible');
        // Clear existing timer if any
        if (toast.timerId) clearTimeout(toast.timerId);
        toast.timerId = setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, duration);
    } else {
        const logMethod = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
        logMethod(`User Message (${type.toUpperCase()}): ${message}`);
    }
}

// ===== GLOBAL DATA SOURCE (For paper listing UI) =====
const ALL_PAPER_DATA_SOURCE = [
    { id: 'econ-9708-11-mj-25', subjectId: 'economics-9708', subjectCode: '9708', subjectName: 'Economics', paperNumber: '1', variant: '1', sessionCode: 'MJ', year: 2025, sessionLabel: 'May/June'},
    { id: 'biz-9609-21-fm-25', subjectId: 'business-9609', subjectCode: '9609', subjectName: 'Business', paperNumber: '2', variant: '1', sessionCode: 'FM', year: 2025, sessionLabel: 'Feb/March'},
    { id: 'econ-9708-32-on-25', subjectId: 'economics-9708', subjectCode: '9708', subjectName: 'Economics', paperNumber: '3', variant: '2', sessionCode: 'ON', year: 2025, sessionLabel: 'Oct/Nov'},
    { id: 'biz-9609-41-mj-25', subjectId: 'business-9609', subjectCode: '9609', subjectName: 'Business', paperNumber: '4', variant: '1', sessionCode: 'MJ', year: 2025, sessionLabel: 'May/June'},
    { id: 'econ-9708-12-on-24', subjectId: 'economics-9708', subjectCode: '9708', subjectName: 'Economics', paperNumber: '1', variant: '2', sessionCode: 'ON', year: 2024, sessionLabel: 'Oct/Nov'},
    { id: 'biz-9609-22-mj-24', subjectId: 'business-9609', subjectCode: '9609', subjectName: 'Business', paperNumber: '2', variant: '2', sessionCode: 'MJ', year: 2024, sessionLabel: 'May/June'},
    { id: 'econ-9708-31-fm-24', subjectId: 'economics-9708', subjectCode: '9708', subjectName: 'Economics', paperNumber: '3', variant: '1', sessionCode: 'FM', year: 2024, sessionLabel: 'Feb/March'},
    { id: 'biz-9609-42-on-24', subjectId: 'business-9609', subjectCode: '9609', subjectName: 'Business', paperNumber: '4', variant: '2', sessionCode: 'ON', year: 2024, sessionLabel: 'Oct/Nov'},
    { id: 'econ-9708-13-mj-23', subjectId: 'economics-9708', subjectCode: '9708', subjectName: 'Economics', paperNumber: '1', variant: '3', sessionCode: 'MJ', year: 2023, sessionLabel: 'May/June'},
    { id: 'biz-9609-23-on-23', subjectId: 'business-9609', subjectCode: '9609', subjectName: 'Business', paperNumber: '2', variant: '3', sessionCode: 'ON', year: 2023, sessionLabel: 'Oct/Nov'},
];

// ===== FIREBASE CLIENT SDK CONFIG & INITIALIZATION =====
// !!!!!!!!!! ĐIỀN THÔNG TIN FIREBASE CONFIG CỦA BẠN VÀO ĐÂY !!!!!!!!!!
const firebaseConfig = {
    apiKey: "AIzaSyB-QDhHwsVJ9dnFzQ5-2eLRaklzMdz3Q0A",
    authDomain: "paperbuddy-643ba.firebaseapp.com",
    projectId: "paperbuddy-643ba",
    storageBucket: "paperbuddy-643ba.appspot.com",
    messagingSenderId: "692036778045",
    appId: "1:692036778045:web:a328d34509fc2b567d8474"
};
// !!!!!!!!!! KẾT THÚC PHẦN CẦN ĐIỀN THÔNG TIN FIREBASE !!!!!!!!!!

let firebaseApp;
let storageClient;

function initializeFirebaseClient() {
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK not loaded. Ensure Firebase scripts are in your HTML before script.js.");
        displayUserMessage("File service unavailable. Please refresh.", "error");
        return false;
    }
    if (!firebaseApp) {
        try {
            if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
                console.error("Firebase config is not correctly set up in script.js. Please fill in your Firebase project details.");
                displayUserMessage("Application configuration error. File upload may not work.", "error");
                return false;
            }
            firebaseApp = firebase.initializeApp(firebaseConfig);
            storageClient = firebase.storage();
            console.log("Firebase client initialized.");
            return true;
        } catch (e) {
            console.error("Error initializing Firebase client:", e);
            displayUserMessage("Error connecting to file service. Upload might not work.", "error");
            return false;
        }
    }
    return true;
}

// --- Firebase File Upload Helper ---
async function uploadFileToFirebase(file, userId, paperId) {
    if (!initializeFirebaseClient() || !storageClient || !file || !userId || !paperId) {
        console.error("Firebase Storage not initialized or missing parameters for upload.");
        displayUserMessage("File upload service not ready. Please try again.", "error");
        return null;
    }
    const timestamp = Date.now();
    const sanitizedPaperId = paperId.replace(/[^a-zA-Z0-9-]/g, '_');
    const filePath = `user_uploads/${userId}/${sanitizedPaperId}/${timestamp}_${file.name}`;
    const fileRef = storageClient.ref(filePath);
    try {
        displayUserMessage(`Uploading ${file.name}... This may take a moment.`, 'info', 15000); // Longer duration
        const uploadTaskSnapshot = await fileRef.put(file);
        const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL();
        console.log('File uploaded successfully. URL:', downloadURL);
        displayUserMessage(`${file.name} uploaded successfully!`, 'success');
        return { url: downloadURL, path: filePath, name: file.name, type: file.type, size: file.size };
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        let errorMsg = `Error uploading ${file.name}.`;
        if (error.code) {
            switch (error.code) {
                case 'storage/unauthorized': errorMsg += ' Permission denied.'; break;
                case 'storage/canceled': errorMsg += ' Upload canceled.'; break;
                case 'storage/object-not-found': errorMsg += ' File path error.'; break;
                case 'storage/quota-exceeded': errorMsg += ' Storage quota exceeded.'; break;
                default: errorMsg += ` (Code: ${error.code})`;
            }
        } else { errorMsg += ` ${error.message}`; }
        displayUserMessage(errorMsg, 'error');
        return null;
    }
}

// --- API Call Helper ---
async function callBackendAPI(action, method = 'POST', payload = {}) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        options.body = JSON.stringify({ action, payload });
    }

    const url = method === 'GET'
        ? `/.netlify/functions/backend?action=${action}&${new URLSearchParams(payload)}`
        : '/.netlify/functions/backend';

    try {
        const response = await fetch(url, options);
        const data = await response.json(); // Always try to parse JSON
        if (!response.ok) {
            console.error(`API call for action '${action}' failed with status ${response.status}:`, data.error || data.message, data.details);
            throw new Error(data.error || data.message || `Server error: ${response.status}`);
        }
        return data; // Contains { success: true, ... } or other data from backend
    } catch (error) {
        console.error(`Network or parsing error for action '${action}':`, error);
        throw error; // Re-throw to be caught by calling function
    }
}

// --- Hàm lấy chi tiết Attempt từ Backend ---
async function fetchAttemptDetails(attemptId, userId, paperIdForLog) {
    if (!attemptId || !userId) {
        console.error("Missing attemptId or userId to fetch details.");
        displayUserMessage("Cannot load details: Missing identifiers.", "error");
        return null;
    }
    try {
        const data = await callBackendAPI('get_attempt_details', 'GET', { attemptId, userId, paperId: paperIdForLog || '' });
        return data; // Backend trả về toàn bộ attempt data nếu thành công
    } catch (error) {
        displayUserMessage(`Error loading attempt details: ${error.message}`, "error");
        return null;
    }
}


// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("PaperBuddy Script Loaded");
    initializeFirebaseClient(); // Khởi tạo Firebase Client

    setupHeaderScroll();
    updateHeaderUI();
    setupLoginModal();
    setupLoginRequiredChecks();

    const pathname = window.location.pathname.split('/').pop() || 'index.html';
    if (pathname !== 'index.html' && !isUserLoggedIn()) {
        if (['attempt.html', 'test.html', 'result.html', 'dashboard.html', 'papers.html'].includes(pathname)) {
            alert(`Please log in to access the ${pathname.split('.')[0]} page.`);
        }
        window.location.href = 'index.html';
        return;
    }

    switch (pathname) {
        case 'index.html': break;
        case 'dashboard.html': setupDashboardPage(); break;
        case 'papers.html': setupPapersPage_Dynamic(); break;
        case 'attempt.html': setupAttemptContentViewer(); break;
        case 'test.html': setupTestPage(); break;
        case 'result.html': setupResultPage(); break;
        default: console.warn(`No specific setup found for page: ${pathname}`);
    }
});

// ===== GENERAL FUNCTIONS (Header Scroll, Modals - giữ nguyên từ file gốc) =====
function setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('header--scrolled', window.scrollY >= 50);
    }, { passive: true });
    header.classList.toggle('header--scrolled', window.scrollY >= 50);
}

function trapFocus(event, modalElement) {
    if (!modalElement || !modalElement.classList.contains('is-visible') || event.key !== 'Tab') return;
    const focusable = Array.from(modalElement.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
    if (!focusable.length) { event.preventDefault(); return; }
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];
    if (event.shiftKey) { if (document.activeElement === firstEl) { lastEl.focus(); event.preventDefault(); } }
    else { if (document.activeElement === lastEl) { firstEl.focus(); event.preventDefault(); } }
}

function openModal(modalElement, focusElement) {
    if (!modalElement) return null;
    const prevFocused = document.activeElement;
    modalElement.hidden = false;
    requestAnimationFrame(() => { // Cho phép CSS transition
        modalElement.classList.add('is-visible');
        modalElement.setAttribute('aria-hidden', 'false');
        const elToFocus = focusElement && modalElement.contains(focusElement) && !focusElement.disabled
            ? focusElement
            : (modalElement.querySelector('input:not([disabled]), button:not([disabled])') || modalElement);
        elToFocus?.focus();
        modalElement._trapFocusListener = (e) => trapFocus(e, modalElement);
        document.addEventListener('keydown', modalElement._trapFocusListener);
    });
    return prevFocused;
}

function closeModal(modalElement, previouslyFocusedElement) {
    if (!modalElement || !modalElement.classList.contains('is-visible')) return;
    modalElement.classList.remove('is-visible');
    modalElement.setAttribute('aria-hidden', 'true');
    if (modalElement._trapFocusListener) {
        document.removeEventListener('keydown', modalElement._trapFocusListener);
        delete modalElement._trapFocusListener;
    }
    const transitionHandler = () => {
        modalElement.hidden = true;
        if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function' && document.body.contains(previouslyFocusedElement)) {
            if (window.getComputedStyle(previouslyFocusedElement).display !== 'none' && !previouslyFocusedElement.disabled) {
                previouslyFocusedElement.focus({ preventScroll: true });
            }
        }
        modalElement.removeEventListener('transitionend', transitionHandler);
    };
    modalElement.addEventListener('transitionend', transitionHandler);
    // Fallback nếu transitionend không được kích hoạt
    setTimeout(() => { if (!modalElement.hidden && modalElement.getAttribute('aria-hidden') === 'true') transitionHandler(); }, 350); // CSS transition duration + small buffer
}


// ===== LOGIN / AUTH FUNCTIONS (giữ nguyên từ file gốc) =====
function updateHeaderUI() {
    const loggedIn = isUserLoggedIn();
    const username = getCurrentUsername();
    const loginBtn = document.getElementById('login-trigger-btn');
    const joinBtn = document.getElementById('join-trigger-btn');
    const userInfoDiv = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('nav-username-display');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : 'inline-block'; // Hoặc giá trị display mặc định
    if (joinBtn) joinBtn.style.display = loggedIn ? 'none' : 'inline-block';
    if (userInfoDiv) userInfoDiv.style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn && usernameDisplay) usernameDisplay.textContent = username;

    if (logoutBtn) { // Gắn lại event listener để tránh bị chồng chéo
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        if (loggedIn) {
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); logoutUser(); updateHeaderUI(); window.location.href = 'index.html';
            });
        }
    }
}

function setupLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    document.querySelectorAll('[data-open-modal="login-modal"]').forEach(trigger => {
        trigger.addEventListener('click', (event) => triggerLoginModal(event, trigger));
    });
    const closeModalElements = loginModal.querySelectorAll('[data-close-modal], .modal__close-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const errorMessage = document.getElementById('login-error-message');

    if (!loginForm || !usernameInput || !errorMessage) { console.error("Login modal inner elements missing."); return; }

    const closeTheLoginModal = () => { // Đổi tên để tránh xung đột
        const focusRestore = loginModal._focusRestoreElement;
        closeModal(loginModal, focusRestore);
        delete loginModal._focusRestoreElement;
    };
    closeModalElements.forEach(el => el.addEventListener('click', closeTheLoginModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && loginModal.classList.contains('is-visible')) closeTheLoginModal(); });
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); errorMessage.hidden = true;
        const usernameVal = usernameInput.value.trim();
        if (!usernameVal) { errorMessage.textContent = "Username is required."; errorMessage.hidden = false; usernameInput.focus(); return; }
        if (loginUser(usernameVal)) { closeTheLoginModal(); updateHeaderUI(); setTimeout(() => window.location.reload(), 50); }
        else { errorMessage.textContent = "Login failed (mock). Enter any username."; errorMessage.hidden = false; }
    });
}

function triggerLoginModal(event, triggerElement) {
    if (event) event.preventDefault();
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('login-username');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');
    if (!loginModal || !usernameInput || !loginForm || !errorMessage) { displayUserMessage("Login component error.", "error"); return; }
    loginForm.reset(); errorMessage.hidden = true;
    const focusTarget = triggerElement || event?.currentTarget || document.body;
    loginModal._focusRestoreElement = openModal(loginModal, usernameInput) || focusTarget;
}

function setupLoginRequiredChecks() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    const selectors = [
        '.nav__list a[href="dashboard.html"]', '.nav__list a[href="papers.html"]',
        '.hero__search-button', '.hero__search-form', '.subjects__item', '.cta__container a.button'
    ];
    document.querySelectorAll(selectors.join(', ')).forEach(element => {
        const handler = (event) => {
            if (!isUserLoggedIn()) {
                const trigger = (element.tagName === 'FORM') ? (element.querySelector('button[type="submit"]') || element.querySelector('input[type="submit"]')) : event.currentTarget;
                triggerLoginModal(event, trigger || element);
            }
        };
        if (element.tagName === 'FORM') element.addEventListener('submit', handler);
        else if (element.tagName === 'A' || element.tagName === 'BUTTON') element.addEventListener('click', handler);
    });
}

// ===== DASHBOARD PAGE LOGIC (Sử dụng localStorage cho User Subjects) =====
function setupDashboardPage() {
    console.log("Setting up Dashboard Page...");
    const username = getCurrentUsername();
    const modal = document.getElementById('subject-modal');
    const openModalBtn = document.getElementById('edit-subjects-btn');
    const closeModalElements = modal?.querySelectorAll('[data-close-modal], .modal__close-btn');
    const subjectForm = document.getElementById('subject-selection-form');
    const subjectsListWrapper = document.getElementById('subjects-list-wrapper');
    const noSubjectsMessage = document.getElementById('no-subjects-message');
    const welcomeTitle = document.querySelector('.welcome__title');

    if (!modal || !openModalBtn || !closeModalElements || !subjectForm || !subjectsListWrapper || !noSubjectsMessage || !welcomeTitle) {
        console.warn("Dashboard page missing essential elements."); return;
    }
    if (welcomeTitle && username) welcomeTitle.textContent = `Hi, ${username}`;
    let previouslyFocusedElementDash = null;
    let currentUserSubjects = getUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, []);

    function calculateSubjectStats(subjectId) { // Mock data for UI testing
        // TODO: Sau này sẽ fetch stats từ backend dựa trên attempts của user
        return { progress: Math.floor(Math.random() * 80) + 20, grade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] };
    }
    const createSubjectRow = (subjectData) => {
        if (!subjectData?.id) return null;
        const stats = calculateSubjectStats(subjectData.id);
        const subjectLabel = subjectData.label || subjectData.id;
        const article = document.createElement('article'); article.className = 'subjects-list__item'; article.role = 'row'; article.dataset.subjectId = subjectData.id;
        const subjectCell = document.createElement('div'); subjectCell.className = 'subjects-list__cell'; subjectCell.dataset.label = 'Subject'; subjectCell.textContent = subjectLabel;
        const papersCell = document.createElement('div'); papersCell.className = 'subjects-list__cell'; papersCell.dataset.label = 'Past Papers';
        const progressBar = document.createElement('div'); progressBar.className = 'progress-bar'; progressBar.setAttribute('aria-label', `Progress for ${subjectLabel}`);
        const progressBarInner = document.createElement('div'); progressBarInner.className = 'progress-bar__inner'; progressBarInner.style.width = `${stats.progress}%`; progressBarInner.role = 'progressbar'; progressBarInner.ariaValueNow = stats.progress; progressBarInner.ariaValueMin = '0'; progressBarInner.ariaValueMax = '100'; progressBar.appendChild(progressBarInner); papersCell.appendChild(progressBar);
        const gradeCell = document.createElement('div'); gradeCell.className = 'subjects-list__cell'; gradeCell.dataset.label = 'Predicted grade'; gradeCell.textContent = stats.grade;
        const actionCell = document.createElement('div'); actionCell.className = 'subjects-list__cell subjects-list__cell--action';
        const link = document.createElement('a'); link.href = `papers.html?subject=${subjectData.id}`; link.className = 'subjects-list__link'; link.setAttribute('aria-label', `View ${subjectLabel} papers`); link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`; actionCell.appendChild(link); article.append(subjectCell, papersCell, gradeCell, actionCell); return article;
    };
    const renderSubjectsList = (subjectsData) => {
        if (!subjectsListWrapper || !noSubjectsMessage || !subjectForm) return;
        subjectsListWrapper.querySelectorAll('.subjects-list__item').forEach(item => item.remove()); // Xóa các item cũ
        const validSubjectsData = Array.isArray(subjectsData) ? subjectsData : [];
        noSubjectsMessage.hidden = validSubjectsData.length > 0;
        if (validSubjectsData.length > 0) {
            validSubjectsData.forEach(subject => { const row = createSubjectRow(subject); if (row) subjectsListWrapper.appendChild(row); });
        }
        subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = validSubjectsData.some(s => s.id === cb.value);
        });
    };
    const openSubjectModal = () => {
        const validSubjectsData = Array.isArray(currentUserSubjects) ? currentUserSubjects : [];
        subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = validSubjectsData.some(s => s.id === cb.value);
        });
        const focusTarget = subjectForm.querySelector('input[type="checkbox"]:not([disabled])') || subjectForm.querySelector('button[type="submit"]');
        previouslyFocusedElementDash = openModal(modal, focusTarget);
    };
    const closeSubjectModal = () => closeModal(modal, previouslyFocusedElementDash);
    if(openModalBtn) openModalBtn.addEventListener('click', openSubjectModal);
    closeModalElements.forEach(el => el.addEventListener('click', closeSubjectModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('is-visible')) closeSubjectModal(); });
    if(subjectForm) subjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const checked = Array.from(subjectForm.querySelectorAll('input[name="subjects"]:checked'));
        const newData = checked.map(cb => ({ id: cb.value, label: cb.dataset.label || cb.value }));
        currentUserSubjects = newData;
        if (setUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, currentUserSubjects)) {
            renderSubjectsList(currentUserSubjects);
            displayUserMessage("Subjects saved successfully!", "success");
        }
        closeSubjectModal();
    });
    renderSubjectsList(currentUserSubjects); // Initial render
}

// ===== PAPERS PAGE LOGIC (Sử dụng mock paperStatuses để test UI) =====
function setupPapersPage_Dynamic() {
    console.log("Setting up Papers Page...");
    const papersListContainer = document.getElementById('papers-list-container');
    const noPapersMessage = document.getElementById('no-papers-message');
    const filterForm = document.getElementById('paper-filter-form');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const mainTitle = document.getElementById('papers-main-title');

    if (!papersListContainer || !noPapersMessage || !filterForm || !applyFiltersBtn || !mainTitle) {
        console.warn("Papers page elements missing."); return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const subjectFilterFromUrl = urlParams.get('subject');
    let paperStatuses = {}; // Sẽ được điền bởi mock data hoặc fetch từ backend

    // Sử dụng mock paperStatuses để test UI
    function getMockPaperStatuses() {
        const username = getCurrentUsername();
        if (!username) return {}; // Chỉ mock nếu user đã login để linkAttemptId có ý nghĩa
        const mockData = getUserData(BASE_STORAGE_KEYS.PAPER_STATUSES_MOCK, {}); // Thử lấy từ localStorage trước
        if (Object.keys(mockData).length > 0) return mockData;

        // Nếu không có trong localStorage, tạo mock mới
        console.log("Applying MOCK paper statuses for Papers Page UI testing.");
        const statuses = {
            'econ-9708-11-mj-25': { status: 'done', linkAttemptId: `${username}_econ-9708-11-mj-25_mock1` },
            'biz-9609-21-fm-25': { status: 'not_done', linkAttemptId: null },
            'econ-9708-32-on-25': { status: 'done', linkAttemptId: `${username}_econ-9708-32-on-25_mock2` }
        };
        setUserData(BASE_STORAGE_KEYS.PAPER_STATUSES_MOCK, statuses); // Lưu mock vào localStorage để test
        return statuses;
    }

    function createPaperCard(paper) { /* (giữ nguyên từ file gốc) */
        if (!paper?.id) return null;
        const link = document.createElement('a');
        const statusInfo = paperStatuses[paper.id] || { status: 'not_done', linkAttemptId: null };
        link.className = `paper-card ${statusInfo.status === 'done' ? 'paper-card--done' : 'paper-card--not-done'}`;
        link.dataset.paperId = paper.id; link.dataset.subject = paper.subjectId || 'unknown'; link.dataset.year = paper.year || 'unknown'; link.dataset.paperNumber = paper.paperNumber || 'unknown'; link.dataset.status = statusInfo.status;
        if (statusInfo.status === 'done' && statusInfo.linkAttemptId) {
            link.href = `attempt.html?attemptId=${encodeURIComponent(statusInfo.linkAttemptId)}&paperId=${encodeURIComponent(paper.id)}`;
        } else {
            link.href = `test.html?paperId=${encodeURIComponent(paper.id)}`;
        }
        const displayCode = formatPaperCode(paper.id);
        link.innerHTML = `<span class="paper-card__name">${displayCode}</span> <span class="paper-card__status">${statusInfo.status === 'done' ? 'Done' : 'Not Done'}</span>`;
        return link;
    }
    function renderPapers(papersToRender) { /* (giữ nguyên từ file gốc) */
        if(!papersListContainer || !noPapersMessage) return;
        papersListContainer.innerHTML = ''; papersListContainer.appendChild(noPapersMessage);
        noPapersMessage.hidden = true;
        if (!Array.isArray(papersToRender) || papersToRender.length === 0) { noPapersMessage.textContent = "No past papers found matching your filters."; noPapersMessage.hidden = false; return;}
        const papersByYear = papersToRender.reduce((acc, p) => { const year = p.year || 'Unknown'; if (!acc[year]) acc[year] = []; acc[year].push(p); return acc; }, {});
        const sortedYears = Object.keys(papersByYear).sort((a, b) => parseInt(b) - parseInt(a));
        let papersFound = false;
        sortedYears.forEach(year => {
            const yearGroup = document.createElement('section'); yearGroup.className = 'papers-year-group';
            const yearH3 = document.createElement('h3'); yearH3.className = 'year-group__title'; yearH3.textContent = year;
            const gridDiv = document.createElement('div'); gridDiv.className = 'papers-grid';
            papersByYear[year].sort((a,b) => (a.paperNumber+a.variant).localeCompare(b.paperNumber+b.variant)).forEach(p => { const card = createPaperCard(p); if(card){gridDiv.appendChild(card); papersFound=true;}});
            if(gridDiv.hasChildNodes()){ yearGroup.appendChild(yearH3); yearGroup.appendChild(gridDiv); papersListContainer.appendChild(yearGroup);}
        });
        noPapersMessage.hidden = papersFound;
        if (!papersFound) noPapersMessage.textContent = "No past papers found for your filters.";
    }
    function applyFiltersAndRender() { /* (giữ nguyên từ file gốc) */
         if (!filterForm || typeof ALL_PAPER_DATA_SOURCE === 'undefined') return;
         const formData = new FormData(filterForm); const statusFilter = formData.get('status'); const yearFilter = formData.get('year'); const paperFilter = formData.get('paper');
         let filteredData = ALL_PAPER_DATA_SOURCE.filter(paper => {
             if (subjectFilterFromUrl && paper.subjectId !== subjectFilterFromUrl) return false;
             if (statusFilter) { const currentStatus = paperStatuses[paper.id]?.status || 'not_done'; if (currentStatus !== statusFilter) return false; }
             if (yearFilter && paper.year && paper.year.toString() !== yearFilter) return false;
             if (paperFilter && paper.paperNumber && paper.paperNumber.toString() !== paperFilter) return false;
             return true;
         });
         renderPapers(filteredData);
    }
    if (mainTitle) { // Cập nhật tiêu đề chính
        if (subjectFilterFromUrl) {
            const subjectInfo = ALL_PAPER_DATA_SOURCE.find(p => p.subjectId === subjectFilterFromUrl);
            mainTitle.textContent = subjectInfo ? `${subjectInfo.subjectName} (${subjectInfo.subjectCode}) Papers` : `Papers`;
        } else { mainTitle.textContent = `All Past Papers`; }
    }
    if(applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFiltersAndRender);

    paperStatuses = getMockPaperStatuses(); // Lấy mock statuses
    applyFiltersAndRender(); // Render lần đầu
    // TODO: Sau này, thay getMockPaperStatuses() bằng hàm fetch từ backend.
}

// ===== ATTEMPT PAGE LOGIC (Gọi API backend) =====
async function setupAttemptContentViewer() {
    // ... (Giữ nguyên logic hàm này như đã cung cấp ở phản hồi trước, sử dụng fetchAttemptDetails)
    console.log("Setting up Attempt Page Content Viewer...");
    const viewer = document.getElementById('paper-viewer-content');
    const paperV = document.getElementById('past-paper-view');
    const uploadedFileLinkContainer = document.getElementById('uploaded-file-link-container');
    const uploadedFileLink = document.getElementById('uploaded-file-link');
    const feedV = document.getElementById('feedback-view');
    const outV = document.getElementById('outline-view');
    const paperB = document.getElementById('view-paper-btn');
    const feedB = document.getElementById('view-feedback-btn');
    const outB = document.getElementById('view-outline-btn');
    const retakeButton = document.querySelector('.retake-button');
    const paperCodeHeading = document.getElementById('paper-code');
    const gradeValueElement = document.getElementById('attempt-grade');
    const durationValueElement = document.getElementById('attempt-duration');
    const rawScoreValueElement = document.getElementById('attempt-raw-score');
    const retakeModal = document.getElementById('confirm-retake-modal');
    const confirmRetakeBtn = document.getElementById('confirm-retake-action-btn');
    const retakeModalCloseElements = retakeModal?.querySelectorAll('[data-close-modal], .modal__close-btn');

    if (!paperCodeHeading || !retakeButton) { console.warn("Attempt page core elements missing."); if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading"; return; }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();
    let retakeLink = `test.html?paperId=unknown-paper`; // Default retake link

    if (paperIdFromUrl) { // Ưu tiên paperId từ URL cho hiển thị ban đầu và retake link
        paperCodeHeading.textContent = formatPaperCode(paperIdFromUrl);
        document.title = `${formatPaperCode(paperIdFromUrl)} - Attempt - PaperBuddy`;
        retakeLink = `test.html?paperId=${encodeURIComponent(paperIdFromUrl)}`;
    } else if (validAttemptId) { // Nếu chỉ có attemptId, hiển thị nó
        paperCodeHeading.textContent = `Attempt: ${attemptId.substring(0,20)}...`;
        document.title = `Attempt Details - PaperBuddy`;
    } else {
        paperCodeHeading.textContent = "Invalid Attempt Link";
    }
    if (retakeButton) retakeButton.href = retakeLink;


    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading attempt details...", "info");
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl);
        if (attemptData) {
            const finalPaperId = attemptData.paperId || paperIdFromUrl; // Dùng paperId từ data nếu có
            if (paperCodeHeading) paperCodeHeading.textContent = formatPaperCode(finalPaperId);
            document.title = `${formatPaperCode(finalPaperId)} - Attempt - PaperBuddy`;
            if (retakeButton) retakeButton.href = `test.html?paperId=${encodeURIComponent(finalPaperId || 'unknown-paper')}`;

            if (gradeValueElement) gradeValueElement.textContent = attemptData.grade || 'N/A';
            if (durationValueElement) durationValueElement.textContent = formatTime(attemptData.timeSpent || 0);
            if (rawScoreValueElement) rawScoreValueElement.textContent = `${attemptData.score || 0} / 60`;
            if (feedV) feedV.innerHTML = `<p style="padding: 1rem;"><strong>Feedback from AI:</strong></p><p style="padding: 0 1rem 1rem 1rem;">${attemptData.feedback?.replace(/\n/g, '<br>') || 'No feedback available.'}</p>`;
            if (outV) outV.innerHTML = `<p style="padding: 1rem;"><strong>Suggested Outline by AI:</strong></p><pre style="padding: 0 1rem 1rem 1rem; white-space: pre-wrap;">${attemptData.outline || 'No outline available.'}</pre>`;
            if (uploadedFileLinkContainer && uploadedFileLink && attemptData.fileUrl) {
                uploadedFileLink.href = attemptData.fileUrl;
                uploadedFileLink.textContent = `View Submitted File: ${attemptData.fileName || 'File'}`;
                uploadedFileLinkContainer.style.display = 'block';
            } else if (uploadedFileLinkContainer) {
                uploadedFileLinkContainer.style.display = 'none';
            }
        } else {
            if(paperCodeHeading) paperCodeHeading.textContent = "Could not load details for this attempt.";
            displayUserMessage("Failed to load attempt. It may have been deleted or an error occurred.", "error");
            if(retakeButton) retakeButton.style.display = 'none'; // Ẩn nút retake nếu không load được
        }
    } else {
        if (!validAttemptId && paperCodeHeading) paperCodeHeading.textContent = "Invalid Attempt ID";
        if (!currentUserId && paperCodeHeading) paperCodeHeading.textContent = "Please Log In";
        if (!validAttemptId) displayUserMessage("Attempt ID is missing or invalid in URL.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in to view attempts.", "error");
        if(retakeButton) retakeButton.style.display = 'none';
    }
    if (paperV && feedV && outV && paperB && feedB && outB) { // View switching
        const views = [paperV, feedV, outV]; const buttons = [paperB, feedB, outB];
        const showView = (v) => { views.forEach(el => el.hidden = (el !== v)); if(viewer) viewer.scrollTop = 0; };
        const setActive = (b) => buttons.forEach(el => el.setAttribute('aria-current', el === b ? 'page' : 'false'));
        buttons.forEach((btn, i) => btn.addEventListener('click', (e) => { e.preventDefault(); showView(views[i]); setActive(btn); }));
        showView(paperV); setActive(paperB);
    }
    if (retakeModal && confirmRetakeBtn && retakeModalCloseElements && retakeButton) { // Retake modal
        let prevFocRetake = null, targetUrlRetake = '';
        const openRet = () => { prevFocRetake = document.activeElement; openModal(retakeModal, confirmRetakeBtn); };
        const closeRet = () => closeModal(retakeModal, prevFocRetake);
        retakeButton.addEventListener('click', (e) => { e.preventDefault(); targetUrlRetake = retakeButton.href; if (targetUrlRetake && !targetUrlRetake.includes('unknown')) openRet(); else displayUserMessage("Retake error: Paper ID unknown.", "error");});
        confirmRetakeBtn.addEventListener('click', () => { closeRet(); setTimeout(() => { if(targetUrlRetake && !targetUrlRetake.includes('unknown')) window.location.href = targetUrlRetake; else displayUserMessage("Retake error.", "error");}, 100);});
        retakeModalCloseElements.forEach(el => el.addEventListener('click', closeRet));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && retakeModal?.classList.contains('is-visible')) closeRet(); });
    }
}

// ===== TEST PAGE LOGIC (Đã cập nhật để gọi API backend) =====
async function setupTestPage() {
    // ... (Giữ nguyên logic hàm này như đã cung cấp ở phản hồi trước,
    //      bao gồm cả việc gọi uploadFileToFirebase và API submit_attempt,
    //      và đảm bảo stopTimer() được gọi đúng lúc.)
    console.log("Setting up Test Page...");
    const timerDisplay = document.getElementById('timer-display');
    const timerButton = document.getElementById('timer-button');
    const confirmModal = document.getElementById('confirm-submit-modal');
    const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
    const modalCloseElements = confirmModal?.querySelectorAll('[data-close-modal], .modal__close-btn');
    const paperCodeHeading = document.getElementById('paper-code-heading');
    const answerTextarea = document.getElementById('answer-textarea');
    const fileUploadInput = document.getElementById('file-upload-input');
    const fileUploadFilename = document.getElementById('file-upload-filename');

    if (!timerDisplay || !timerButton || !confirmModal || !confirmSubmitBtn || !paperCodeHeading || !answerTextarea || !fileUploadInput || !fileUploadFilename) {
        console.warn("Test page elements missing."); if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading Test"; return;
    }
    const { paperId, validPaperId } = getPaperInfoFromUrl();
    if (!validPaperId) {
        if (paperCodeHeading) paperCodeHeading.textContent = "Invalid Paper ID"; document.title = `Invalid Test`;
        if (timerButton) { timerButton.disabled = true; timerButton.textContent = "Invalid Paper"; }
        displayUserMessage("Paper ID is missing or invalid.", "error"); return;
    }
    if (paperCodeHeading) paperCodeHeading.textContent = formatPaperCode(paperId);
    document.title = `${formatPaperCode(paperId)} - Test - PaperBuddy`;
    let timerInterval = null, secondsElapsed = 0, isTimerRunning = false, prevFocusTestModal = null;
    const updateTimerDisplay = () => { if (timerDisplay) timerDisplay.textContent = formatTime(secondsElapsed); };
    const startTheTimer = () => {
        if (isTimerRunning) return; isTimerRunning = true; secondsElapsed = 0; updateTimerDisplay();
        timerInterval = setInterval(() => { secondsElapsed++; updateTimerDisplay(); }, 1000);
        if (timerButton) { timerButton.textContent = 'Submit'; timerButton.dataset.action = 'submit'; }
        if (answerTextarea) answerTextarea.disabled = false; if (fileUploadInput) fileUploadInput.disabled = false;
        if (answerTextarea && !fileUploadInput.files[0]) answerTextarea.placeholder = "Type your final answer here...";
    };
    const stopTheTimer = () => { clearInterval(timerInterval); isTimerRunning = false; console.log('Timer stopped. Final time:', secondsElapsed); };
    const openTheTestModal = () => {
        const ansText = answerTextarea.value.trim(), uploadedFile = fileUploadInput.files[0];
        if (!ansText && !uploadedFile) { displayUserMessage("Please provide an answer or upload a file.", "warning"); if (answerTextarea) answerTextarea.focus(); return; }
        prevFocusTestModal = document.activeElement; openModal(confirmModal, confirmSubmitBtn);
    };
    const closeTheTestModal = () => closeModal(confirmModal, prevFocusTestModal);
    if (timerButton) timerButton.addEventListener('click', () => { const action = timerButton.dataset.action; if (action === 'start') startTheTimer(); else if (action === 'submit') openTheTestModal(); });
    if (fileUploadInput) fileUploadInput.addEventListener('change', () => {
        const file = fileUploadInput.files[0];
        if (fileUploadFilename) fileUploadFilename.textContent = file ? `Selected: ${file.name}` : '';
        if (answerTextarea) {
            answerTextarea.disabled = !!file;
            answerTextarea.placeholder = file ? "File selected. Clear selection to type." : (isTimerRunning ? "Type final answer..." : "Start exam...");
            if (file) answerTextarea.value = "";
        }
    });
    if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', async () => {
        // DỪNG TIMER NGAY LẬP TỨC KHI NHẤN CONFIRM TRONG MODAL
        if (isTimerRunning) stopTheTimer();

        const userId = getCurrentUsername();
        if (!userId) { displayUserMessage("You must be logged in to submit.", "error"); triggerLoginModal(null, confirmSubmitBtn); closeTheTestModal(); return; }
        if (!validPaperId) { displayUserMessage("Cannot submit: Invalid Paper ID.", "error"); closeTheTestModal(); return; }
        const currentAnswerText = answerTextarea.value.trim();
        const currentFile = fileUploadInput.files[0];
        let uploadedFileInfo = null;
        confirmSubmitBtn.disabled = true; confirmSubmitBtn.textContent = "Processing...";
        if (currentFile) {
            displayUserMessage("Uploading file...", "info");
            uploadedFileInfo = await uploadFileToFirebase(currentFile, userId, paperId);
            if (!uploadedFileInfo) {
                displayUserMessage("File upload failed. Submission canceled.", "error");
                confirmSubmitBtn.disabled = false; confirmSubmitBtn.textContent = "Confirm Submit";
                return; // Không đóng modal, để user thử lại
            }
        }
        const submissionData = { userId, paperId, answerText: currentAnswerText, fileUrl: uploadedFileInfo?.url, fileName: uploadedFileInfo?.name, timeSpent: secondsElapsed };
        try {
            displayUserMessage("Submitting for grading...", "info", 10000);
            const result = await callBackendAPI('submit_attempt', 'POST', submissionData); // Dùng helper
            console.log('Attempt submitted successfully:', result);
            displayUserMessage("Submission successful! Redirecting to results...", "success");
            closeTheTestModal(); // Đóng modal khi thành công
            setTimeout(() => { window.location.href = `result.html?attemptId=${result.attemptId}&paperId=${result.paperId}`; }, 1500);
        } catch (error) {
            console.error('Error submitting attempt:', error);
            displayUserMessage(`Submission error: ${error.message}`, 'error');
            // Để modal mở để user thấy lỗi
        } finally {
            // Chỉ kích hoạt lại nút nếu modal còn mở (tức là có lỗi)
            if (confirmModal?.classList.contains('is-visible')) {
                confirmSubmitBtn.disabled = false;
                confirmSubmitBtn.textContent = "Confirm Submit";
            }
        }
    });
    modalCloseElements.forEach(el => el.addEventListener('click', closeTheTestModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmModal?.classList.contains('is-visible')) closeTheTestModal(); });
    updateTimerDisplay();
    if (answerTextarea) { answerTextarea.disabled = true; answerTextarea.placeholder = "Start the exam to type or upload."; }
    if (fileUploadInput) fileUploadInput.disabled = true;
}

// ===== RESULT PAGE LOGIC (Gọi API backend) =====
async function setupResultPage() {
    // ... (Giữ nguyên logic hàm này như đã cung cấp ở phản hồi trước, sử dụng fetchAttemptDetails
    //      và cập nhật logic delete button để gọi API backend)
    console.log("Setting up Result Page...");
    const deleteButton = document.getElementById('delete-attempt-btn');
    const deleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-action-btn');
    const modalCloseElements = deleteModal?.querySelectorAll('[data-close-modal], .modal__close-btn');
    const paperCodeHeading = document.getElementById('result-paper-code');
    const durationElement = document.querySelector('.result-block--grade-details .detail-item:nth-child(2) .detail-value');
    const gradeValueElement = document.querySelector('.result-block--grade-details .detail-value--grade');
    const rawScoreElement = document.querySelector('.result-block--grade-details .detail-item:nth-child(3) .detail-value');
    const secAScoreEl = document.querySelector('[aria-labelledby="section-a-heading"] .section-score-summary');
    const secBScoreEl = document.querySelector('[aria-labelledby="section-b-heading"] .section-score-summary');
    const secCScoreEl = document.querySelector('[aria-labelledby="section-c-heading"] .section-score-summary');
    const viewFullAttemptBtn = document.getElementById('view-full-attempt-btn'); // Nút mới trong result.html

    if (!paperCodeHeading || !durationElement || !gradeValueElement || !rawScoreElement) { console.warn("Result page display elements missing."); if(paperCodeHeading) paperCodeHeading.textContent = "Error"; return; }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();

    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading result details...", "info");
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl);
        if (attemptData) {
            const finalPaperId = attemptData.paperId || paperIdFromUrl;
            if(paperCodeHeading) paperCodeHeading.textContent = formatPaperCode(finalPaperId);
            document.title = `${formatPaperCode(finalPaperId)} - Result - PaperBuddy`;
            if(gradeValueElement) gradeValueElement.textContent = attemptData.grade || 'N/A';
            if(durationElement) durationElement.textContent = formatTime(attemptData.timeSpent || 0);
            if(rawScoreElement) rawScoreElement.textContent = `${attemptData.score || 0} / 60`;
            if (attemptData.sectionScores) {
                if (secAScoreEl) secAScoreEl.textContent = attemptData.sectionScores.sectionA || 'N/A';
                if (secBScoreEl) secBScoreEl.textContent = attemptData.sectionScores.sectionB || 'N/A';
                if (secCScoreEl) secCScoreEl.textContent = attemptData.sectionScores.sectionC || 'N/A';
            } else { // Fallback nếu không có sectionScores
                if (secAScoreEl) secAScoreEl.textContent = 'N/A'; if (secBScoreEl) secBScoreEl.textContent = 'N/A'; if (secCScoreEl) secCScoreEl.textContent = 'N/A';
            }
            // Cập nhật link cho nút "View full attempt"
            if(viewFullAttemptBtn) viewFullAttemptBtn.href = `attempt.html?attemptId=${encodeURIComponent(attemptId)}&paperId=${encodeURIComponent(finalPaperId)}`;

        } else {
            if(paperCodeHeading) paperCodeHeading.textContent = "Could not load result.";
            displayUserMessage("Failed to load result. Attempt may not exist or an error occurred.", "error");
            if (deleteButton) deleteButton.disabled = true;
        }
    } else {
        if(paperCodeHeading) paperCodeHeading.textContent = "Invalid Result/Login";
        if (!validAttemptId) displayUserMessage("Attempt ID is missing or invalid.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in to view results.", "error");
        if (deleteButton) deleteButton.disabled = true;
    }
    if (deleteButton && deleteModal && confirmDeleteBtn && modalCloseElements) {
        let prevFocusResultDel = null;
        const openDelM = () => { prevFocusResultDel = document.activeElement; openModal(deleteModal, confirmDeleteBtn); };
        const closeDelM = () => closeModal(deleteModal, prevFocusResultDel);
        deleteButton.addEventListener('click', () => { if (validAttemptId && currentUserId) openDelM(); else displayUserMessage("Cannot delete: Invalid ID or not logged in.", "error");});
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!validAttemptId || !currentUserId) { displayUserMessage("Deletion error: Invalid data.", "error"); closeDelM(); return; }
            confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = "Deleting...";
            try {
                const deletePayload = { attemptId, userId: currentUserId, paperId: paperIdFromUrl }; // Gửi cả paperId
                const result = await callBackendAPI('delete_attempt', 'POST', deletePayload); // Dùng helper

                console.log('Delete attempt result:', result);
                displayUserMessage("Attempt deleted successfully! Redirecting...", "success");
                closeDelM(); // Đóng modal khi thành công

                // Chuyển hướng thông minh hơn dựa trên paperId (nếu có) từ response
                const deletedPaperId = result.relatedPaperId || paperIdFromUrl;
                let redirectUrl = 'papers.html';
                if(deletedPaperId) {
                    const subjectData = ALL_PAPER_DATA_SOURCE.find(p => p.id === deletedPaperId);
                    if (subjectData && subjectData.subjectId) {
                        redirectUrl = `papers.html?subject=${encodeURIComponent(subjectData.subjectId)}`;
                    }
                }
                setTimeout(() => { window.location.href = redirectUrl; }, 1500);

            } catch (error) {
                console.error('Error deleting attempt:', error);
                displayUserMessage(`Delete error: ${error.message}`, 'error');
                // Giữ modal mở để user thấy lỗi
            } finally {
                 if (deleteModal?.classList.contains('is-visible')) {
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = "Confirm Delete";
                }
            }
        });
        modalCloseElements.forEach(el => el.addEventListener('click', closeDelM));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && deleteModal?.classList.contains('is-visible')) closeDelM(); });
    }
    const dlFeedbackBtn = document.getElementById('download-feedback-btn');
    const dlOutlineBtn = document.getElementById('download-outline-btn');
    const dlHandler = (e, type) => { e.preventDefault(); displayUserMessage(`Download ${type} feature is not yet implemented.`, 'info');};
    if (dlFeedbackBtn) dlFeedbackBtn.addEventListener('click', (e) => dlHandler(e, 'feedback'));
    if (dlOutlineBtn) dlOutlineBtn.addEventListener('click', (e) => dlHandler(e, 'outline'));
}