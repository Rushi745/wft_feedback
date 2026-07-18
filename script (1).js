/* ========================================
   Water Field Technologies — Feedback Form
   JavaScript Logic
   ======================================== */

// ============================================================
// 1. STATE & ELEMENTS
// ============================================================

const form = document.getElementById('feedback-form');
const steps = document.querySelectorAll('.form-step');
const progressSteps = document.querySelectorAll('.progress-step');
const progressFill = document.getElementById('progress-fill');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const successScreen = document.getElementById('success-screen');
const npsScale = document.getElementById('nps-scale');
const npsInput = document.getElementById('nps-value');

let currentStep = 1;
const totalSteps = steps.length;

// ============================================================
// 2. NAVIGATION (Next / Previous / Progress)
// ============================================================

/**
 * Go to a specific step number.
 * This hides the current step, shows the new one, updates progress bar etc.
 */
function goToStep(stepNum) {
    // Validate before moving forward
    if (stepNum > currentStep && !validateStep(currentStep)) {
        return;
    }

    // Hide all steps
    steps.forEach(s => s.classList.remove('active'));

    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    currentStep = stepNum;

    // Update progress indicators
    updateProgress();

    // Update navigation buttons
    updateNavButtons();

    // Scroll to top of form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update the progress bar fill and the step dots.
 */
function updateProgress() {
    // Update fill width
    const fillPercent = (currentStep / totalSteps) * 100;
    progressFill.style.width = fillPercent + '%';

    // Update step dots
    progressSteps.forEach((dot, index) => {
        const stepIndex = index + 1;
        dot.classList.remove('active', 'completed');

        if (stepIndex < currentStep) {
            dot.classList.add('completed');
        } else if (stepIndex === currentStep) {
            dot.classList.add('active');
        }
    });
}

/**
 * Show/hide the Previous, Next, and Submit buttons based on current step.
 */
function updateNavButtons() {
    // Previous button: hidden on step 1
    btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    // On the last step, hide "Next" and show "Submit"
    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-flex';
    } else {
        btnNext.style.display = 'inline-flex';
        btnSubmit.style.display = 'none';
    }
}

// Button click handlers
btnNext.addEventListener('click', () => goToStep(currentStep + 1));
btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

// ============================================================
// 3. VALIDATION
// ============================================================

/**
 * Validate all required fields in a given step.
 * Returns true if valid, false otherwise.
 */
function validateStep(stepNum) {
    const step = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (!step) return true;

    let isValid = true;

    // Clear previous errors
    step.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    step.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validate text/email/tel inputs and textareas with "required"
    const requiredInputs = step.querySelectorAll('input[required]:not([type="radio"]), textarea[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            showFieldError(input, 'This field is required');
        } else if (input.type === 'email' && input.value.trim() && !isValidEmail(input.value)) {
            isValid = false;
            showFieldError(input, 'Please enter a valid email');
        }
    });

    // Validate required radio groups
    const radioGroups = new Set();
    step.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        radioGroups.add(radio.name);
    });

    radioGroups.forEach(groupName => {
        const checked = step.querySelector(`input[name="${groupName}"]:checked`);
        if (!checked) {
            isValid = false;
            const container = step.querySelector(`input[name="${groupName}"]`).closest('.form-group');
            if (container && !container.querySelector('.error-message')) {
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.innerHTML = '⚠ Please select an option';
                container.appendChild(errorEl);
            }
        }
    });

    // Validate NPS score on step 6
    if (stepNum === 6 && npsInput.required && !npsInput.value) {
        isValid = false;
        const npsContainer = npsScale.closest('.form-group');
        if (npsContainer && !npsContainer.querySelector('.error-message')) {
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.innerHTML = '⚠ Please select a score';
            npsContainer.appendChild(errorEl);
        }
    }

    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
    }

    return isValid;
}

/**
 * Display an error for a specific input field.
 */
function showFieldError(input, message) {
    input.classList.add('error');

    // Only add error message if not already present
    const parent = input.closest('.form-group');
    if (parent && !parent.querySelector('.error-message')) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `⚠ ${message}`;
        parent.appendChild(errorEl);
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Clear error on input
form.addEventListener('input', (e) => {
    const target = e.target;
    if (target.classList.contains('error')) {
        target.classList.remove('error');
        const errorMsg = target.closest('.form-group')?.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    }
});

form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
        const container = e.target.closest('.form-group');
        const errorMsg = container?.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    }
});

// ============================================================
// 4. CONDITIONAL FIELDS (Show/hide based on selections)
// ============================================================

/**
 * Map: radio group name → { triggerValues: [...], targetId: "..." }
 * When a radio in the group is selected and its value is in triggerValues,
 * the element with targetId is shown. Otherwise it's hidden.
 */
const conditionalRules = [
    { radioName: 'meets_purpose', triggers: ['Partially', 'No'], targetId: 'meets-purpose-explain-group' },
    { radioName: 'unplanned_downtime', triggers: ['Yes'], targetId: 'downtime-explain-group' },
    { radioName: 'output_expected', triggers: ['No'], targetId: 'output-explain-group' },
    { radioName: 'on_schedule', triggers: ['No'], targetId: 'schedule-explain-group' },
    { radioName: 'training_provided', triggers: ['Yes'], targetId: 'training-adequate-group' },
    { radioName: 'training_provided', triggers: ['Yes'], targetId: 'training-comments-group' },
    { radioName: 'support_needed', triggers: ['Yes'], targetId: 'support-when-group' },
    { radioName: 'safety_met', triggers: ['Partially', 'No'], targetId: 'safety-comments-group' },
    { radioName: 'safety_incidents', triggers: ['Yes'], targetId: 'incidents-explain-group' },
    { radioName: 'followup_visit', triggers: ['Yes'], targetId: 'followup-datetime-group' },
];

// Listen for all radio changes
form.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;

    conditionalRules.forEach(rule => {
        if (e.target.name === rule.radioName) {
            const targetEl = document.getElementById(rule.targetId);
            if (!targetEl) return;

            if (rule.triggers.includes(e.target.value)) {
                targetEl.style.display = '';
            } else {
                targetEl.style.display = 'none';
            }
        }
    });
});

// ============================================================
// 5. NPS (Net Promoter Score) SCALE
// ============================================================

if (npsScale) {
    const npsBtns = npsScale.querySelectorAll('.nps-btn');

    npsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            npsBtns.forEach(b => b.classList.remove('active'));
            // Set active on clicked
            btn.classList.add('active');
            // Set hidden input value
            npsInput.value = btn.dataset.value;

            // Clear any error
            const errorMsg = npsScale.closest('.form-group')?.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    });
}

// ============================================================
// 6. FILE UPLOAD HANDLING
// ============================================================

function setupFileUpload(areaId, inputId, previewId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!area || !input || !preview) return;

    // Store selected files
    let selectedFiles = [];

    // Click to open file dialog
    area.addEventListener('click', () => input.click());

    // Drag events
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => {
        area.classList.remove('drag-over');
    });
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Input change
    input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(fileList) {
        for (const file of fileList) {
            if (file.size > 10 * 1024 * 1024) {
                showToast(`"${file.name}" is too large (max 10MB)`, 'error');
                continue;
            }
            selectedFiles.push(file);
        }
        renderPreview();
    }

    // Expose selected files for submission
    area._getFiles = () => selectedFiles;

    function renderPreview() {
        preview.innerHTML = '';
        selectedFiles.forEach((file, idx) => {
            const tag = document.createElement('div');
            tag.className = 'file-tag';
            tag.innerHTML = `📎 ${file.name} <button type="button" data-idx="${idx}">&times;</button>`;
            preview.appendChild(tag);
        });

        // Remove button
        preview.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                selectedFiles.splice(idx, 1);
                renderPreview();
            });
        });
    }
}

setupFileUpload('photo-upload-area', 'photo-input', 'file-preview');
setupFileUpload('docs-upload-area', 'docs-input', 'docs-preview');

// ============================================================
// 7. FORM SUBMISSION
// ============================================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate last step
    if (!validateStep(currentStep)) return;

    // Disable submit button and show spinner
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner"></div> Submitting...';

    try {
        // Collect all form data
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'photos' || key === 'documents') continue;
            data[key] = value;
        }

        // Add timestamp
        data['submitted_at'] = new Date().toISOString();

        const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyvoHaHjGye14Kd7ewQA2NbtQpH-qp8h7bXbeyNuWMoM1EnSnmsDid4Lbbx1SIb8-Wr/exec';
        const installationId = data['installation_id'] || ('WFT-' + Date.now());

        // -------------------------------------------------------
        // UPLOAD FILES TO GOOGLE DRIVE
        // -------------------------------------------------------
        async function uploadFilesToDrive(areaId, fieldName) {
            const area = document.getElementById(areaId);
            const files = area && area._getFiles ? area._getFiles() : [];
            const links = [];

            for (const file of files) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                await fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'file_upload',
                        installation_id: installationId,
                        file_name: file.name,
                        file_type: file.type,
                        file_data: base64
                    })
                });

                // no-cors means we can't read the URL back, so we note the file was uploaded
                links.push(`[${file.name} uploaded to Drive folder: ${installationId}]`);
            }

            return links.join('\n');
        }

        showToast('Uploading files...', 'success');
        data['photo_links'] = await uploadFilesToDrive('photo-upload-area', 'photos');
        data['document_links'] = await uploadFilesToDrive('docs-upload-area', 'documents');

        // -------------------------------------------------------
        // SEND FORM DATA TO GOOGLE SHEETS
        // -------------------------------------------------------
        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Show success
        form.style.display = 'none';
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('form-navigation').style.display = 'none';
        successScreen.style.display = 'block';

        showToast('Feedback submitted successfully!', 'success');

    } catch (error) {
        console.error('Submission error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Submit Feedback
        `;
    }
});

// ============================================================
// 8. TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'error') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(80px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================================
// 9. AUTO-FILL TODAY'S DATE
// ============================================================

(function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const feedbackDate = document.getElementById('feedback-date');
    const submissionDate = document.getElementById('submission-date');

    if (feedbackDate && !feedbackDate.value) feedbackDate.value = today;
    if (submissionDate && !submissionDate.value) submissionDate.value = today;
})();
