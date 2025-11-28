/**
 * Countdown Timer Checker
 * Calculates the end date/time based on remaining countdown time
 */

(function() {
    'use strict';

    // ----- Configuration -----
    const COMMON_TIMEZONES = [
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
        { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
        { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
        { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
        { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
        { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
        { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
        { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
        { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
        { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
        { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
        { value: 'America/New_York', label: 'New York (EST/EDT)' },
        { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
        { value: 'America/Denver', label: 'Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
        { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
        { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
        { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
        { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
        { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
        { value: 'Asia/Kolkata', label: 'Mumbai / Delhi (IST)' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
        { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
        { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Asia/Seoul', label: 'Seoul (KST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
        { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
        { value: 'Australia/Perth', label: 'Perth (AWST)' },
        { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
    ];

    // ----- DOM Elements -----
    const elements = {
        inputDays: document.getElementById('inputDays'),
        inputHours: document.getElementById('inputHours'),
        inputMinutes: document.getElementById('inputMinutes'),
        inputSeconds: document.getElementById('inputSeconds'),
        timezoneSelect: document.getElementById('timezoneSelect'),
        timezonePreview: document.getElementById('timezonePreview'),
        localTimezone: document.getElementById('localTimezone'),
        calculateBtn: document.getElementById('calculateBtn'),
        resultsSection: document.getElementById('resultsSection'),
        resultSelectedTz: document.getElementById('resultSelectedTz'),
        resultSelectedTzName: document.getElementById('resultSelectedTzName'),
        resultLocalTz: document.getElementById('resultLocalTz'),
        resultLocalTzName: document.getElementById('resultLocalTzName'),
        localResultCard: document.getElementById('localResultCard'),
        copyBtn: document.getElementById('copyBtn'),
        resetBtn: document.getElementById('resetBtn'),
        copyToast: document.getElementById('copyToast')
    };

    // ----- State -----
    let calculatedEndTime = null;
    let selectedTimezone = null;
    let clockInterval = null;

    // ----- Initialization -----
    function init() {
        populateTimezones();
        displayLocalTimezone();
        attachEventListeners();
        startTimezoneClock();
    }

    function populateTimezones() {
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Sort timezones, putting local timezone first
        const sortedTimezones = [...COMMON_TIMEZONES].sort((a, b) => {
            if (a.value === localTz) return -1;
            if (b.value === localTz) return 1;
            return a.label.localeCompare(b.label);
        });

        // Build options HTML
        let optionsHtml = '';
        sortedTimezones.forEach(tz => {
            const isLocal = tz.value === localTz;
            const label = isLocal ? `${tz.label} — Your timezone` : tz.label;
            const selected = isLocal ? 'selected' : '';
            optionsHtml += `<option value="${tz.value}" ${selected}>${label}</option>`;
        });

        elements.timezoneSelect.innerHTML = optionsHtml;
        selectedTimezone = localTz;
    }

    function displayLocalTimezone() {
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzLabel = COMMON_TIMEZONES.find(tz => tz.value === localTz)?.label || localTz;
        elements.localTimezone.textContent = tzLabel;
    }

    function attachEventListeners() {
        // Calculate button
        elements.calculateBtn.addEventListener('click', calculateEndTime);

        // Enter key on inputs
        const inputs = [elements.inputDays, elements.inputHours, elements.inputMinutes, elements.inputSeconds];
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    calculateEndTime();
                }
            });

            // Validate input ranges on change
            input.addEventListener('change', validateInput);
            input.addEventListener('blur', validateInput);
        });

        // Timezone change
        elements.timezoneSelect.addEventListener('change', (e) => {
            selectedTimezone = e.target.value;
            updateTimezoneClock(); // Update clock immediately
            // Recalculate if we already have results
            if (calculatedEndTime) {
                updateResults();
            }
        });

        // Copy button
        elements.copyBtn.addEventListener('click', copyToClipboard);

        // Reset button
        elements.resetBtn.addEventListener('click', resetForm);
    }

    // ----- Timezone Clock -----
    function startTimezoneClock() {
        updateTimezoneClock(); // Initial update
        clockInterval = setInterval(updateTimezoneClock, 1000); // Update every second
    }

    function updateTimezoneClock() {
        const timezone = elements.timezoneSelect.value;
        const now = new Date();
        
        const options = {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: timezone
        };
        
        const timeString = new Intl.DateTimeFormat('en-GB', options).format(now);
        elements.timezonePreview.textContent = timeString;
    }

    // ----- Validation -----
    function validateInput(e) {
        const input = e.target;
        let value = parseInt(input.value);
        
        // Allow empty or valid positive numbers
        if (isNaN(value) || value < 0) {
            input.value = '';
        }
    }

    // ----- Calculation -----
    function calculateEndTime() {
        const days = parseInt(elements.inputDays.value) || 0;
        const hours = parseInt(elements.inputHours.value) || 0;
        const minutes = parseInt(elements.inputMinutes.value) || 0;
        const seconds = parseInt(elements.inputSeconds.value) || 0;

        // Validate that at least some time is entered
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            shakeElement(elements.calculateBtn);
            return;
        }

        // Calculate total milliseconds
        const totalMs = (
            (days * 24 * 60 * 60) +
            (hours * 60 * 60) +
            (minutes * 60) +
            seconds
        ) * 1000;

        // Calculate end time
        calculatedEndTime = new Date(Date.now() + totalMs);
        selectedTimezone = elements.timezoneSelect.value;

        // Update UI
        updateResults();
        showResults();
    }

    function updateResults() {
        if (!calculatedEndTime) return;

        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Format for selected timezone
        const selectedTzFormatted = formatDateTime(calculatedEndTime, selectedTimezone);
        elements.resultSelectedTz.textContent = selectedTzFormatted;
        elements.resultSelectedTzName.textContent = getTimezoneName(selectedTimezone);

        // Format for local timezone (if different)
        if (selectedTimezone !== localTz) {
            const localTzFormatted = formatDateTime(calculatedEndTime, localTz);
            elements.resultLocalTz.textContent = localTzFormatted;
            elements.resultLocalTzName.textContent = getTimezoneName(localTz);
            elements.localResultCard.classList.remove('d-none');
        } else {
            elements.localResultCard.classList.add('d-none');
        }
    }

    // ----- Formatting -----
    function formatDateTime(date, timezone) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: timezone
        };

        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    function getTimezoneName(timezone) {
        const match = COMMON_TIMEZONES.find(tz => tz.value === timezone);
        if (match) return match.label;
        
        // Fallback: format the timezone name nicely
        return timezone.replace(/_/g, ' ').replace('/', ' / ');
    }

    function getShortDateTime(date, timezone) {
        const options = {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: timezone,
            timeZoneName: 'short'
        };

        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    // ----- UI Actions -----
    function showResults() {
        elements.resultsSection.classList.remove('d-none');
        
        // Scroll to results smoothly
        setTimeout(() => {
            elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    function hideResults() {
        elements.resultsSection.classList.add('d-none');
    }

    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    }

    function resetForm() {
        elements.inputDays.value = '';
        elements.inputHours.value = '';
        elements.inputMinutes.value = '';
        elements.inputSeconds.value = '';
        calculatedEndTime = null;
        hideResults();
        elements.inputDays.focus();
    }

    // ----- Clipboard -----
    async function copyToClipboard() {
        if (!calculatedEndTime) return;

        const text = `Timer ends: ${getShortDateTime(calculatedEndTime, selectedTimezone)}`;

        try {
            await navigator.clipboard.writeText(text);
            showCopyToast();
        } catch (err) {
            // Fallback for older browsers
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            showCopyToast();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        
        document.body.removeChild(textarea);
    }

    function showCopyToast() {
        elements.copyToast.classList.add('show');
        setTimeout(() => {
            elements.copyToast.classList.remove('show');
        }, 2000);
    }

    // ----- Start -----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
