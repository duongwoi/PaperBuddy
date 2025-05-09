"use strict";

// ===== USER AUTH & DATA SCOPING =====
const AUTH_KEY = 'paperBuddyLoggedInUser';

function getCurrentUsername() {
    return localStorage.getItem(AUTH_KEY);
}

function isUserLoggedIn() {
    return !!getCurrentUsername(); // True if username exists
}

function loginUser(username) {
    if (!username) return false;
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return false; // Prevent empty username
    localStorage.setItem(AUTH_KEY, trimmedUsername);
    console.log(`User "${trimmedUsername}" logged in.`);
    return true;
}

function logoutUser() {
    const username = getCurrentUsername();
    if (username) {
        localStorage.removeItem(AUTH_KEY);
        // Clear user-specific data as well upon logout for cleaner state? Optional.
        // localStorage.removeItem(getUserStorageKey(BASE_STORAGE_KEYS.USER_SUBJECTS));
        // localStorage.removeItem(getUserStorageKey(BASE_STORAGE_KEYS.PAPER_STATUSES));
        // localStorage.removeItem(getUserStorageKey(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS));
        console.log(`User "${username}" logged out.`);
    }
}

// Function to get the correct storage key for the current user
function getUserStorageKey(baseKey) {
    const username = getCurrentUsername();
    if (!username) {
        // console.warn("User not logged in, cannot generate user-specific storage key.");
        return null;
    }
    return `${baseKey}_user_${username}`;
}

// --- LocalStorage Helpers with Enhanced Logging ---
function getStorageItem(key, defaultValue = {}) {
    if (!key) return defaultValue; // Added check for null key
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading or parsing localStorage key “${key}”. Returning default value.`, e);
        // Consider removing the corrupted item to prevent repeated errors
        try { localStorage.removeItem(key); } catch (removeError) { /* Ignore secondary error */ }
        return defaultValue;
    }
}
function setStorageItem(key, value) {
    if (!key) {
        console.error("Error setting localStorage: Key is null or undefined.");
        return false; // Indicate failure
    }
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true; // Indicate success
    } catch (e) {
        console.error(`Error setting localStorage key “${key}”. Data might not be saved. Error:`, e);
        // Replace alert with console error for less user interruption
        // alert(`Error saving data for ${key}. Your progress might not be saved correctly. LocalStorage might be full.`);
        displayUserMessage(`Error saving preferences (${key}). LocalStorage might be full or restricted.`, 'error'); // Use new message function
        return false; // Indicate failure
    }
}

// Modified Storage Functions to use user-specific keys
function getUserData(baseKey, defaultValue = {}) {
    const userKey = getUserStorageKey(baseKey);
    // No need to check userKey here, getStorageItem handles null key
    return getStorageItem(userKey, defaultValue);
}

function setUserData(baseKey, value) {
    const userKey = getUserStorageKey(baseKey);
    if (!userKey) {
        console.error(`Error saving user data (${baseKey}): User not logged in.`);
        // Don't alert here, failure is handled in setStorageItem if needed
        return false;
    }
    return setStorageItem(userKey, value); // Return success/failure from setStorageItem
}


// Constants for Base Storage Keys
const BASE_STORAGE_KEYS = {
    USER_SUBJECTS: 'paperBuddyUserSubjects',
    PAPER_STATUSES: 'paperBuddyPaperStatuses',
    ATTEMPT_DURATIONS: 'paperBuddyAttemptDurations'
};

// ===== UTILITY FUNCTIONS =====

// --- Time Formatting ---
const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00"; // Use colon as separator
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = Math.floor(totalSeconds % 60);
    // Return with colons for standard time display
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// --- URL Parameter Parsing Helper --- (NEW)
function getPaperInfoFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');
    const paperId = urlParams.get('paperId'); // Use consistent naming

    const validAttemptId = attemptId && typeof attemptId === 'string' && attemptId.trim() !== '';
    const validPaperId = paperId && typeof paperId === 'string' && paperId.trim() !== '' && paperId !== 'unknown' && paperId !== 'unknown-paper';

    return {
        attemptId: validAttemptId ? attemptId : null,
        paperId: validPaperId ? paperId : null, // Return null if invalid
        validAttemptId,
        validPaperId
    };
}

// --- Paper Code Formatting Helper --- (NEW)
function formatPaperCode(paperId) {
    if (!paperId || typeof paperId !== 'string') {
        return "Unknown Paper";
    }
    // Example format: econ-9708-11-mj-25
    const parts = paperId.split('-');
    if (parts.length >= 5) {
        // Combine relevant parts: subjectCode/paperNumVariant/session/yearYY
        const subjectCode = parts[1] || '????';
        const paperNum = parts[2] || '?';
        // Variant might be combined with paper number in some systems or part 3
        // Assuming variant is part of paperNum (like '11', '12', '21') or non-existent
        // Adjust if variant is explicitly part 3, e.g., 9708/1/1/MJ/25
        const session = (parts[3] || '??').toUpperCase();
        const yearYY = parts[4] ? String(parts[4]).slice(-2) : '??';
        return `${subjectCode}/${paperNum}/${session}/${yearYY}`; // Simplified format example
    } else {
        return paperId; // Fallback to full ID if format is unexpected
    }
}

// --- User Message Display Helper --- (NEW - Simple Console Log Version)
// Can be expanded later to show messages in a dedicated UI element
function displayUserMessage(message, type = 'info') {
    switch (type) {
        case 'error':
            console.error("User Message:", message);
            // TODO: Optionally append to a specific error div in the HTML
            break;
        case 'warning':
            console.warn("User Message:", message);
            break;
        case 'success':
            console.log("User Message:", message);
            break;
        default:
            console.log("User Message:", message);
    }
    // Example: To display in UI, you might do:
    // const messageArea = document.getElementById('user-message-area');
    // if (messageArea) {
    //     messageArea.textContent = message;
    //     messageArea.className = `user-message user-message--${type}`;
    //     messageArea.hidden = false;
    //     // Optionally hide after a delay
    //     // setTimeout(() => { messageArea.hidden = true; }, 5000);
    // }
}


// ===== GLOBAL DATA SOURCE (Mock - Replace with API Fetch eventually) =====
const ALL_PAPER_DATA_SOURCE = [
    // ... (data remains the same) ...
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


// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {

    console.log("PaperBuddy Script Loaded");

    // --- General Setup ---
    setupHeaderScroll();
    updateHeaderUI(); // Update header based on login state on EVERY page load
    setupLoginModal(); // Setup modal listeners (needed for header triggers AND login form)
    setupLoginRequiredChecks(); // Add global checks for nav/links needing login

    // --- Determine Current Page ---
    const pathname = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is "/"

    // --- Page Specific Setup ---
    // Redirect logic remains the same: If not logged in and not on index, go to index.
    if (pathname !== 'index.html' && !isUserLoggedIn()) {
        console.log(`Page ${pathname}: User not logged in. Redirecting to landing page.`);
        // Show alert only for pages requiring specific actions (test, attempt, result)
        if (['attempt.html', 'test.html', 'result.html'].includes(pathname)) {
            alert(`Please log in to access ${pathname.split('.')[0]}.`);
        }
        window.location.href = 'index.html';
        return; // Stop further execution on this page if redirecting
    }

    // If logged in (or on index page), proceed with page-specific setup
    switch (pathname) {
        case 'index.html':
            // No specific setup needed beyond global checks for index page now
            break;
        case 'dashboard.html':
            setupDashboardPage();
            break;
        case 'papers.html':
            setupPapersPage_Dynamic();
            break;
        case 'attempt.html':
            setupAttemptContentViewer();
            break;
        case 'test.html':
            setupTestPage();
            break;
        case 'result.html':
            setupResultPage();
            break;
        default:
            console.warn(`No specific setup found for page: ${pathname}`);
    }

}); // End DOMContentLoaded


/* ===== GENERAL FUNCTIONS (Header Scroll, Modals) ===== */
// --- Header Scroll ---
function setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    const scrollThreshold = 50;
    const addHeaderShadow = () => {
        header.classList.toggle('header--scrolled', window.scrollY >= scrollThreshold);
    };
    window.addEventListener('scroll', addHeaderShadow, { passive: true });
    addHeaderShadow(); // Call once initially
}

// --- Modal Focus Trap ---
 function trapFocus(event, modalElement) {
    if (!modalElement || !modalElement.classList.contains('is-visible') || event.key !== 'Tab') return;
    const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) {
        event.preventDefault(); // Prevent tabbing out
        return;
    }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
        }
    } else { // Tab
        if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
        }
    }
}

// --- Modal Open/Close ---
function openModal(modalElement, focusElement) {
    if (!modalElement) return null;
    const previouslyFocused = document.activeElement; // Store element that HAD focus
    modalElement.hidden = false;
    void modalElement.offsetWidth; // Trigger reflow
    modalElement.classList.add('is-visible');
    modalElement.setAttribute('aria-hidden', 'false');

    const elementToFocus = focusElement && modalElement.contains(focusElement) && !focusElement.disabled
        ? focusElement
        : modalElement.querySelector('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');

    elementToFocus?.focus(); // Focus the target inside the modal

    if (modalElement._trapFocusListener) { document.removeEventListener('keydown', modalElement._trapFocusListener); }
    const trapFocusListener = (e) => trapFocus(e, modalElement);
    modalElement._trapFocusListener = trapFocusListener; // Store reference on the modal
    document.addEventListener('keydown', modalElement._trapFocusListener);

    return previouslyFocused; // Return element that HAD focus before opening
}

function closeModal(modalElement, previouslyFocusedElement) {
     if (!modalElement || !modalElement.classList.contains('is-visible')) return;

     modalElement.classList.remove('is-visible');
     modalElement.setAttribute('aria-hidden', 'true');

     // Remove the focus trap listener
     if (modalElement._trapFocusListener) {
         document.removeEventListener('keydown', modalElement._trapFocusListener);
         delete modalElement._trapFocusListener;
     }

     // Use transitionend to hide the modal and restore focus *after* animation
     const handleTransitionEnd = (event) => {
         // Ensure the event is for the modal itself, not a child element's transition
         if (event.target === modalElement) {
             modalElement.hidden = true;
             // Restore focus carefully
             if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function' && document.body.contains(previouslyFocusedElement)) {
                  const style = window.getComputedStyle(previouslyFocusedElement);
                 // Check if element is still visible and focusable
                 if (style.display !== 'none' && style.visibility !== 'hidden' && !previouslyFocusedElement.disabled && previouslyFocusedElement.tabIndex !== -1) {
                      previouslyFocusedElement.focus({ preventScroll: true }); // preventScroll helps avoid page jumps
                 }
             }
             modalElement.removeEventListener('transitionend', handleTransitionEnd); // Clean up listener
         }
     };
     modalElement.addEventListener('transitionend', handleTransitionEnd);

     // Fallback timeout in case transitionend doesn't fire
     setTimeout(() => {
         // If the modal is still visible (transitionend didn't fire), force close and focus restore
         if (!modalElement.hidden && modalElement.getAttribute('aria-hidden') === 'true') {
              handleTransitionEnd({ target: modalElement }); // Manually call handler
         }
     }, 500); // 500ms should be longer than the CSS transition (0.3s)
}


/* ===== LOGIN / AUTH FUNCTIONS ===== */

// --- Update Header UI ---
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

    if (loggedIn && usernameDisplay) {
        usernameDisplay.textContent = username;
    }

    // Logout button listener management
    if (logoutBtn) {
        // Remove existing listener before adding (safer)
        const newLogoutBtn = logoutBtn.cloneNode(true); // Clone to remove listeners
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

        if (loggedIn) {
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                updateHeaderUI();
                window.location.href = 'index.html'; // Redirect home after logout
            });
        }
    }
}

// --- Setup Login Modal ---
function setupLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) { console.error("Login modal element (#login-modal) not found!"); return; }

    // Add listeners specifically for the header login/join buttons
    const openModalTriggers = document.querySelectorAll('[data-open-modal="login-modal"]');
    openModalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            triggerLoginModal(event, trigger); // Use the helper
        });
    });

    const closeModalElements = loginModal.querySelectorAll('[data-close-modal], .modal__close-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password'); // Keep reference if needed later
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

        console.log(`Attempting login/signup for: ${username}`);
        const success = loginUser(username);

        if (success) {
            closeLoginModal();
            updateHeaderUI();
            // Use timeout to ensure modal closes visually before reload
            setTimeout(() => window.location.reload(), 50);
        } else {
            errorMessage.textContent = "Login failed (mock). Please enter a valid username.";
            errorMessage.hidden = false;
        }
    });
}


// --- Show Login Modal Helper ---
function triggerLoginModal(event, triggerElement) {
    console.log("Login required. Triggered by:", triggerElement || event?.currentTarget);
    if (event) {
        event.preventDefault(); // Stop default navigation/action
    }

    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('login-username');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');

    if (!loginModal || !usernameInput || !loginForm || !errorMessage) {
         console.error("Login modal or its inner elements not found!");
         // Use the new message display instead of alert
         displayUserMessage("Login component error. Please refresh the page.", "error");
         return;
    }

    loginForm.reset();
    errorMessage.hidden = true;
    const focusRestoreTarget = triggerElement || event?.currentTarget || document.body;
    const elementThatWasFocused = openModal(loginModal, usernameInput);
    loginModal._focusRestoreElement = focusRestoreTarget || elementThatWasFocused;
}

// --- Setup Login Required Checks ---
function setupLoginRequiredChecks() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;

    const requiresLoginSelectors = [
        '.nav__list a[href="dashboard.html"]',
        '.nav__list a[href="papers.html"]',
        '.hero__search-button',
        '.hero__search-form',
        '.subjects__item',
        '.cta__container a.button'
    ];

    document.querySelectorAll(requiresLoginSelectors.join(', ')).forEach(element => {
        const handler = (event) => {
            if (!isUserLoggedIn()) {
                const trigger = (element.tagName === 'FORM') ? element.querySelector('button[type="submit"], input[type="submit"]') : event.currentTarget;
                triggerLoginModal(event, trigger || element); // Pass form's button or the element itself
            }
            // If logged in, default action proceeds
        };

        if (element.tagName === 'FORM') {
            element.addEventListener('submit', handler);
        } else if (element.tagName === 'A' || element.tagName === 'BUTTON') {
            element.addEventListener('click', handler);
        }
    });
}


/* ===== DASHBOARD PAGE LOGIC ===== */
function setupDashboardPage() {
    console.log("Setting up Dashboard Page...");
    const username = getCurrentUsername(); // Assumes user is logged in

    const modal = document.getElementById('subject-modal');
    const openModalBtn = document.getElementById('edit-subjects-btn');
    const closeModalElements = modal?.querySelectorAll('[data-close-modal], .modal__close-btn');
    const subjectForm = document.getElementById('subject-selection-form');
    const subjectsListWrapper = document.getElementById('subjects-list-wrapper');
    const noSubjectsMessage = document.getElementById('no-subjects-message');
    const welcomeTitle = document.querySelector('.welcome__title');

    if (!modal || !openModalBtn || !closeModalElements || !subjectForm || !subjectsListWrapper || !noSubjectsMessage || !welcomeTitle) {
        console.warn("Dashboard page missing essential elements. Aborting setup.");
        if(subjectsListWrapper) subjectsListWrapper.innerHTML = '<p class="no-results-message">Error loading dashboard components.</p>';
        return;
    }

    welcomeTitle.textContent = `Hi, ${username}`;
    let previouslyFocusedElementDash = null;
    let currentUserSubjects = getUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, []);
    const paperStatuses = getUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, {});

    function calculateSubjectStats(subjectId) {
        if (typeof ALL_PAPER_DATA_SOURCE === 'undefined' || !Array.isArray(ALL_PAPER_DATA_SOURCE)) return { progress: 0, grade: 'N/A' };
        const subjectPapers = ALL_PAPER_DATA_SOURCE.filter(p => p.subjectId === subjectId);
        const totalPapers = subjectPapers.length;
        if (totalPapers === 0) return { progress: 0, grade: 'N/A' };
        let doneCount = 0;
        const validPaperStatuses = typeof paperStatuses === 'object' && paperStatuses !== null ? paperStatuses : {};
        subjectPapers.forEach(paper => { if (validPaperStatuses[paper.id]?.status === 'done') { doneCount++; } });
        const progress = totalPapers > 0 ? Math.round((doneCount / totalPapers) * 100) : 0;
        let grade = 'N/A';
        if (doneCount > 0) {
             if (progress >= 80) grade = 'A'; else if (progress >= 65) grade = 'B'; else if (progress >= 50) grade = 'C'; else if (progress >= 40) grade = 'D'; else grade = 'E';
        }
        return { progress, grade };
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
        const items = subjectsListWrapper.querySelectorAll('.subjects-list__item');
        items.forEach(item => item.remove());
        const validSubjectsData = Array.isArray(subjectsData) ? subjectsData : [];
        noSubjectsMessage.hidden = validSubjectsData.length > 0;
        if (validSubjectsData.length > 0) {
            validSubjectsData.forEach(subject => { const row = createSubjectRow(subject); if(row) subjectsListWrapper.appendChild(row); });
            noSubjectsMessage.hidden = true;
        } else {
             noSubjectsMessage.hidden = false;
        }
        subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = validSubjectsData.some(s => s.id === cb.value); });
    };

    const openSubjectModal = () => {
         const validSubjectsData = Array.isArray(currentUserSubjects) ? currentUserSubjects : [];
         subjectForm.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = validSubjectsData.some(s => s.id === cb.value); });
         const focusTarget = subjectForm.querySelector('input[type="checkbox"]') || subjectForm.querySelector('button[type="submit"]');
         previouslyFocusedElementDash = openModal(modal, focusTarget);
    };
    const closeSubjectModal = () => { closeModal(modal, previouslyFocusedElementDash); };

    openModalBtn.addEventListener('click', openSubjectModal);
    closeModalElements.forEach(el => el.addEventListener('click', closeSubjectModal));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal?.classList.contains('is-visible')) closeSubjectModal(); });

    subjectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const checked = subjectForm.querySelectorAll('input[name="subjects"]:checked');
        const newData = Array.from(checked).map(cb => ({ id: cb.value, label: cb.dataset.label || cb.value }));
        currentUserSubjects = newData;
        if (setUserData(BASE_STORAGE_KEYS.USER_SUBJECTS, currentUserSubjects)) {
            renderSubjectsList(currentUserSubjects);
        } else {
            // Error handled by setUserData/displayUserMessage
        }
        closeSubjectModal();
    });

    renderSubjectsList(currentUserSubjects); // Initial render
}


/* ===== PAPERS PAGE LOGIC ===== */
function setupPapersPage_Dynamic() {
    console.log("Setting up Papers Page (Dynamic Rendering)...");
    const papersListContainer = document.getElementById('papers-list-container');
    const noPapersMessage = document.getElementById('no-papers-message');
    const filterForm = document.getElementById('paper-filter-form');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const mainTitle = document.getElementById('papers-main-title');

    if (!papersListContainer || !noPapersMessage || !filterForm || !applyFiltersBtn || !mainTitle) {
        console.warn("Papers page dynamic elements missing. Aborting setup.");
        if(papersListContainer) papersListContainer.innerHTML = '<p class="no-results-message">Error loading paper list components.</p>';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const subjectFilterFromUrl = urlParams.get('subject');
    const paperStatuses = getUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, {});

    function createPaperCard(paper) {
        if (!paper?.id) return null;
        const link = document.createElement('a');
        const validPaperStatuses = typeof paperStatuses === 'object' && paperStatuses !== null ? paperStatuses : {};
        const statusInfo = validPaperStatuses[paper.id] || { status: 'not_done', linkAttemptId: null };
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

    function applyFiltersAndRender() {
         if (typeof ALL_PAPER_DATA_SOURCE === 'undefined' || !Array.isArray(ALL_PAPER_DATA_SOURCE)) { console.error("ALL_PAPER_DATA_SOURCE is not available for filtering."); renderPapers([]); return; }
         const formData = new FormData(filterForm); const statusFilter = formData.get('status'); const yearFilter = formData.get('year'); const paperFilter = formData.get('paper');
         console.log("Filtering with:", { urlSubject: subjectFilterFromUrl, status: statusFilter, year: yearFilter, paper: paperFilter });
         const validPaperStatuses = typeof paperStatuses === 'object' && paperStatuses !== null ? paperStatuses : {};
         let filteredData = ALL_PAPER_DATA_SOURCE.filter(paper => {
             if (subjectFilterFromUrl && paper.subjectId !== subjectFilterFromUrl) return false;
             if (statusFilter) { const currentStatus = validPaperStatuses[paper.id]?.status || 'not_done'; if (currentStatus !== statusFilter) return false; }
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

    // Add event listener ONLY to the button <<< FIX APPLIED HERE
    applyFiltersBtn.addEventListener('click', applyFiltersAndRender);

    // REMOVED: Listener on select change
    // filterForm.querySelectorAll('select').forEach(select => {
    //     select.addEventListener('change', applyFiltersAndRender);
    // });

    applyFiltersAndRender(); // Initial Render
} // End setupPapersPage_Dynamic


/* ===== ATTEMPT PAGE LOGIC ===== */
function setupAttemptContentViewer() {
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

    if (!viewer || !paperV || !feedV || !outV || !paperB || !feedB || !outB || !retakeButton || !paperCodeHeading || !gradeValueElement || !durationValueElement || !rawScoreValueElement || !retakeModal || !confirmRetakeBtn || !retakeModalCloseElements) {
         console.warn("Attempt page elements missing. Functionality may be limited.");
         if(paperCodeHeading) paperCodeHeading.textContent = "Error Loading Attempt";
         if (durationValueElement) durationValueElement.textContent = 'Error';
         return;
    }

    // --- Get IDs using helper ---
    const { attemptId, paperId, validAttemptId, validPaperId } = getPaperInfoFromUrl();

    // --- Update Title, H1, and Retake Link ---
    let displayCode = "Attempt Details";
    let retakePaperId = "unknown-paper";

    if (validPaperId) {
        displayCode = formatPaperCode(paperId); // Use helper
        retakePaperId = paperId;
    } else if (validAttemptId) {
        // Attempt extraction (could be refined if format is complex)
        const parts = attemptId.split('_');
        if (parts.length >= 3 && parts[1].includes('-')) { // Basic check
            const potentialPaperId = parts[1];
            const formattedDisplayCode = formatPaperCode(potentialPaperId); // Format extracted ID
            if (formattedDisplayCode !== "Unknown Paper") { // If formatting worked
                 displayCode = formattedDisplayCode;
                 retakePaperId = potentialPaperId;
            } else {
                 displayCode = attemptId; // Fallback if format invalid
            }
        } else {
            displayCode = attemptId; // Fallback
        }
    }

    paperCodeHeading.textContent = displayCode;
    document.title = `${displayCode} - Attempt - PaperBuddy`;
    retakeButton.href = `test.html?paperId=${encodeURIComponent(retakePaperId)}`;


    // --- Update ONLY Duration ---
    if (validAttemptId) {
        const userDurations = getUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, {});
        const durationSeconds = userDurations[attemptId];
        if (durationSeconds !== undefined && durationSeconds !== null && !isNaN(durationSeconds)) {
            durationValueElement.textContent = formatTime(durationSeconds);
        } else {
            durationValueElement.textContent = '--';
            console.warn(`Duration not found/invalid for attemptId: ${attemptId}`);
        }
    } else {
         durationValueElement.textContent = '--';
         console.warn("Cannot display duration: attemptId missing/invalid.");
    }
    // Placeholders for Grade and Raw Score remain untouched

    // --- View Switching Logic ---
    const views = [paperV, feedV, outV]; const buttons = [paperB, feedB, outB];
    const showView = (viewToShow) => { views.forEach(view => { view.hidden = (view !== viewToShow); }); if(viewer) viewer.scrollTop = 0; };
    const setActiveButton = (buttonToActivate) => { buttons.forEach(btn => { btn.setAttribute('aria-current', btn === buttonToActivate ? 'page' : 'false'); }); };
    buttons.forEach((button, index) => { button.addEventListener('click', (e) => { e.preventDefault(); showView(views[index]); setActiveButton(button); }); });
    showView(paperV); setActiveButton(paperB);

    // --- Retake Modal Logic ---
    let previouslyFocusedElementRetake = null; let targetRetakeUrl = '';
    const openRetakeModal = () => { previouslyFocusedElementRetake = document.activeElement; openModal(retakeModal, confirmRetakeBtn); };
    const closeRetakeModal = () => { closeModal(retakeModal, previouslyFocusedElementRetake); };
    retakeButton.addEventListener('click', (event) => {
        event.preventDefault(); targetRetakeUrl = retakeButton.href;
        if (targetRetakeUrl && !targetRetakeUrl.includes('unknown-paper')) { openRetakeModal(); }
        else { console.error("Cannot retake, paper ID unknown:", targetRetakeUrl); displayUserMessage("Could not determine the paper for retake.", "error"); }
    });
    confirmRetakeBtn.addEventListener('click', () => {
        console.log("Confirming retake, navigating to:", targetRetakeUrl); closeRetakeModal();
        setTimeout(() => { if(targetRetakeUrl && !targetRetakeUrl.includes('unknown-paper')) { window.location.href = targetRetakeUrl; } else { console.error("Target retake URL invalid!"); displayUserMessage("Error starting retake.", "error");} }, 100);
    });
    retakeModalCloseElements.forEach(el => el.addEventListener('click', closeRetakeModal));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && retakeModal?.classList.contains('is-visible')) closeRetakeModal(); });

} // End setupAttemptContentViewer


/* ===== TEST PAGE LOGIC ===== */
function setupTestPage() {
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

     if (!timerDisplay || !timerButton || !confirmModal || !confirmSubmitBtn || !modalCloseElements || !paperCodeHeading || !answerTextarea || !fileUploadInput || !fileUploadFilename) {
        console.warn("Test page elements missing. Aborting setup.");
        if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading Test";
        if (timerButton) { timerButton.disabled = true; timerButton.textContent = "Error"; }
        return;
    }

    // --- Get Paper ID using helper ---
    const { paperId, validPaperId } = getPaperInfoFromUrl();
    let displayCode = "Unknown Paper";

    // --- Update Title và H1 ---
    if (validPaperId) {
        displayCode = formatPaperCode(paperId); // Use helper
        paperCodeHeading.textContent = displayCode;
        document.title = `${displayCode} - Test - PaperBuddy`;
    } else {
         paperCodeHeading.textContent = displayCode;
         document.title = `Take Test - PaperBuddy`;
         console.warn("Paper ID is missing or invalid for this test session.");
         timerButton.disabled = true; // Disable start if paper ID invalid
         timerButton.textContent = "Invalid Paper";
    }

    let timerInterval = null; let secondsElapsed = 0; let isTimerRunning = false; let previouslyFocusedElementTest = null;

    const updateDisplay = () => { if(timerDisplay) timerDisplay.textContent = formatTime(secondsElapsed); };
    const startTimer = () => {
        if (isTimerRunning || !validPaperId) return; // Don't start if running or invalid paper
        isTimerRunning = true; secondsElapsed = 0; updateDisplay();
        timerInterval = setInterval(() => { secondsElapsed++; updateDisplay(); }, 1000);
        timerButton.textContent = 'Submit'; timerButton.dataset.action = 'submit';
        console.log('Timer started for paper:', paperId);
        answerTextarea.disabled = false; fileUploadInput.disabled = false;
        if (!fileUploadInput.files[0]) { answerTextarea.placeholder = "Type your final answer here..."; } // Update placeholder only if no file selected
    };
    const stopTimer = () => { clearInterval(timerInterval); isTimerRunning = false; console.log('Timer stopped. Final time:', secondsElapsed); };
    const openTestModal = () => {
        const answerText = answerTextarea.value.trim(); const uploadedFile = fileUploadInput.files[0];
        if (!answerText && !uploadedFile) { displayUserMessage("Please enter an answer or upload a file before submitting.", "warning"); answerTextarea.focus(); return; }
        previouslyFocusedElementTest = document.activeElement; openModal(confirmModal, confirmSubmitBtn);
    };
    const closeTestModal = () => { closeModal(confirmModal, previouslyFocusedElementTest); };

    timerButton.addEventListener('click', () => { const action = timerButton.dataset.action; if (action === 'start') { startTimer(); } else if (action === 'submit') { openTestModal(); } });

    fileUploadInput.addEventListener('change', () => {
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

    confirmSubmitBtn.addEventListener('click', () => {
        if (isTimerRunning) { stopTimer(); }
        const username = getCurrentUsername();
        if (!username || !validPaperId) { // Check both login and valid paper ID
             console.error("Submission failed: User not logged in or paper ID invalid.");
             displayUserMessage("Submission error. Please log in or ensure the paper is valid.", "error");
             closeTestModal();
             if (!username) window.location.href = 'index.html'; // Redirect only if not logged in
             return;
        }
        const answerText = answerTextarea.value.trim(); const uploadedFile = fileUploadInput.files[0];
        console.log('Submitting attempt... Final time:', secondsElapsed); console.log('Answer Text Provided:', !!answerText); console.log('File Provided:', uploadedFile?.name || 'None');
        // TODO: Implement actual data submission

        const timestamp = Date.now(); const newAttemptId = `${username}_${paperId}_${timestamp}`; console.log("Generated new attemptId:", newAttemptId);

        // --- Save Duration ---
        const userDurations = getUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, {});
        userDurations[newAttemptId] = secondsElapsed;
        if (!setUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, userDurations)) { closeTestModal(); return; /* Error displayed by setUserData */ }

        // --- Update Paper Status ---
        const userStatuses = getUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, {});
        const paperStatusInfo = { status: 'done', linkAttemptId: newAttemptId };
        userStatuses[paperId] = paperStatusInfo;
        if (!setUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, userStatuses)) { /* Error displayed by setUserData, continue anyway? */ }
        else { console.log("Updated paper status for user", username, ", paper", paperId, ":", paperStatusInfo); }

        closeTestModal();
        const resultUrl = `result.html?attemptId=${encodeURIComponent(newAttemptId)}&paperId=${encodeURIComponent(paperId)}`; console.log("Redirecting to:", resultUrl);
        setTimeout(() => { window.location.href = resultUrl; }, 100);
    });

    modalCloseElements.forEach(el => el.addEventListener('click', closeTestModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmModal?.classList.contains('is-visible')) closeTestModal(); });

    updateDisplay(); // Initial display
    answerTextarea.disabled = true; fileUploadInput.disabled = true; answerTextarea.placeholder = "Start the exam to type or upload."; // Initial state
}


/* ===== RESULT PAGE LOGIC ===== */
function setupResultPage() {
    console.log("Setting up Result Page...");
    const deleteButton = document.getElementById('delete-attempt-btn');
    const deleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-action-btn');
    const modalCloseElements = deleteModal?.querySelectorAll('[data-close-modal], .modal__close-btn');
    const paperCodeHeading = document.getElementById('result-paper-code');
    const durationElement = document.querySelector('.result-block--grade-details .detail-item:nth-child(2) .detail-value');

    if (!deleteButton || !deleteModal || !confirmDeleteBtn || !modalCloseElements || !paperCodeHeading || !durationElement) {
        console.warn("Result page elements missing. Functionality (like delete) may be limited.");
        if (paperCodeHeading) paperCodeHeading.textContent = "Error Loading Result";
        if (deleteButton && (!deleteModal || !confirmDeleteBtn)) { deleteButton.disabled = true; deleteButton.style.opacity = '0.5'; deleteButton.title = "Delete unavailable."; }
        return;
    }

    // --- Get IDs using helper ---
    const { attemptId, paperId, validAttemptId, validPaperId } = getPaperInfoFromUrl();

    // --- Update Title và H1 ---
    let displayCode = "Result";
    if (validPaperId) { displayCode = formatPaperCode(paperId); }
    else if (validAttemptId) {
        const parts = attemptId.split('_');
        if (parts.length >= 3 && parts[1].includes('-')) {
            const potentialPaperId = parts[1];
            const formattedDisplayCode = formatPaperCode(potentialPaperId);
             displayCode = (formattedDisplayCode !== "Unknown Paper") ? formattedDisplayCode : attemptId;
        } else { displayCode = attemptId; }
    }
    paperCodeHeading.textContent = displayCode;
    document.title = `${displayCode} - Result - PaperBuddy`;

    // --- Update Duration ---
    if (validAttemptId) {
        const userDurations = getUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, {});
        const durationSeconds = userDurations[attemptId];
        if (durationSeconds !== undefined && durationSeconds !== null && !isNaN(durationSeconds)) { durationElement.textContent = formatTime(durationSeconds); }
        else { durationElement.textContent = '--'; console.warn(`Duration not found/invalid for attemptId: ${attemptId}`); }
    } else { durationElement.textContent = '--'; console.warn("Cannot display duration: attemptId missing/invalid."); }

    // --- Delete Button Logic ---
    let previouslyFocusedElementResult = null;
    const openDeleteModal = () => { previouslyFocusedElementResult = document.activeElement; openModal(deleteModal, confirmDeleteBtn); };
    const closeDeleteModal = () => { closeModal(deleteModal, previouslyFocusedElementResult); };

    deleteButton.addEventListener('click', () => { if (validAttemptId) { openDeleteModal(); } else { displayUserMessage("Cannot delete: Attempt ID is missing or invalid.", "error"); } });

    confirmDeleteBtn.addEventListener('click', () => {
         if (!validAttemptId) { console.error("Delete failed: Attempt ID invalid."); displayUserMessage("Error: Cannot delete attempt.", "error"); closeDeleteModal(); return; }
         const username = getCurrentUsername();
         if (!username) { console.error("Delete failed: User not logged in."); displayUserMessage("Error: Not logged in.", "error"); closeDeleteModal(); window.location.href = 'index.html'; return; }

         console.log(`Deleting attempt ${attemptId} for user ${username}...`);

         // 1. Remove duration
         const userDurations = getUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, {});
         if (userDurations.hasOwnProperty(attemptId)) {
             delete userDurations[attemptId];
             if (!setUserData(BASE_STORAGE_KEYS.ATTEMPT_DURATIONS, userDurations)) { /* Error handled by setUserData */ }
             else { console.log("Removed duration for attempt", attemptId); }
         } else { console.warn("Duration data not found for deletion:", attemptId); }

         // 2. Update paper status if this was the linked attempt
         if (validPaperId) {
             const userStatuses = getUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, {});
             if (userStatuses.hasOwnProperty(paperId) && userStatuses[paperId]?.linkAttemptId === attemptId) {
                  console.log(`Resetting status for paper ${paperId} as linked attempt ${attemptId} was deleted.`);
                  userStatuses[paperId] = { status: 'not_done', linkAttemptId: null };
                  if (!setUserData(BASE_STORAGE_KEYS.PAPER_STATUSES, userStatuses)) { /* Error handled by setUserData */ }
                  else { console.log(`Paper ${paperId} status reset to not_done.`); }
             }
         } else { console.warn("Cannot update paper status: Paper ID missing/invalid."); }

         // TODO: Add backend API call to delete permanently

         closeDeleteModal();
         displayUserMessage("Attempt deleted (simulation). Redirecting...", "info"); // Use info message
          setTimeout(() => {
               const redirectUrl = validPaperId ? `papers.html?subject=${encodeURIComponent(paperId)}` : 'papers.html'; window.location.href = redirectUrl;
          }, 1500); // Slightly longer delay for user to see message
    });

    modalCloseElements.forEach(el => el.addEventListener('click', closeDeleteModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && deleteModal?.classList.contains('is-visible')) closeDeleteModal(); });
    // --- End Delete Button Logic ---

    // --- Placeholder Download Listeners ---
    const downloadFeedbackBtn = document.getElementById('download-feedback-btn');
    const downloadOutlineBtn = document.getElementById('download-outline-btn');
    const placeholderDownloadHandler = (e, type) => {
        e.preventDefault();
        // Use console log or displayUserMessage instead of alert
        console.log(`${type} download feature not implemented yet.`);
        displayUserMessage(`Download ${type} feature not implemented yet.`, 'info');
    };
    if (downloadFeedbackBtn) downloadFeedbackBtn.addEventListener('click', (e) => placeholderDownloadHandler(e, 'feedback'));
    if (downloadOutlineBtn) downloadOutlineBtn.addEventListener('click', (e) => placeholderDownloadHandler(e, 'outline'));

} // End setupResultPage