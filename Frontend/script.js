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
        // Consider clearing other user-specific localStorage if any remains
        console.log(`User "${username}" logged out.`);
    }
}

// --- LocalStorage Helpers --- (Không thay đổi nhiều, nhưng getUserData/setUserData sẽ ít dùng hơn)
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
// Constants for any remaining Base Storage Keys (e.g., for user subjects if kept client-side)
const BASE_STORAGE_KEYS = {
    USER_SUBJECTS: 'paperBuddyUserSubjects',
    // PAPER_STATUSES: 'paperBuddyPaperStatuses', // Sẽ được lấy từ DB
    // ATTEMPT_DURATIONS: 'paperBuddyAttemptDurations' // Sẽ được lấy từ DB
};
function getUserData(baseKey, defaultValue = {}) {
    const username = getCurrentUsername();
    if (!username) return defaultValue; // If no user, return default
    const userKey = `${baseKey}_user_${username}`;
    return getStorageItem(userKey, defaultValue);
}
function setUserData(baseKey, value) {
    const username = getCurrentUsername();
    if (!username) {
        console.error(`Error saving user data (${baseKey}): User not logged in.`);
        return false;
    }
    const userKey = `${baseKey}_user_${username}`;
    return setStorageItem(userKey, value);
}


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
    // Basic console log for now. Consider implementing a proper UI element.
    switch (type) {
        case 'error': console.error("User Message:", message); break;
        case 'warning': console.warn("User Message:", message); break;
        case 'success': console.log("User Message (Success):", message); break;
        default: console.log("User Message (Info):", message);
    }
    // Example for a simple UI toast (you'd need to create #user-message-toast in HTML)
    const toast = document.getElementById('user-message-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast--${type}`; // Add classes for styling
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }
}

// ===== GLOBAL DATA SOURCE (Mock - For subject info, paper listing) =====
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
// TODO: Thay thế bằng Firebase config của bạn từ Firebase Console
// (Project settings -> General -> Your apps -> Web app -> Config)
const firebaseConfig = {
    apiKey: "AIzaSyYOUR_FIREBASE_API_KEY_HERE", // An toàn để lộ ở client
    authDomain: "paperbuddy-643ba.firebaseapp.com", // Thay bằng authDomain của bạn
    projectId: "paperbuddy-643ba",                 // Thay bằng projectId của bạn
    storageBucket: "paperbuddy-643ba.appspot.com", // Khớp với FIREBASE_STORAGE_BUCKET ở backend
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
};

let firebaseApp;
let storageClient; // Firebase Storage client instance

function initializeFirebaseClient() {
    // Kiểm tra xem `firebase` object có tồn tại không (từ script SDK)
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK not loaded. Make sure to include the Firebase JS SDK scripts in your HTML.");
        displayUserMessage("File service unavailable. Please refresh.", "error");
        return false; // Initialization failed
    }

    if (!firebaseApp) { // Chỉ khởi tạo một lần
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            storageClient = firebase.storage(); // Khởi tạo Storage
            console.log("Firebase client initialized.");
            return true; // Initialization successful
        } catch (e) {
            console.error("Error initializing Firebase client:", e);
            displayUserMessage("Error connecting to file service. Upload might not work.", "error");
            return false; // Initialization failed
        }
    }
    return true; // Already initialized
}

// --- Firebase File Upload Helper ---
async function uploadFileToFirebase(file, userId, paperId) {
    if (!initializeFirebaseClient() || !storageClient || !file || !userId || !paperId) {
        console.error("Firebase Storage not initialized or missing parameters for upload.");
        displayUserMessage("File upload service not ready. Please try again.", "error");
        return null;
    }
    const timestamp = Date.now();
    // Sanitize paperId for path, thay thế ký tự không hợp lệ bằng gạch dưới
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
                case 'storage/unauthorized':
                    errorMsg += ' You do not have permission to upload.';
                    break;
                case 'storage/canceled':
                    errorMsg += ' Upload was canceled.';
                    break;
                case 'storage/unknown':
                    errorMsg += ' An unknown error occurred.';
                    break;
                default:
                    errorMsg += ` ${error.message}`;
            }
        } else {
            errorMsg += ` ${error.message}`;
        }
        displayUserMessage(errorMsg, 'error');
        return null;
    }
}


// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("PaperBuddy Script Loaded");

    // Initialize Firebase Client as early as possible
    initializeFirebaseClient();

    setupHeaderScroll();
    updateHeaderUI();
    setupLoginModal();
    setupLoginRequiredChecks();

    const pathname = window.location.pathname.split('/').pop() || 'index.html';
    if (pathname !== 'index.html' && !isUserLoggedIn()) {
        console.log(`Page ${pathname}: User not logged in. Redirecting to landing page.`);
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
    // ... (logic không đổi)
    if (!modalElement || !modalElement.classList.contains('is-visible') || event.key !== 'Tab') return;
    const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) {
        event.preventDefault();
        return;
    }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
        }
    }
}

function openModal(modalElement, focusElement) {
    // ... (logic không đổi)
    if (!modalElement) return null;
    const previouslyFocused = document.activeElement;
    modalElement.hidden = false;
    void modalElement.offsetWidth;
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
    // ... (logic không đổi)
     if (!modalElement || !modalElement.classList.contains('is-visible')) return;
     modalElement.classList.remove('is-visible');
     modalElement.setAttribute('aria-hidden', 'true');
     if (modalElement._trapFocusListener) {
         document.removeEventListener('keydown', modalElement._trapFocusListener);
         delete modalElement._trapFocusListener;
     }
     const handleTransitionEnd = (event) => {
         if (event.target === modalElement) {
             modalElement.hidden = true;
             if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function' && document.body.contains(previouslyFocusedElement)) {
                  const style = window.getComputedStyle(previouslyFocusedElement);
                 if (style.display !== 'none' && style.visibility !== 'hidden' && !previouslyFocusedElement.disabled && previouslyFocusedElement.tabIndex !== -1) {
                      previouslyFocusedElement.focus({ preventScroll: true });
                 }
             }
             modalElement.removeEventListener('transitionend', handleTransitionEnd);
         }
     };
     modalElement.addEventListener('transitionend', handleTransitionEnd);
     setTimeout(() => {
         if (!modalElement.hidden && modalElement.getAttribute('aria-hidden') === 'true') {
              handleTransitionEnd({ target: modalElement });
         }
     }, 500);
}

// ===== LOGIN / AUTH FUNCTIONS =====
function updateHeaderUI() { /* ... (logic không đổi) ... */
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

    if (loggedIn && usernameDisplay) {
        usernameDisplay.textContent = username;
    }

    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        if (loggedIn) {
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                updateHeaderUI();
                window.location.href = 'index.html';
            });
        }
    }
}

function setupLoginModal() { /* ... (logic không đổi) ... */
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) { console.error("Login modal element (#login-modal) not found!"); return; }
    const openModalTriggers = document.querySelectorAll('[data-open-modal="login-modal"]');
    openModalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            triggerLoginModal(event, trigger);
        });
    });
    const closeModalElements = loginModal.querySelectorAll('[data-close-modal], .modal__close-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const errorMessage = document.getElementById('login-error-message');
    if (!loginForm || !usernameInput || !errorMessage) { console.error("Required elements within the login modal are missing."); return; }
    const closeLoginModal = () => {
        const focusRestoreTarget = loginModal._focusRestoreElement;
        closeModal(loginModal, focusRestoreTarget);
        if (loginModal._focusRestoreElement) { delete loginModal._focusRestoreElement; }
    };
    closeModalElements.forEach(el => el.addEventListener('click', closeLoginModal));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && loginModal.classList.contains('is-visible')) {
            closeLoginModal();
        }
    });
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        errorMessage.hidden = true;
        const username = usernameInput.value.trim();
        if (!username) {
            errorMessage.textContent = "Username is required.";
            errorMessage.hidden = false;
            usernameInput.focus();
            return;
        }
        const success = loginUser(username);
        if (success) {
            closeLoginModal();
            updateHeaderUI();
            setTimeout(() => window.location.reload(), 50);
        } else {
            errorMessage.textContent = "Login failed (mock). Please enter a valid username.";
            errorMessage.hidden = false;
        }
    });
}

function triggerLoginModal(event, triggerElement) { /* ... (logic không đổi) ... */
    if (event) event.preventDefault();
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('login-username');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');
    if (!loginModal || !usernameInput || !loginForm || !errorMessage) {
         displayUserMessage("Login component error. Please refresh.", "error");
         return;
    }
    loginForm.reset();
    errorMessage.hidden = true;
    const focusRestoreTarget = triggerElement || event?.currentTarget || document.body;
    const elementThatWasFocused = openModal(loginModal, usernameInput);
    loginModal._focusRestoreElement = focusRestoreTarget || elementThatWasFocused;
}

function setupLoginRequiredChecks() { /* ... (logic không đổi) ... */
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    const requiresLoginSelectors = [
        '.nav__list a[href="dashboard.html"]', '.nav__list a[href="papers.html"]',
        '.hero__search-button', '.hero__search-form', '.subjects__item', '.cta__container a.button'
    ];
    document.querySelectorAll(requiresLoginSelectors.join(', ')).forEach(element => {
        const handler = (event) => {
            if (!isUserLoggedIn()) {
                const trigger = (element.tagName === 'FORM') ? element.querySelector('button[type="submit"], input[type="submit"]') : event.currentTarget;
                triggerLoginModal(event, trigger || element);
            }
        };
        if (element.tagName === 'FORM') element.addEventListener('submit', handler);
        else if (element.tagName === 'A' || element.tagName === 'BUTTON') element.addEventListener('click', handler);
    });
}

// ===== DASHBOARD PAGE LOGIC =====
function setupDashboardPage() {
    // TODO: Cập nhật để lấy subject stats từ backend nếu cần
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
    welcomeTitle.textContent = `Hi, ${username}`;
    let previouslyFocusedElementDash = null;
    let currentUserSubjects = getUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, []); // Vẫn dùng localStorage cho subject preferences

    // Hàm calculateSubjectStats có thể cần lấy paperStatuses từ backend thay vì localStorage
    // Hoặc, để đơn giản tạm thời, backend có thể trả về stats này
    function calculateSubjectStats(subjectId) {
        // Tạm thời giữ nguyên logic này, nhưng lý tưởng là lấy từ backend
        // const paperStatuses = getStorageItem(getUserStorageKey(BASE_STORAGE_KEYS.PAPER_STATUSES), {});
        // ... logic tính toán ...
        // return { progress, grade };
        return { progress: Math.floor(Math.random() * 100), grade: ['A', 'B', 'C', 'N/A'][Math.floor(Math.random() * 4)] }; // Mock
    }
    const createSubjectRow = (subjectData) => { /* ... (logic không đổi) ... */
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
    const renderSubjectsList = (subjectsData) => { /* ... (logic không đổi) ... */
        const items = subjectsListWrapper.querySelectorAll('.subjects-list__item');
        items.forEach(item => item.remove());
        const validSubjectsData = Array.isArray(subjectsData) ? subjectsData : [];
        noSubjectsMessage.hidden = validSubjectsData.length > 0;
        if (validSubjectsData.length > 0) {
            validSubjectsData.forEach(subject => { const row = createSubjectRow(subject); if(row) subjectsListWrapper.appendChild(row); });
            noSubjectsMessage.hidden = true;
        } else { noSubjectsMessage.hidden = false; }
        subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = validSubjectsData.some(s => s.id === cb.value); });
    };
    const openSubjectModal = () => { /* ... (logic không đổi) ... */
         const validSubjectsData = Array.isArray(currentUserSubjects) ? currentUserSubjects : [];
         subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = validSubjectsData.some(s => s.id === cb.value); });
         const focusTarget = subjectForm.querySelector('input[type="checkbox"]') || subjectForm.querySelector('button[type="submit"]');
         previouslyFocusedElementDash = openModal(modal, focusTarget);
    };
    const closeSubjectModal = () => { closeModal(modal, previouslyFocusedElementDash); };
    openModalBtn.addEventListener('click', openSubjectModal);
    closeModalElements.forEach(el => el.addEventListener('click', closeSubjectModal));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal?.classList.contains('is-visible')) closeSubjectModal(); });
    subjectForm.addEventListener('submit', (event) => { /* ... (logic không đổi) ... */
        event.preventDefault();
        const checked = subjectForm.querySelectorAll('input[name="subjects"]:checked');
        const newData = Array.from(checked).map(cb => ({ id: cb.value, label: cb.dataset.label || cb.value }));
        currentUserSubjects = newData;
        if (setUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, currentUserSubjects)) { // Vẫn lưu subject preferences vào localStorage
            renderSubjectsList(currentUserSubjects);
        }
        closeSubjectModal();
    });
    renderSubjectsList(currentUserSubjects);
}

// ===== PAPERS PAGE LOGIC =====
function setupPapersPage_Dynamic() {
    // TODO: Cập nhật paperStatuses từ backend thay vì localStorage
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
    // const paperStatuses = getStorageItem(getUserStorageKey(BASE_STORAGE_KEYS.PAPER_STATUSES), {}); // Sẽ thay thế bằng fetch từ backend
    let paperStatuses = {}; // Placeholder, sẽ được fetch

    async function fetchPaperStatuses() {
        const userId = getCurrentUsername();
        if (!userId) return {};
        // TODO: Implement backend action `get_all_user_paper_statuses`
        // try {
        //     const response = await fetch(`/.netlify/functions/backend?action=get_all_user_paper_statuses&userId=${userId}`);
        //     const data = await response.json();
        //     if (response.ok && data.statuses) return data.statuses;
        //     return {};
        // } catch (e) { return {}; }
        return {}; // Mock
    }

    function createPaperCard(paper) { /* ... (logic không đổi, dùng paperStatuses đã fetch) ... */
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
    function renderPapers(papersToRender) { /* ... (logic không đổi) ... */
        papersListContainer.innerHTML = '';
        papersListContainer.appendChild(noPapersMessage);
        noPapersMessage.hidden = true;
        if (!Array.isArray(papersToRender) || papersToRender.length === 0) {
            noPapersMessage.textContent = "No past papers found matching your filters.";
            noPapersMessage.hidden = false;
            return;
        }
        const papersByYear = papersToRender.reduce((acc, paper) => {
            const year = paper.year || 'Unknown Year'; if (!acc[year]) acc[year] = []; acc[year].push(paper); return acc;
        }, {});
        const sortedYears = Object.keys(papersByYear).sort((a, b) => {
            const yearA = parseInt(a); const yearB = parseInt(b);
            if (isNaN(yearA) && isNaN(yearB)) return 0; if (isNaN(yearA)) return 1; if (isNaN(yearB)) return -1; return yearB - yearA;
        });
        let papersFound = false;
        sortedYears.forEach(year => {
            const yearGroupSection = document.createElement('section'); yearGroupSection.className = 'papers-year-group'; yearGroupSection.dataset.year = year;
            const yearTitle = document.createElement('h3'); yearTitle.className = 'year-group__title'; yearTitle.textContent = year;
            const papersGridDiv = document.createElement('div'); papersGridDiv.className = 'papers-grid';
            papersByYear[year].sort((a, b) => {
                 const sessionOrder = { 'FM': 1, 'MJ': 2, 'ON': 3 }; const sessionA = (a.sessionCode || '').toUpperCase(); const sessionB = (b.sessionCode || '').toUpperCase(); if (sessionOrder[sessionA] !== sessionOrder[sessionB]) return (sessionOrder[sessionA] || 99) - (sessionOrder[sessionB] || 99); const paperNumA = parseInt(a.paperNumber) || 99; const paperNumB = parseInt(b.paperNumber) || 99; if (paperNumA !== paperNumB) return paperNumA - paperNumB; const variantA = a.variant || ''; const variantB = b.variant || ''; return variantA.localeCompare(variantB);
            }).forEach(paper => {
                const paperCard = createPaperCard(paper); if (paperCard) { papersGridDiv.appendChild(paperCard); papersFound = true; }
            });
            if (papersGridDiv.hasChildNodes()) { yearGroupSection.appendChild(yearTitle); yearGroupSection.appendChild(papersGridDiv); papersListContainer.appendChild(yearGroupSection); }
        });
        noPapersMessage.hidden = papersFound;
        if (!papersFound) { noPapersMessage.textContent = "No past papers found matching your filters."; }
    }
    async function applyFiltersAndRender() { /* ... (logic không đổi, dùng paperStatuses đã fetch) ... */
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

    if (subjectFilterFromUrl) {
        const subjectData = ALL_PAPER_DATA_SOURCE.find(p => p.subjectId === subjectFilterFromUrl);
        mainTitle.textContent = subjectData ? `${subjectData.subjectName || 'Subject'} (${subjectData.subjectCode || 'Code'}) Papers` : `Papers (Unknown Subject)`;
    } else { mainTitle.textContent = `All Past Papers`; }

    applyFiltersBtn.addEventListener('click', applyFiltersAndRender);

    // Fetch statuses then render
    fetchPaperStatuses().then(statuses => {
        paperStatuses = statuses;
        applyFiltersAndRender(); // Initial Render after fetching statuses
    });
}

// ===== ATTEMPT PAGE LOGIC =====
async function setupAttemptContentViewer() {
    // TODO: Sẽ được cập nhật để lấy dữ liệu từ backend
    console.log("Setting up Attempt Page Content Viewer...");
    const viewer = document.getElementById('paper-viewer-content');
    const paperV = document.getElementById('past-paper-view');
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

    if (!viewer || !paperCodeHeading || !retakeButton) {
        console.warn("Attempt page core elements missing.");
        if(paperCodeHeading) paperCodeHeading.textContent = "Error Loading Attempt";
        return;
    }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();

    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading attempt details...", "info");
        // Hàm này sẽ được định nghĩa ở phần sau
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl);

        if (attemptData) {
            const displayPaperId = attemptData.paperId || paperIdFromUrl;
            paperCodeHeading.textContent = formatPaperCode(displayPaperId);
            document.title = `${formatPaperCode(displayPaperId)} - Attempt - PaperBuddy`;
            if(retakeButton) retakeButton.href = `test.html?paperId=${encodeURIComponent(displayPaperId || 'unknown-paper')}`;

            if (gradeValueElement) gradeValueElement.textContent = attemptData.grade || 'N/A';
            if (durationValueElement) durationValueElement.textContent = formatTime(attemptData.timeSpent || 0);
            if (rawScoreValueElement) rawScoreValueElement.textContent = `${attemptData.score || 0} / 60`;

            if (feedV) feedV.innerHTML = `<p style="padding: 1rem;"><strong>Feedback:</strong></p><p style="padding: 0 1rem 1rem 1rem;">${attemptData.feedback?.replace(/\n/g, '<br>') || 'No feedback available.'}</p>`;
            if (outV) outV.innerHTML = `<p style="padding: 1rem;"><strong>Outline:</strong></p><pre style="padding: 0 1rem 1rem 1rem; white-space: pre-wrap;">${attemptData.outline || 'No outline available.'}</pre>`;

            // Placeholder cho paper content - sau này có thể lấy link ảnh paper từ attemptData nếu có
            if (paperV) { /* Giữ nguyên placeholder images */ }

        } else {
            paperCodeHeading.textContent = "Could not load attempt.";
            displayUserMessage("Failed to load attempt details.", "error");
            if(retakeButton) retakeButton.style.display = 'none';
        }
    } else {
        paperCodeHeading.textContent = "Invalid Attempt or Not Logged In";
        if (!validAttemptId) displayUserMessage("Attempt ID is missing or invalid in the URL.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in to view attempts.", "error");
        if(retakeButton) retakeButton.style.display = 'none';
    }

    // View Switching Logic (giữ nguyên)
    if (paperV && feedV && outV && paperB && feedB && outB) {
        const views = [paperV, feedV, outV]; const buttons = [paperB, feedB, outB];
        const showView = (viewToShow) => { views.forEach(view => { view.hidden = (view !== viewToShow); }); if(viewer) viewer.scrollTop = 0; };
        const setActiveButton = (buttonToActivate) => { buttons.forEach(btn => { btn.setAttribute('aria-current', btn === buttonToActivate ? 'page' : 'false'); }); };
        buttons.forEach((button, index) => { button.addEventListener('click', (e) => { e.preventDefault(); showView(views[index]); setActiveButton(button); }); });
        showView(paperV); setActiveButton(paperB); // Default view
    }


    // Retake Modal Logic (giữ nguyên)
    if (retakeModal && confirmRetakeBtn && retakeModalCloseElements && retakeButton) {
        let previouslyFocusedElementRetake = null; let targetRetakeUrl = '';
        const openRetakeModal = () => { previouslyFocusedElementRetake = document.activeElement; openModal(retakeModal, confirmRetakeBtn); };
        const closeRetakeModal = () => { closeModal(retakeModal, previouslyFocusedElementRetake); };
        retakeButton.addEventListener('click', (event) => {
            event.preventDefault(); targetRetakeUrl = retakeButton.href;
            if (targetRetakeUrl && !targetRetakeUrl.includes('unknown-paper')) { openRetakeModal(); }
            else { console.error("Cannot retake, paper ID unknown:", targetRetakeUrl); displayUserMessage("Could not determine the paper for retake.", "error"); }
        });
        confirmRetakeBtn.addEventListener('click', () => {
            closeRetakeModal();
            setTimeout(() => { if(targetRetakeUrl && !targetRetakeUrl.includes('unknown-paper')) { window.location.href = targetRetakeUrl; } else { displayUserMessage("Error starting retake.", "error");} }, 100);
        });
        retakeModalCloseElements.forEach(el => el.addEventListener('click', closeRetakeModal));
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && retakeModal?.classList.contains('is-visible')) closeRetakeModal(); });
    }
}

// ===== TEST PAGE LOGIC (CẬP NHẬT CHÍNH Ở ĐÂY) =====
async function setupTestPage() {
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
        console.warn("Test page elements missing. Aborting setup.");
        if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading Test";
        return;
    }

    const { paperId, validPaperId } = getPaperInfoFromUrl();
    if (!validPaperId) {
        paperCodeHeading.textContent = "Invalid Paper ID";
        document.title = `Invalid Test - PaperBuddy`;
        timerButton.disabled = true; timerButton.textContent = "Invalid Paper";
        displayUserMessage("Paper ID is missing or invalid for this test session.", "error");
        return;
    }
    paperCodeHeading.textContent = formatPaperCode(paperId);
    document.title = `${formatPaperCode(paperId)} - Test - PaperBuddy`;

    let timerInterval = null; let secondsElapsed = 0; let isTimerRunning = false; let previouslyFocusedElementTest = null;

    const updateDisplay = () => { if(timerDisplay) timerDisplay.textContent = formatTime(secondsElapsed); };
    const startTimer = () => { /* ... (logic không đổi) ... */
        if (isTimerRunning) return;
        isTimerRunning = true; secondsElapsed = 0; updateDisplay();
        timerInterval = setInterval(() => { secondsElapsed++; updateDisplay(); }, 1000);
        timerButton.textContent = 'Submit'; timerButton.dataset.action = 'submit';
        answerTextarea.disabled = false; fileUploadInput.disabled = false;
        if (!fileUploadInput.files[0]) { answerTextarea.placeholder = "Type your final answer here..."; }
    };
    const stopTimer = () => { clearInterval(timerInterval); isTimerRunning = false; };
    const openTestModal = () => { /* ... (logic không đổi) ... */
        const answerText = answerTextarea.value.trim(); const uploadedFile = fileUploadInput.files[0];
        if (!answerText && !uploadedFile) { displayUserMessage("Please enter an answer or upload a file before submitting.", "warning"); answerTextarea.focus(); return; }
        previouslyFocusedElementTest = document.activeElement; openModal(confirmModal, confirmSubmitBtn);
    };
    const closeTestModal = () => { closeModal(confirmModal, previouslyFocusedElementTest); };

    timerButton.addEventListener('click', () => {
        const action = timerButton.dataset.action; if (action === 'start') startTimer(); else if (action === 'submit') openTestModal();
    });
    fileUploadInput.addEventListener('change', () => { /* ... (logic không đổi) ... */
        const file = fileUploadInput.files[0];
        if (file) {
            fileUploadFilename.textContent = `Selected file: ${file.name}`;
            answerTextarea.disabled = true; answerTextarea.placeholder = "File selected. Clear selection to type answer."; answerTextarea.value = "";
        } else {
            fileUploadFilename.textContent = '';
            if (isTimerRunning) { answerTextarea.disabled = false; answerTextarea.placeholder = "Type your final answer here..."; }
            else { answerTextarea.disabled = true; answerTextarea.placeholder = "Start the exam to type or upload."; }
        }
    });

    // --- SUBMIT LOGIC (ĐÃ CẬP NHẬT) ---
    confirmSubmitBtn.addEventListener('click', async () => {
        if (isTimerRunning) stopTimer();

        const currentUserId = getCurrentUsername();
        if (!currentUserId) {
            displayUserMessage("You must be logged in to submit an attempt.", "error");
            triggerLoginModal(null, confirmSubmitBtn); // Mở modal login
            closeTestModal();
            return;
        }
        if (!validPaperId) { // Kiểm tra lại paperId
            displayUserMessage("Cannot submit: Invalid Paper ID.", "error");
            closeTestModal();
            return;
        }

        const answerText = answerTextarea.value.trim();
        const localFileToUpload = fileUploadInput.files[0];
        let fileUploadResult = null;

        // 1. Upload file (nếu có)
        if (localFileToUpload) {
            // Disable submit button while uploading
            confirmSubmitBtn.disabled = true;
            confirmSubmitBtn.textContent = "Uploading...";
            fileUploadResult = await uploadFileToFirebase(localFileToUpload, currentUserId, paperId);
            confirmSubmitBtn.disabled = false; // Re-enable button
            confirmSubmitBtn.textContent = "Confirm Submit";

            if (!fileUploadResult) {
                displayUserMessage("File upload failed. Submission canceled.", "error");
                // Không đóng modal để user có thể thử lại hoặc sửa lỗi
                return; // Dừng, không submit nếu upload lỗi
            }
        }

        // 2. Chuẩn bị payload
        const submissionPayload = {
            action: 'submit_attempt',
            payload: {
                paperId: paperId,
                userId: currentUserId,
                answerText: answerText,
                fileUrl: fileUploadResult ? fileUploadResult.url : null,
                fileName: fileUploadResult ? fileUploadResult.name : null,
                timeSpent: secondsElapsed
            }
        };

        // 3. Gọi Netlify Function
        try {
            displayUserMessage("Submitting your attempt to be graded...", "info", 10000);
            confirmSubmitBtn.disabled = true; // Disable button during API call
            confirmSubmitBtn.textContent = "Submitting...";

            const response = await fetch('/.netlify/functions/backend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionPayload)
            });
            const data = await response.json();

            confirmSubmitBtn.disabled = false; // Re-enable
            confirmSubmitBtn.textContent = "Confirm Submit";

            if (!response.ok) {
                console.error('Submission failed on server:', data.error, data.details);
                displayUserMessage(`Submission error: ${data.error || 'Unknown server error.'}`, 'error');
                // Không đóng modal để user thấy lỗi
                return;
            }

            // Thành công (response.ok là true)
            console.log('Attempt submitted and graded:', data);
            // data bây giờ chứa attemptId, grade, score, feedback từ backend
            // Chuyển hướng đến result.html với attemptId và paperId từ response
            const resultUrl = `result.html?attemptId=${data.attemptId}&paperId=${data.paperId}`;
            displayUserMessage("Submission successful! Redirecting to results...", "success");
            setTimeout(() => { window.location.href = resultUrl; }, 1500); // Delay để user thấy message

        } catch (error) {
            console.error('Error submitting attempt via fetch:', error);
            displayUserMessage('Network error or server issue during submission. Please try again.', 'error');
            confirmSubmitBtn.disabled = false;
            confirmSubmitBtn.textContent = "Confirm Submit";
            // Không đóng modal
        } finally {
            // Không tự động đóng modal ở đây nữa, để user thấy thông báo lỗi nếu có
            // closeTestModal(); //  Chỉ đóng nếu thành công ở trên
        }
    });

    modalCloseElements.forEach(el => el.addEventListener('click', closeTestModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmModal?.classList.contains('is-visible')) closeTestModal(); });
    updateDisplay();
    answerTextarea.disabled = true; fileUploadInput.disabled = true; answerTextarea.placeholder = "Start the exam to type or upload.";
}

// ===== RESULT PAGE LOGIC =====
async function setupResultPage() {
    // TODO: Sẽ được cập nhật đầy đủ để lấy và hiển thị dữ liệu từ backend
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

    if (!paperCodeHeading || !durationElement || !gradeValueElement || !rawScoreElement) {
        console.warn("Result page core display elements missing.");
        if(paperCodeHeading) paperCodeHeading.textContent = "Error Loading Result";
        return;
    }

    const { attemptId, paperId: paperIdFromUrl, validAttemptId } = getPaperInfoFromUrl();
    const currentUserId = getCurrentUsername();

    if (validAttemptId && currentUserId) {
        displayUserMessage("Loading result details...", "info");
        const attemptData = await fetchAttemptDetails(attemptId, currentUserId, paperIdFromUrl); // Hàm này sẽ được tạo

        if (attemptData) {
            const displayPaperId = attemptData.paperId || paperIdFromUrl;
            paperCodeHeading.textContent = formatPaperCode(displayPaperId);
            document.title = `${formatPaperCode(displayPaperId)} - Result - PaperBuddy`;

            gradeValueElement.textContent = attemptData.grade || 'N/A';
            durationElement.textContent = formatTime(attemptData.timeSpent || 0);
            rawScoreElement.textContent = `${attemptData.score || 0} / 60`;

            if (attemptData.sectionScores) {
                if (secAScoreEl) secAScoreEl.textContent = attemptData.sectionScores.sectionA || 'N/A';
                if (secBScoreEl) secBScoreEl.textContent = attemptData.sectionScores.sectionB || 'N/A';
                if (secCScoreEl) secCScoreEl.textContent = attemptData.sectionScores.sectionC || 'N/A';
            } else {
                if (secAScoreEl) secAScoreEl.textContent = 'N/A';
                if (secBScoreEl) secBScoreEl.textContent = 'N/A';
                if (secCScoreEl) secCScoreEl.textContent = 'N/A';
            }
            // TODO: Populate feedback and outline if these are to be shown on result page directly
            // Otherwise, they are on attempt.html

        } else {
            paperCodeHeading.textContent = "Could not load result details.";
            displayUserMessage("Failed to load result details. The attempt may not exist or an error occurred.", "error");
            // Disable delete button if data load fails
            if (deleteButton) deleteButton.disabled = true;
        }
    } else {
        paperCodeHeading.textContent = "Invalid Result or Not Logged In";
        if (!validAttemptId) displayUserMessage("Attempt ID is missing or invalid in the URL.", "error");
        if (!currentUserId) displayUserMessage("You must be logged in to view results.", "error");
        if (deleteButton) deleteButton.disabled = true;
    }

    // Delete Button Logic (cần cập nhật để gọi backend)
    if (deleteButton && deleteModal && confirmDeleteBtn && modalCloseElements) {
        let previouslyFocusedElementResult = null;
        const openDeleteModal = () => { previouslyFocusedElementResult = document.activeElement; openModal(deleteModal, confirmDeleteBtn); };
        const closeDeleteModal = () => { closeModal(deleteModal, previouslyFocusedElementResult); };

        deleteButton.addEventListener('click', () => {
            if (validAttemptId && currentUserId) openDeleteModal();
            else displayUserMessage("Cannot delete: Attempt ID missing or not logged in.", "error");
        });

        confirmDeleteBtn.addEventListener('click', async () => {
            // Logic gọi backend để xóa (sẽ hoàn thiện ở giai đoạn sau)
            // ...
            displayUserMessage("Delete functionality will be fully implemented soon.", "info");
            closeDeleteModal();
        });
        modalCloseElements.forEach(el => el.addEventListener('click', closeDeleteModal));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && deleteModal?.classList.contains('is-visible')) closeDeleteModal(); });
    }


    // Placeholder Download Listeners
    const downloadFeedbackBtn = document.getElementById('download-feedback-btn');
    const downloadOutlineBtn = document.getElementById('download-outline-btn');
    const placeholderDownloadHandler = (e, type) => {
        e.preventDefault();
        console.log(`${type} download feature not implemented yet.`);
        displayUserMessage(`Download ${type} feature not implemented yet.`, 'info');
    };
    if (downloadFeedbackBtn) downloadFeedbackBtn.addEventListener('click', (e) => placeholderDownloadHandler(e, 'feedback'));
    if (downloadOutlineBtn) downloadOutlineBtn.addEventListener('click', (e) => placeholderDownloadHandler(e, 'outline'));
}


// --- HÀM CHUNG ĐỂ LẤY CHI TIẾT ATTEMPT TỪ BACKEND ---
async function fetchAttemptDetails(attemptId, userId, paperIdForLog) {
    if (!attemptId || !userId) {
        console.error("Missing attemptId or userId to fetch details.");
        return null;
    }
    try {
        const response = await fetch(`/.netlify/functions/backend?action=get_attempt_details&attemptId=${encodeURIComponent(attemptId)}&userId=${encodeURIComponent(userId)}&paperId=${encodeURIComponent(paperIdForLog || '')}`);
        // Thêm paperIdForLog vào query để backend có thể log nếu cần, nhưng backend chủ yếu dùng attemptId và userId để query
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch attempt details from server:', data.error, data.details);
            return null;
        }
        return data; // data chứa toàn bộ thông tin attempt từ Firestore
    } catch (error) {
        console.error('Network error fetching attempt details:', error);
        return null;
    }
}