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

// Function to get the correct storage key for the current user (cho các dữ liệu client-side)
function getUserStorageKey(baseKey) {
    const username = getCurrentUsername();
    if (!username) {
        return null; // Hoặc baseKey nếu bạn muốn dữ liệu không theo user khi chưa login
    }
    return `${baseKey}_user_${username}`;
}

// Modified Storage Functions to use user-specific keys (cho các dữ liệu client-side)
function getUserData(baseKey, defaultValue = {}) {
    const userKey = getUserStorageKey(baseKey);
    if (!userKey) return defaultValue; // Nếu không có user, trả về default
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


// Constants for Base Storage Keys (USER_SUBJECTS vẫn dùng localStorage)
const BASE_STORAGE_KEYS = {
    USER_SUBJECTS: 'paperBuddyUserSubjects',
    // PAPER_STATUSES và ATTEMPT_DURATIONS sẽ được quản lý bởi backend và lấy qua API.
    // Chúng ta có thể thêm placeholder cho PAPER_STATUSES để test UI.
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
        toast.className = `toast toast--visible toast--${type}`; // Thêm class visible
        setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, duration);
    } else { // Fallback to console if toast element not found
        const logMethod = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
        logMethod(`User Message (${type.toUpperCase()}): ${message}`);
    }
}

// ===== GLOBAL DATA SOURCE (Cho danh sách papers) =====
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
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE", // ĐIỀN THÔNG TIN CỦA BẠN
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let firebaseApp;
let storageClient;

function initializeFirebaseClient() {
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK not loaded.");
        displayUserMessage("File service unavailable. Please refresh.", "error");
        return false;
    }
    if (!firebaseApp) {
        try {
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
    // ... (Giữ nguyên logic hàm này như đã cung cấp ở phản hồi trước)
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
        displayUserMessage(`Uploading ${file.name}... This may take a moment.`, 'info', 10000);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File uploaded successfully. URL:', downloadURL);
        displayUserMessage(`${file.name} uploaded successfully!`, 'success');
        return { url: downloadURL, path: filePath, name: file.name, type: file.type, size: file.size };
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        let errorMsg = `Error uploading ${file.name}.`;
        if (error.code) {
            switch (error.code) {
                case 'storage/unauthorized': errorMsg += ' You do not have permission to upload.'; break;
                case 'storage/canceled': errorMsg += ' Upload was canceled.'; break;
                case 'storage/unknown': errorMsg += ' An unknown error occurred.'; break;
                default: errorMsg += ` ${error.message}`;
            }
        } else { errorMsg += ` ${error.message}`; }
        displayUserMessage(errorMsg, 'error');
        return null;
    }
}


// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    // ... (Giữ nguyên logic DOMContentLoaded như đã cung cấp ở phản hồi trước)
    console.log("PaperBuddy Script Loaded");
    initializeFirebaseClient();
    setupHeaderScroll();
    updateHeaderUI();
    setupLoginModal();
    setupLoginRequiredChecks();
    const pathname = window.location.pathname.split('/').pop() || 'index.html';
    if (pathname !== 'index.html' && !isUserLoggedIn()) {
        if (['attempt.html', 'test.html', 'result.html'].includes(pathname)) {
            alert(`Please log in to access ${pathname.split('.')[0]}.`);
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

// ===== GENERAL FUNCTIONS (Header Scroll, Modals) =====
// ... (Giữ nguyên các hàm setupHeaderScroll, trapFocus, openModal, closeModal như đã cung cấp)
function setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    const scrollThreshold = 50;
    const addHeaderShadow = () => {
        header.classList.toggle('header--scrolled', window.scrollY >= scrollThreshold);
    };
    window.addEventListener('scroll', addHeaderShadow, { passive: true });
    addHeaderShadow();
}

function trapFocus(event, modalElement) {
    if (!modalElement || !modalElement.classList.contains('is-visible') || event.key !== 'Tab') return;
    const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) { event.preventDefault(); return; }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); event.preventDefault();}}
    else { if (document.activeElement === lastElement) { firstElement.focus(); event.preventDefault();}}}

function openModal(modalElement, focusElement) {
    if (!modalElement) return null;
    const previouslyFocused = document.activeElement;
    modalElement.hidden = false; void modalElement.offsetWidth;
    modalElement.classList.add('is-visible');
    modalElement.setAttribute('aria-hidden', 'false');
    const elementToFocus = focusElement && modalElement.contains(focusElement) && !focusElement.disabled
        ? focusElement
        : modalElement.querySelector('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    elementToFocus?.focus();
    if (modalElement._trapFocusListener) { document.removeEventListener('keydown', modalElement._trapFocusListener); }
    const trapFocusListener = (e) => trapFocus(e, modalElement);
    modalElement._trapFocusListener = trapFocusListener;
    document.addEventListener('keydown', modalElement._trapFocusListener);
    return previouslyFocused;
}
function closeModal(modalElement, previouslyFocusedElement) {
     if (!modalElement || !modalElement.classList.contains('is-visible')) return;
     modalElement.classList.remove('is-visible');
     modalElement.setAttribute('aria-hidden', 'true');
     if (modalElement._trapFocusListener) { document.removeEventListener('keydown', modalElement._trapFocusListener); delete modalElement._trapFocusListener;}
     const handleTransitionEnd = (event) => {
         if (event.target === modalElement) {
             modalElement.hidden = true;
             if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function' && document.body.contains(previouslyFocusedElement)) {
                  const style = window.getComputedStyle(previouslyFocusedElement);
                 if (style.display !== 'none' && style.visibility !== 'hidden' && !previouslyFocusedElement.disabled && previouslyFocusedElement.tabIndex !== -1) {
                      previouslyFocusedElement.focus({ preventScroll: true });}}
             modalElement.removeEventListener('transitionend', handleTransitionEnd);}};
     modalElement.addEventListener('transitionend', handleTransitionEnd);
     setTimeout(() => { if (!modalElement.hidden && modalElement.getAttribute('aria-hidden') === 'true') { handleTransitionEnd({ target: modalElement });}}, 500);
}

// ===== LOGIN / AUTH FUNCTIONS =====
// ... (Giữ nguyên các hàm updateHeaderUI, setupLoginModal, triggerLoginModal, setupLoginRequiredChecks như đã cung cấp)
function updateHeaderUI() {
    const loggedIn = isUserLoggedIn();
    const username = getCurrentUsername();
    const loginBtn = document.getElementById('login-trigger-btn');
    const joinBtn = document.getElementById('join-trigger-btn');
    const userInfoDiv = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('nav-username-display');
    const logoutBtn = document.getElementById('logout-btn');
    if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';
    if (joinBtn) joinBtn.style.display = loggedIn ? 'none' : '';
    if (userInfoDiv) userInfoDiv.style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn && usernameDisplay) { usernameDisplay.textContent = username; }
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        if (loggedIn) {
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); logoutUser(); updateHeaderUI(); window.location.href = 'index.html';
            });}}}
function setupLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) { console.error("Login modal not found!"); return; }
    document.querySelectorAll('[data-open-modal="login-modal"]').forEach(trigger => {
        trigger.addEventListener('click', (event) => triggerLoginModal(event, trigger));});
    const closeModalElements = loginModal.querySelectorAll('[data-close-modal], .modal__close-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const errorMessage = document.getElementById('login-error-message');
    if (!loginForm || !usernameInput || !errorMessage) { console.error("Login modal inner elements missing."); return; }
    const closeLoginModal = () => {
        const focusRestoreTarget = loginModal._focusRestoreElement;
        closeModal(loginModal, focusRestoreTarget);
        if (loginModal._focusRestoreElement) { delete loginModal._focusRestoreElement; }};
    closeModalElements.forEach(el => el.addEventListener('click', closeLoginModal));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && loginModal.classList.contains('is-visible')) closeLoginModal();});
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); errorMessage.hidden = true;
        const username = usernameInput.value.trim();
        if (!username) { errorMessage.textContent = "Username is required."; errorMessage.hidden = false; usernameInput.focus(); return; }
        if (loginUser(username)) { closeLoginModal(); updateHeaderUI(); setTimeout(() => window.location.reload(), 50); }
        else { errorMessage.textContent = "Login failed. Please enter a username."; errorMessage.hidden = false; }});}
function triggerLoginModal(event, triggerElement) {
    if (event) event.preventDefault();
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('login-username');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');
    if (!loginModal || !usernameInput || !loginForm || !errorMessage) { displayUserMessage("Login component error.", "error"); return; }
    loginForm.reset(); errorMessage.hidden = true;
    const focusRestoreTarget = triggerElement || event?.currentTarget || document.body;
    const elementThatWasFocused = openModal(loginModal, usernameInput);
    loginModal._focusRestoreElement = focusRestoreTarget || elementThatWasFocused;}
function setupLoginRequiredChecks() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    const requiresLoginSelectors = [
        '.nav__list a[href="dashboard.html"]', '.nav__list a[href="papers.html"]',
        '.hero__search-button', '.hero__search-form', '.subjects__item', '.cta__container a.button'];
    document.querySelectorAll(requiresLoginSelectors.join(', ')).forEach(element => {
        const handler = (event) => {
            if (!isUserLoggedIn()) {
                const trigger = (element.tagName === 'FORM') ? element.querySelector('button[type="submit"], input[type="submit"]') : event.currentTarget;
                triggerLoginModal(event, trigger || element);}};
        if (element.tagName === 'FORM') element.addEventListener('submit', handler);
        else if (element.tagName === 'A' || element.tagName === 'BUTTON') element.addEventListener('click', handler);});}


// ===== DASHBOARD PAGE LOGIC (Giữ nguyên việc lưu subject vào localStorage) =====
function setupDashboardPage() {
    // ... (Copy toàn bộ nội dung hàm setupDashboardPage từ phản hồi trước,
    //      đảm bảo nó sử dụng getUserData/setUserData cho USER_SUBJECTS
    //      và calculateSubjectStats có thể mock dữ liệu.)
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
        return { progress: Math.floor(Math.random() * 100), grade: ['A', 'B', 'C', 'N/A'][Math.floor(Math.random() * 4)] };
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
        const items = subjectsListWrapper.querySelectorAll('.subjects-list__item');
        items.forEach(item => item.remove());
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
        const focusTarget = subjectForm.querySelector('input[type="checkbox"]') || subjectForm.querySelector('button[type="submit"]');
        previouslyFocusedElementDash = openModal(modal, focusTarget);
    };
    const closeSubjectModal = () => { closeModal(modal, previouslyFocusedElementDash); };
    if(openModalBtn) openModalBtn.addEventListener('click', openSubjectModal);
    closeModalElements.forEach(el => el.addEventListener('click', closeSubjectModal));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal?.classList.contains('is-visible')) closeSubjectModal(); });
    if(subjectForm) subjectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const checked = subjectForm.querySelectorAll('input[name="subjects"]:checked');
        const newData = Array.from(checked).map(cb => ({ id: cb.value, label: cb.dataset.label || cb.value }));
        currentUserSubjects = newData;
        if (setUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, currentUserSubjects)) {
            renderSubjectsList(currentUserSubjects);
            displayUserMessage("Subjects saved successfully!", "success");
        }
        closeSubjectModal();
    });
    renderSubjectsList(currentUserSubjects);
}

// ===== PAPERS PAGE LOGIC (Có placeholder cho paperStatuses) =====
function setupPapersPage_Dynamic() {
    // ... (Copy toàn bộ nội dung hàm setupPapersPage_Dynamic từ phản hồi trước,
    //      đảm bảo nó có mock data cho paperStatuses để test UI.)
    console.log("Setting up Papers Page (Dynamic Rendering)...");
    const papersListContainer = document.getElementById('papers-list-container');
    const noPapersMessage = document.getElementById('no-papers-message');
    const filterForm = document.getElementById('paper-filter-form');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const mainTitle = document.getElementById('papers-main-title');

    if (!papersListContainer || !noPapersMessage || !filterForm || !applyFiltersBtn || !mainTitle) {
        console.warn("Papers page dynamic elements missing."); return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const subjectFilterFromUrl = urlParams.get('subject');
    let paperStatuses = {}; // Sẽ được điền bởi mock data hoặc fetch từ backend

    async function fetchPaperStatusesAndApplyMock() { // Đổi tên hàm để rõ ràng hơn
        const userId = getCurrentUsername();
        // Hiện tại chỉ mock, sau này sẽ fetch từ backend
        // if (userId) {
        //     try {
        //         const response = await fetch(`/.netlify/functions/backend?action=get_all_user_paper_statuses&userId=${userId}`);
        //         if (response.ok) {
        //             const data = await response.json();
        //             if (data.success && data.statuses) return data.statuses;
        //         }
        //     } catch (e) { console.error("Error fetching paper statuses:", e); }
        // }

        // Mock data for testing if no user or fetch fails
        let mockStatuses = {};
        if (isUserLoggedIn()) { // Chỉ thêm mock nếu đã login để có thể link tới attemptId
            console.log("Applying MOCK paper statuses for testing papers page.");
            mockStatuses['econ-9708-11-mj-25'] = { status: 'done', linkAttemptId: `${getCurrentUsername()}_econ-9708-11-mj-25_mock1` };
            mockStatuses['biz-9609-21-fm-25'] = { status: 'not_done', linkAttemptId: null };
            mockStatuses['econ-9708-32-on-25'] = { status: 'done', linkAttemptId: `${getCurrentUsername()}_econ-9708-32-on-25_mock2` };
        }
        return mockStatuses;
    }

    function createPaperCard(paper) {
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
    function renderPapers(papersToRender) {
        if(!papersListContainer || !noPapersMessage) return;
        papersListContainer.innerHTML = '';
        papersListContainer.appendChild(noPapersMessage); // Đưa vào để có thể ẩn/hiện
        noPapersMessage.hidden = true;
        if (!Array.isArray(papersToRender) || papersToRender.length === 0) {
            noPapersMessage.textContent = "No past papers found matching your filters."; noPapersMessage.hidden = false; return;
        }
        const papersByYear = papersToRender.reduce((acc, p) => { const year = p.year || 'Unknown'; if (!acc[year]) acc[year] = []; acc[year].push(p); return acc; }, {});
        const sortedYears = Object.keys(papersByYear).sort((a, b) => parseInt(b) - parseInt(a)); // Sắp xếp năm giảm dần
        let papersFound = false;
        sortedYears.forEach(year => {
            const yearGroupSection = document.createElement('section'); yearGroupSection.className = 'papers-year-group';
            const yearTitle = document.createElement('h3'); yearTitle.className = 'year-group__title'; yearTitle.textContent = year;
            const papersGridDiv = document.createElement('div'); papersGridDiv.className = 'papers-grid';
            papersByYear[year].sort((a, b) => { /* Sắp xếp paper trong năm */
                const sa = { 'FM': 1, 'MJ': 2, 'ON': 3 }[a.sessionCode] || 9;
                const sb = { 'FM': 1, 'MJ': 2, 'ON': 3 }[b.sessionCode] || 9;
                if (sa !== sb) return sa - sb;
                return (parseInt(a.paperNumber) || 99) - (parseInt(b.paperNumber) || 99);
            }).forEach(paper => { const card = createPaperCard(paper); if (card) { papersGridDiv.appendChild(card); papersFound = true; }});
            if (papersGridDiv.hasChildNodes()) { yearGroupSection.appendChild(yearTitle); yearGroupSection.appendChild(papersGridDiv); papersListContainer.appendChild(yearGroupSection); }
        });
        noPapersMessage.hidden = papersFound;
        if (!papersFound) noPapersMessage.textContent = "No past papers found for the current filters.";
    }
    function applyFiltersAndRender() {
         if (!filterForm) return;
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
    if (mainTitle) {
        if (subjectFilterFromUrl) {
            const subjectData = ALL_PAPER_DATA_SOURCE.find(p => p.subjectId === subjectFilterFromUrl);
            mainTitle.textContent = subjectData ? `${subjectData.subjectName || 'Subject'} (${subjectData.subjectCode || 'Code'}) Papers` : `Papers`;
        } else { mainTitle.textContent = `All Past Papers`; }
    }
    if(applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFiltersAndRender);

    fetchPaperStatusesAndApplyMock().then(statuses => {
        paperStatuses = statuses;
        applyFiltersAndRender();
    });
}

// ===== ATTEMPT PAGE LOGIC (Gọi API backend) =====
async function setupAttemptContentViewer() {
    // ... (Copy toàn bộ nội dung hàm setupAttemptContentViewer từ phản hồi trước,
    //      đảm bảo nó gọi fetchAttemptDetails và cập nhật UI)
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

    if (!viewer || !paperCodeHeading || !retakeButton) { console.warn("Attempt page core elements missing."); if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading"; return; }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();

    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading attempt details...", "info");
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl);
        if (attemptData) {
            const displayPaperId = attemptData.paperId || paperIdFromUrl;
            paperCodeHeading.textContent = formatPaperCode(displayPaperId);
            document.title = `${formatPaperCode(displayPaperId)} - Attempt - PaperBuddy`;
            if (retakeButton) retakeButton.href = `test.html?paperId=${encodeURIComponent(displayPaperId || 'unknown-paper')}`;
            if (gradeValueElement) gradeValueElement.textContent = attemptData.grade || 'N/A';
            if (durationValueElement) durationValueElement.textContent = formatTime(attemptData.timeSpent || 0);
            if (rawScoreValueElement) rawScoreValueElement.textContent = `${attemptData.score || 0} / 60`;
            if (feedV) feedV.innerHTML = `<p style="padding: 1rem;"><strong>Feedback:</strong></p><p style="padding: 0 1rem 1rem 1rem;">${attemptData.feedback?.replace(/\n/g, '<br>') || 'No feedback available.'}</p>`;
            if (outV) outV.innerHTML = `<p style="padding: 1rem;"><strong>Outline:</strong></p><pre style="padding: 0 1rem 1rem 1rem; white-space: pre-wrap;">${attemptData.outline || 'No outline available.'}</pre>`;
            if (uploadedFileLinkContainer && uploadedFileLink && attemptData.fileUrl) {
                uploadedFileLink.href = attemptData.fileUrl;
                uploadedFileLink.textContent = `View Uploaded File: ${attemptData.fileName || 'File'}`;
                uploadedFileLinkContainer.style.display = 'block';
            }
        } else {
            paperCodeHeading.textContent = "Could not load attempt."; displayUserMessage("Failed to load attempt details.", "error");
            if (retakeButton) retakeButton.style.display = 'none';
        }
    } else {
        paperCodeHeading.textContent = "Invalid Attempt or Not Logged In";
        if (!validAttemptId) displayUserMessage("Attempt ID is missing or invalid.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in.", "error");
        if (retakeButton) retakeButton.style.display = 'none';
    }
    if (paperV && feedV && outV && paperB && feedB && outB) {
        const views = [paperV, feedV, outV]; const buttons = [paperB, feedB, outB];
        const showView = (view) => { views.forEach(v => v.hidden = (v !== view)); if(viewer) viewer.scrollTop = 0; };
        const setActive = (btn) => buttons.forEach(b => b.setAttribute('aria-current', b === btn ? 'page' : 'false'));
        buttons.forEach((btn, i) => btn.addEventListener('click', (e) => { e.preventDefault(); showView(views[i]); setActive(btn); }));
        showView(paperV); setActive(paperB);
    }
    if (retakeModal && confirmRetakeBtn && retakeModalCloseElements && retakeButton) { /* Retake modal logic (giữ nguyên) */
        let prevFocusRetake = null, targetUrl = '';
        const openRetake = () => { prevFocusRetake = document.activeElement; openModal(retakeModal, confirmRetakeBtn); };
        const closeRetake = () => closeModal(retakeModal, prevFocusRetake);
        retakeButton.addEventListener('click', (e) => { e.preventDefault(); targetUrl = retakeButton.href; if (targetUrl && !targetUrl.includes('unknown')) openRetake(); else displayUserMessage("Cannot retake, paper ID unknown.", "error");});
        confirmRetakeBtn.addEventListener('click', () => { closeRetake(); setTimeout(() => { if(targetUrl && !targetUrl.includes('unknown')) window.location.href = targetUrl; else displayUserMessage("Error starting retake.", "error");}, 100);});
        retakeModalCloseElements.forEach(el => el.addEventListener('click', closeRetake));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && retakeModal?.classList.contains('is-visible')) closeRetake(); });
    }
}

// ===== TEST PAGE LOGIC (Đã cập nhật để gọi API backend) =====
async function setupTestPage() {
    // ... (Copy toàn bộ nội dung hàm setupTestPage từ phản hồi trước,
    //      đảm bảo nó gọi uploadFileToFirebase và API submit_attempt)
    console.log("Setting up Test Page Timer and Submission...");
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
        console.warn("Test page elements missing."); if(paperCodeHeading) paperCodeHeading.textContent = "Error Loading Test"; return;
    }
    const { paperId, validPaperId } = getPaperInfoFromUrl();
    if (!validPaperId) {
        paperCodeHeading.textContent = "Invalid Paper ID"; document.title = `Invalid Test - PaperBuddy`;
        if(timerButton) {timerButton.disabled = true; timerButton.textContent = "Invalid Paper";}
        displayUserMessage("Paper ID is missing or invalid.", "error"); return;
    }
    if(paperCodeHeading) paperCodeHeading.textContent = formatPaperCode(paperId);
    document.title = `${formatPaperCode(paperId)} - Test - PaperBuddy`;
    let timerInterval = null, secondsElapsed = 0, isTimerRunning = false, prevFocusTest = null;
    const updateDisp = () => { if(timerDisplay) timerDisplay.textContent = formatTime(secondsElapsed); };
    const startT = () => { if (isTimerRunning) return; isTimerRunning = true; secondsElapsed = 0; updateDisp(); timerInterval = setInterval(() => { secondsElapsed++; updateDisp(); }, 1000); if(timerButton) {timerButton.textContent = 'Submit'; timerButton.dataset.action = 'submit';} if(answerTextarea) answerTextarea.disabled = false; if(fileUploadInput) fileUploadInput.disabled = false; if(answerTextarea && !fileUploadInput.files[0]) answerTextarea.placeholder = "Type final answer...";};
    const stopT = () => { clearInterval(timerInterval); isTimerRunning = false; };
    const openTestM = () => { const ans = answerTextarea.value.trim(), file = fileUploadInput.files[0]; if (!ans && !file) { displayUserMessage("Please enter an answer or upload a file.", "warning"); answerTextarea.focus(); return; } prevFocusTest = document.activeElement; openModal(confirmModal, confirmSubmitBtn);};
    const closeTestM = () => closeModal(confirmModal, prevFocusTest);
    if(timerButton) timerButton.addEventListener('click', () => { const act = timerButton.dataset.action; if (act === 'start') startT(); else if (act === 'submit') openTestM(); });
    if(fileUploadInput) fileUploadInput.addEventListener('change', () => { const file = fileUploadInput.files[0]; if (file) { if(fileUploadFilename) fileUploadFilename.textContent = `File: ${file.name}`; if(answerTextarea) {answerTextarea.disabled = true; answerTextarea.placeholder = "File selected."; answerTextarea.value = "";}} else { if(fileUploadFilename) fileUploadFilename.textContent = ''; if(answerTextarea) {if(isTimerRunning) {answerTextarea.disabled = false; answerTextarea.placeholder = "Type final answer...";} else {answerTextarea.disabled = true; answerTextarea.placeholder = "Start exam to type/upload.";}}}});
    if(confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', async () => {
        if (isTimerRunning) stopT();
        const userId = getCurrentUsername();
        if (!userId) { displayUserMessage("You must be logged in.", "error"); triggerLoginModal(null, confirmSubmitBtn); closeTestM(); return;}
        if (!validPaperId) { displayUserMessage("Cannot submit: Invalid Paper ID.", "error"); closeTestM(); return;}
        const ansText = answerTextarea.value.trim(); const localFile = fileUploadInput.files[0];
        let fileRes = null;
        confirmSubmitBtn.disabled = true; confirmSubmitBtn.textContent = "Processing...";
        if (localFile) {
            displayUserMessage("Uploading file...", "info");
            fileRes = await uploadFileToFirebase(localFile, userId, paperId);
            if (!fileRes) { displayUserMessage("File upload failed. Submission canceled.", "error"); confirmSubmitBtn.disabled = false; confirmSubmitBtn.textContent = "Confirm Submit"; return; }
        }
        const submissionPayload = { action: 'submit_attempt', payload: { paperId, userId, answerText: ansText, fileUrl: fileRes?.url, fileName: fileRes?.name, timeSpent: secondsElapsed }};
        try {
            displayUserMessage("Submitting attempt for grading...", "info", 10000);
            const response = await fetch('/.netlify/functions/backend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionPayload) });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || `Server error: ${response.status}`);}
            console.log('Attempt submitted:', data);
            displayUserMessage("Submission successful! Redirecting...", "success");
            setTimeout(() => { window.location.href = `result.html?attemptId=${data.attemptId}&paperId=${data.paperId}`; }, 1500);
        } catch (error) {
            console.error('Error submitting attempt:', error);
            displayUserMessage(`Submission error: ${error.message}`, 'error');
        } finally {
            confirmSubmitBtn.disabled = false; confirmSubmitBtn.textContent = "Confirm Submit";
            // Không đóng modal ở đây để user thấy lỗi nếu có
        }
    });
    modalCloseElements.forEach(el => el.addEventListener('click', closeTestM));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmModal?.classList.contains('is-visible')) closeTestM(); });
    updateDisp();
    if(answerTextarea) { answerTextarea.disabled = true; answerTextarea.placeholder = "Start the exam to type or upload.";}
    if(fileUploadInput) fileUploadInput.disabled = true;
}

// ===== RESULT PAGE LOGIC (Gọi API backend) =====
async function setupResultPage() {
    // ... (Copy toàn bộ nội dung hàm setupResultPage từ phản hồi trước,
    //      đảm bảo nó gọi fetchAttemptDetails và cập nhật UI,
    //      và logic delete button đã được cập nhật để gọi API backend)
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
    const viewFullAttemptBtn = document.getElementById('view-full-attempt-btn');

    if (!paperCodeHeading || !durationElement || !gradeValueElement || !rawScoreElement) { console.warn("Result page display elements missing."); if(paperCodeHeading) paperCodeHeading.textContent = "Error"; return; }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();

    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading result details...", "info");
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl);
        if (attemptData) {
            const displayPaperId = attemptData.paperId || paperIdFromUrl;
            if(paperCodeHeading) paperCodeHeading.textContent = formatPaperCode(displayPaperId);
            document.title = `${formatPaperCode(displayPaperId)} - Result - PaperBuddy`;
            if(gradeValueElement) gradeValueElement.textContent = attemptData.grade || 'N/A';
            if(durationElement) durationElement.textContent = formatTime(attemptData.timeSpent || 0);
            if(rawScoreElement) rawScoreElement.textContent = `${attemptData.score || 0} / 60`;
            if (attemptData.sectionScores) {
                if (secAScoreEl) secAScoreEl.textContent = attemptData.sectionScores.sectionA || 'N/A';
                if (secBScoreEl) secBScoreEl.textContent = attemptData.sectionScores.sectionB || 'N/A';
                if (secCScoreEl) secCScoreEl.textContent = attemptData.sectionScores.sectionC || 'N/A';
            }
            if(viewFullAttemptBtn) viewFullAttemptBtn.href = `attempt.html?attemptId=${encodeURIComponent(attemptId)}&paperId=${encodeURIComponent(displayPaperId)}`;

        } else {
            if(paperCodeHeading) paperCodeHeading.textContent = "Could not load result."; displayUserMessage("Failed to load result details.", "error");
            if (deleteButton) deleteButton.disabled = true;
        }
    } else {
        if(paperCodeHeading) paperCodeHeading.textContent = "Invalid Result/Login";
        if (!validAttemptId) displayUserMessage("Attempt ID invalid.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in.", "error");
        if (deleteButton) deleteButton.disabled = true;
    }
    if (deleteButton && deleteModal && confirmDeleteBtn && modalCloseElements) {
        let prevFocusResult = null;
        const openDelModal = () => { prevFocusResult = document.activeElement; openModal(deleteModal, confirmDeleteBtn); };
        const closeDelModal = () => closeModal(deleteModal, prevFocusResult);
        deleteButton.addEventListener('click', () => { if (validAttemptId && currentUserId) openDelModal(); else displayUserMessage("Cannot delete: Invalid ID or not logged in.", "error");});
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!validAttemptId || !currentUserId) { displayUserMessage("Deletion error.", "error"); closeDelModal(); return; }
            confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = "Deleting...";
            try {
                const response = await fetch('/.netlify/functions/backend', {
                    method: 'POST', // Hoặc 'DELETE' nếu backend hỗ trợ
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete_attempt', payload: { attemptId, userId: currentUserId, paperId: paperIdFromUrl } })
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.error || `Server error: ${response.status}`); }
                displayUserMessage("Attempt deleted successfully! Redirecting...", "success");
                const redirPaperId = data.relatedPaperId || paperIdFromUrl; // Lấy paperId từ response nếu có
                const subjectIdForRedirect = redirPaperId ? ALL_PAPER_DATA_SOURCE.find(p => p.id === redirPaperId)?.subjectId : null;
                const redirectUrl = subjectIdForRedirect ? `papers.html?subject=${encodeURIComponent(subjectIdForRedirect)}` : 'papers.html';
                setTimeout(() => { window.location.href = redirectUrl; }, 1500);
            } catch (error) {
                console.error('Error deleting attempt:', error);
                displayUserMessage(`Delete error: ${error.message}`, 'error');
            } finally {
                confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = "Confirm Delete";
                closeDelModal();
            }
        });
        modalCloseElements.forEach(el => el.addEventListener('click', closeDelModal));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && deleteModal?.classList.contains('is-visible')) closeDelModal(); });
    }
    const dlFeedbackBtn = document.getElementById('download-feedback-btn');
    const dlOutlineBtn = document.getElementById('download-outline-btn');
    const dlHandler = (e, type) => { e.preventDefault(); displayUserMessage(`Download ${type} not implemented.`, 'info');};
    if (dlFeedbackBtn) dlFeedbackBtn.addEventListener('click', (e) => dlHandler(e, 'feedback'));
    if (dlOutlineBtn) dlOutlineBtn.addEventListener('click', (e) => dlHandler(e, 'outline'));
}


// --- HÀM CHUNG ĐỂ LẤY CHI TIẾT ATTEMPT TỪ BACKEND ---
async function fetchAttemptDetails(attemptId, userId, paperIdForLog) {
    // ... (Giữ nguyên logic hàm này như đã cung cấp ở phản hồi trước)
    if (!attemptId || !userId) {
        console.error("Missing attemptId or userId to fetch details."); return null;
    }
    try {
        const response = await fetch(`/.netlify/functions/backend?action=get_attempt_details&attemptId=${encodeURIComponent(attemptId)}&userId=${encodeURIComponent(userId)}&paperId=${encodeURIComponent(paperIdForLog || '')}`);
        if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.error || `Server error: ${response.status}`);}
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Network error fetching attempt details:', error);
        displayUserMessage(`Error loading details: ${error.message}`, "error"); // Hiển thị lỗi cho user
        return null;
    }
}