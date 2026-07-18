/* ========================================
   Water Field Technologies — Feedback Form
   ======================================== */

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

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzBcE8dnS288xLHZAXPbPzPB-uXdc1yLBXa5xcfGEjAXeTTvBd8FXwRNs_UfUD9WaBIeA/exec';

// ============================================================
// NAVIGATION
// ============================================================

function goToStep(stepNum) {
    if (stepNum > currentStep && !validateStep(currentStep)) return;

    steps.forEach(s => s.classList.remove('active'));
    const targetStep = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (targetStep) targetStep.classList.add('active');

    currentStep = stepNum;
    updateProgress();
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    progressFill.style.width = (currentStep / totalSteps * 100) + '%';
    progressSteps.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index + 1 < currentStep) dot.classList.add('completed');
        else if (index + 1 === currentStep) dot.classList.add('active');
    });
}

function updateNavButtons() {
    btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-flex';
    } else {
        btnNext.style.display = 'inline-flex';
        btnSubmit.style.display = 'none';
    }
}

btnNext.addEventListener('click', () => goToStep(currentStep + 1));
btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

// ============================================================
// VALIDATION
// ============================================================

function validateStep(stepNum) {
    const step = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (!step) return true;

    let isValid = true;
    step.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    step.querySelectorAll('.error-message').forEach(el => el.remove());

    step.querySelectorAll('input[required]:not([type="radio"]), textarea[required]').forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            showFieldError(input, 'This field is required');
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            isValid = false;
            showFieldError(input, 'Please enter a valid email');
        }
    });

    const radioGroups = new Set();
    step.querySelectorAll('input[type="radio"][required]').forEach(r => radioGroups.add(r.name));
    radioGroups.forEach(groupName => {
        if (!step.querySelector(`input[name="${groupName}"]:checked`)) {
            isValid = false;
            const container = step.querySelector(`input[name="${groupName}"]`).closest('.form-group');
            if (container && !container.querySelector('.error-message')) {
                const el = document.createElement('div');
                el.className = 'error-message';
                el.innerHTML = '⚠ Please select an option';
                container.appendChild(el);
            }
        }
    });

    if (stepNum === 6 && npsInput.required && !npsInput.value) {
        isValid = false;
        const c = npsScale.closest('.form-group');
        if (c && !c.querySelector('.error-message')) {
            const el = document.createElement('div');
            el.className = 'error-message';
            el.innerHTML = '⚠ Please select a score';
            c.appendChild(el);
        }
    }

    if (!isValid) showToast('Please fill in all required fields', 'error');
    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('error');
    const parent = input.closest('.form-group');
    if (parent && !parent.querySelector('.error-message')) {
        const el = document.createElement('div');
        el.className = 'error-message';
        el.innerHTML = `⚠ ${message}`;
        parent.appendChild(el);
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
        e.target.classList.remove('error');
        e.target.closest('.form-group')?.querySelector('.error-message')?.remove();
    }
});

form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
        e.target.closest('.form-group')?.querySelector('.error-message')?.remove();
    }
});

// ============================================================
// CONDITIONAL FIELDS
// ============================================================

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

form.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    conditionalRules.forEach(rule => {
        if (e.target.name === rule.radioName) {
            const el = document.getElementById(rule.targetId);
            if (el) el.style.display = rule.triggers.includes(e.target.value) ? '' : 'none';
        }
    });
});

// ============================================================
// NPS SCALE
// ============================================================

if (npsScale) {
    npsScale.querySelectorAll('.nps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            npsScale.querySelectorAll('.nps-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            npsInput.value = btn.dataset.value;
            npsScale.closest('.form-group')?.querySelector('.error-message')?.remove();
        });
    });
}

// ============================================================
// FORM SUBMISSION
// ============================================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner"></div> Submitting...';

    try {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'photos' || key === 'documents') continue;
            data[key] = value;
        }
        data['submitted_at'] = new Date().toISOString();

        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        form.style.display = 'none';
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('form-navigation').style.display = 'none';
        successScreen.style.display = 'block';
        showToast('Feedback submitted successfully!', 'success');

    } catch (error) {
        console.error('Submission error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Feedback`;
    }
});

// ============================================================
// TOAST
// ============================================================

function showToast(message, type = 'error') {
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
// AUTO-FILL DATE
// ============================================================

(function() {
    const today = new Date().toISOString().split('T')[0];
    const fd = document.getElementById('feedback-date');
    const sd = document.getElementById('submission-date');
    if (fd && !fd.value) fd.value = today;
    if (sd && !sd.value) sd.value = today;
})();
