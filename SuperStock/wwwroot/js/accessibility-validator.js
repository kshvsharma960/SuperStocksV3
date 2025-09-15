/**
 * Accessibility Validation Suite
 * Comprehensive validation and compliance testing
 */

class AccessibilityValidator {
    constructor() {
        this.validationResults = [];
        this.wcagGuidelines = this.initializeWCAGGuidelines();
        this.colorContrastThresholds = {
            normal: { AA: 4.5, AAA: 7 },
            large: { AA: 3, AAA: 4.5 }
        };
    }

    /**
     * Initialize WCAG 2.1 guidelines for validation
     */
    initializeWCAGGuidelines() {
        return {
            '1.1.1': 'Non-text Content',
            '1.3.1': 'Info and Relationships',
            '1.3.2': 'Meaningful Sequence',
            '1.4.3': 'Contrast (Minimum)',
            '1.4.6': 'Contrast (Enhanced)',
            '2.1.1': 'Keyboard',
            '2.1.2': 'No Keyboard Trap',
            '2.4.1': 'Bypass Blocks',
            '2.4.2': 'Page Titled',
            '2.4.3': 'Focus Order',
            '2.4.6': 'Headings and Labels',
            '2.4.7': 'Focus Visible',
            '3.1.1': 'Language of Page',
            '3.2.1': 'On Focus',
            '3.2.2': 'On Input',
            '3.3.1': 'Error Identification',
            '3.3.2': 'Labels or Instructions',
            '4.1.1': 'Parsing',
            '4.1.2': 'Name, Role, Value'
        };
    }

    /**
     * Run comprehensive WCAG compliance validation
     */
    async validateWCAGCompliance() {
        console.log('🔍 Starting WCAG 2.1 compliance validation...');
        
        const validation = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            level: 'AA', // Testing for AA compliance
            guidelines: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };

        // Validate each WCAG guideline
        for (const [guideline, description] of Object.entries(this.wcagGuidelines)) {
            const result = await this.validateGuideline(guideline, description);
            validation.guidelines[guideline] = result;
            validation.summary.total++;
            
            if (result.status === 'pass') {
                validation.summary.passed++;
            } else if (result.status === 'fail') {
                validation.summary.failed++;
            } else {
                validation.summary.warnings++;
            }
        }

        this.validationResults.push(validation);
        this.displayValidationResults(validation);
        
        return validation;
    }

    /**
     * Validate specific WCAG guideline
     */
    async validateGuideline(guideline, description) {
        const result = {
            guideline,
            description,
            status: 'pass',
            issues: [],
            recommendations: []
        };

        switch (guideline) {
            case '1.1.1':
                return this.validateNonTextContent(result);
            case '1.3.1':
                return this.validateInfoAndRelationships(result);
            case '1.3.2':
                return this.validateMeaningfulSequence(result);
            case '1.4.3':
                return await this.validateColorContrast(result, 'AA');
            case '1.4.6':
                return await this.validateColorContrast(result, 'AAA');
            case '2.1.1':
                return this.validateKeyboardAccess(result);
            case '2.1.2':
                return this.validateNoKeyboardTrap(result);
            case '2.4.1':
                return this.validateBypassBlocks(result);
            case '2.4.2':
                return this.validatePageTitled(result);
            case '2.4.3':
                return this.validateFocusOrder(result);
            case '2.4.6':
                return this.validateHeadingsAndLabels(result);
            case '2.4.7':
                return this.validateFocusVisible(result);
            case '3.1.1':
                return this.validateLanguageOfPage(result);
            case '3.2.1':
                return this.validateOnFocus(result);
            case '3.2.2':
                return this.validateOnInput(result);
            case '3.3.1':
                return this.validateErrorIdentification(result);
            case '3.3.2':
                return this.validateLabelsOrInstructions(result);
            case '4.1.1':
                return this.validateParsing(result);
            case '4.1.2':
                return this.validateNameRoleValue(result);
            default:
                result.status = 'warning';
                result.issues.push('Guideline validation not implemented');
                return result;
        }
    }

    /**
     * Validate 1.1.1 Non-text Content
     */
    validateNonTextContent(result) {
        const images = document.querySelectorAll('img');
        const decorativeImages = document.querySelectorAll('img[alt=""], img[role="presentation"]');
        
        images.forEach((img, index) => {
            const hasAlt = img.hasAttribute('alt');
            const hasAriaLabel = img.hasAttribute('aria-label');
            const hasAriaLabelledby = img.hasAttribute('aria-labelledby');
            const isDecorative = img.getAttribute('alt') === '' || img.getAttribute('role') === 'presentation';
            
            if (!hasAlt && !hasAriaLabel && !hasAriaLabelledby && !isDecorative) {
                result.status = 'fail';
                result.issues.push(`Image ${index + 1} missing alternative text`);
                result.recommendations.push('Add alt attribute or aria-label to provide alternative text');
            }
        });

        // Check other non-text content
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
            const hasTrack = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
            if (!hasTrack) {
                result.status = 'warning';
                result.issues.push(`Video ${index + 1} may need captions or subtitles`);
                result.recommendations.push('Add caption tracks for video content');
            }
        });

        return result;
    }

    /**
     * Validate 1.3.1 Info and Relationships
     */
    validateInfoAndRelationships(result) {
        // Check form labels
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        inputs.forEach((input, index) => {
            const hasLabel = input.getAttribute('aria-label') || 
                           input.getAttribute('aria-labelledby') || 
                           document.querySelector(`label[for="${input.id}"]`);
            
            if (!hasLabel) {
                result.status = 'fail';
                result.issues.push(`Form control ${index + 1} missing label relationship`);
                result.recommendations.push('Associate form controls with labels using for/id or aria-labelledby');
            }
        });

        // Check table headers
        const tables = document.querySelectorAll('table');
        tables.forEach((table, index) => {
            const headers = table.querySelectorAll('th');
            const cells = table.querySelectorAll('td');
            
            if (headers.length === 0 && cells.length > 0) {
                result.status = 'fail';
                result.issues.push(`Table ${index + 1} missing header cells`);
                result.recommendations.push('Use th elements for table headers');
            }
        });

        return result;
    }

    /**
     * Validate 1.3.2 Meaningful Sequence
     */
    validateMeaningfulSequence(result) {
        // Check heading order
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            
            if (level > previousLevel + 1) {
                result.status = 'warning';
                result.issues.push(`Heading level skipped at position ${index + 1} (${heading.tagName})`);
                result.recommendations.push('Use heading levels in sequential order');
            }
            
            previousLevel = level;
        });

        // Check tab order
        const focusableElements = document.querySelectorAll('[tabindex]');
        focusableElements.forEach((element, index) => {
            const tabIndex = parseInt(element.getAttribute('tabindex'));
            if (tabIndex > 0) {
                result.status = 'warning';
                result.issues.push(`Element ${index + 1} uses positive tabindex (${tabIndex})`);
                result.recommendations.push('Avoid positive tabindex values; use document order instead');
            }
        });

        return result;
    }

    /**
     * Validate color contrast (1.4.3 and 1.4.6)
     */
    async validateColorContrast(result, level) {
        const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, label, li, td, th');
        const threshold = level === 'AAA' ? this.colorContrastThresholds.normal.AAA : this.colorContrastThresholds.normal.AA;
        
        for (let i = 0; i < Math.min(textElements.length, 50); i++) { // Limit to 50 elements for performance
            const element = textElements[i];
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = this.getEffectiveBackgroundColor(element);
            
            if (color && backgroundColor) {
                const contrast = this.calculateColorContrast(color, backgroundColor);
                const fontSize = parseFloat(computedStyle.fontSize);
                const fontWeight = computedStyle.fontWeight;
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
                
                const requiredContrast = isLargeText ? 
                    (level === 'AAA' ? this.colorContrastThresholds.large.AAA : this.colorContrastThresholds.large.AA) :
                    threshold;
                
                if (contrast < requiredContrast) {
                    result.status = 'fail';
                    result.issues.push(`Element ${i + 1} has insufficient color contrast: ${contrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`);
                    result.recommendations.push(`Increase color contrast to meet ${level} standards`);
                }
            }
        }

        return result;
    }

    /**
     * Calculate color contrast ratio
     */
    calculateColorContrast(color1, color2) {
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        
        if (!rgb1 || !rgb2) return 21; // Return max contrast if parsing fails
        
        const l1 = this.getRelativeLuminance(rgb1);
        const l2 = this.getRelativeLuminance(rgb2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Parse color string to RGB values
     */
    parseColor(colorStr) {
        const div = document.createElement('div');
        div.style.color = colorStr;
        document.body.appendChild(div);
        const computedColor = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
        return null;
    }

    /**
     * Get relative luminance for color contrast calculation
     */
    getRelativeLuminance(rgb) {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Get effective background color of element
     */
    getEffectiveBackgroundColor(element) {
        let current = element;
        while (current && current !== document.body) {
            const bgColor = window.getComputedStyle(current).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
            }
            current = current.parentElement;
        }
        return 'rgb(255, 255, 255)'; // Default to white
    }

    /**
     * Validate 2.1.1 Keyboard Access
     */
    validateKeyboardAccess(result) {
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [onclick], [onkeydown], [role="button"], [role="link"]');
        
        interactiveElements.forEach((element, index) => {
            const tabIndex = element.getAttribute('tabindex');
            const isNativelyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
            
            if (!isNativelyFocusable && (tabIndex === null || tabIndex === '-1')) {
                result.status = 'fail';
                result.issues.push(`Interactive element ${index + 1} (${element.tagName}) not keyboard accessible`);
                result.recommendations.push('Add tabindex="0" to custom interactive elements');
            }
        });

        return result;
    }

    /**
     * Validate 2.1.2 No Keyboard Trap
     */
    validateNoKeyboardTrap(result) {
        const modals = document.querySelectorAll('.modal, [role="dialog"], [role="alertdialog"]');
        
        modals.forEach((modal, index) => {
            if (modal.style.display !== 'none' && !modal.hidden) {
                const focusableElements = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
                
                if (focusableElements.length === 0) {
                    result.status = 'fail';
                    result.issues.push(`Modal ${index + 1} has no focusable elements - potential keyboard trap`);
                    result.recommendations.push('Ensure modals have focusable elements and proper focus management');
                }
            }
        });

        return result;
    }

    /**
     * Validate 2.4.1 Bypass Blocks
     */
    validateBypassBlocks(result) {
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        const hasSkipToMain = Array.from(skipLinks).some(link => 
            link.textContent.toLowerCase().includes('skip') && 
            (link.textContent.toLowerCase().includes('main') || link.textContent.toLowerCase().includes('content'))
        );
        
        if (!hasSkipToMain) {
            result.status = 'fail';
            result.issues.push('No skip link found for main content');
            result.recommendations.push('Add skip link to main content area');
        }

        return result;
    }

    /**
     * Validate 2.4.2 Page Titled
     */
    validatePageTitled(result) {
        const title = document.querySelector('title');
        
        if (!title || !title.textContent.trim()) {
            result.status = 'fail';
            result.issues.push('Page missing title or title is empty');
            result.recommendations.push('Add descriptive page title');
        } else if (title.textContent.trim().length < 3) {
            result.status = 'warning';
            result.issues.push('Page title may be too short');
            result.recommendations.push('Use descriptive page titles');
        }

        return result;
    }

    /**
     * Validate 2.4.3 Focus Order
     */
    validateFocusOrder(result) {
        const focusableElements = document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        
        let hasPositiveTabIndex = false;
        focusableElements.forEach((element, index) => {
            const tabIndex = parseInt(element.getAttribute('tabindex')) || 0;
            if (tabIndex > 0) {
                hasPositiveTabIndex = true;
                result.status = 'warning';
                result.issues.push(`Element ${index + 1} uses positive tabindex (${tabIndex})`);
            }
        });

        if (hasPositiveTabIndex) {
            result.recommendations.push('Avoid positive tabindex values; use logical document order');
        }

        return result;
    }

    /**
     * Validate 2.4.6 Headings and Labels
     */
    validateHeadingsAndLabels(result) {
        // Check headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            if (!heading.textContent.trim()) {
                result.status = 'fail';
                result.issues.push(`Heading ${index + 1} (${heading.tagName}) is empty`);
                result.recommendations.push('Provide descriptive heading text');
            }
        });

        // Check labels
        const labels = document.querySelectorAll('label');
        labels.forEach((label, index) => {
            if (!label.textContent.trim() && !label.getAttribute('aria-label')) {
                result.status = 'fail';
                result.issues.push(`Label ${index + 1} is empty`);
                result.recommendations.push('Provide descriptive label text');
            }
        });

        return result;
    }

    /**
     * Validate 2.4.7 Focus Visible
     */
    validateFocusVisible(result) {
        // This is a simplified check - proper testing would require actual focus events
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        
        focusableElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const outlineStyle = computedStyle.getPropertyValue('outline-style');
            const outlineWidth = computedStyle.getPropertyValue('outline-width');
            
            if (outlineStyle === 'none' || outlineWidth === '0px') {
                // Check for alternative focus indicators
                const hasBoxShadow = computedStyle.getPropertyValue('box-shadow') !== 'none';
                const hasBorder = computedStyle.getPropertyValue('border-width') !== '0px';
                
                if (!hasBoxShadow && !hasBorder) {
                    result.status = 'warning';
                    result.issues.push(`Element ${index + 1} may lack visible focus indicator`);
                    result.recommendations.push('Ensure all focusable elements have visible focus indicators');
                }
            }
        });

        return result;
    }

    /**
     * Validate remaining guidelines (simplified implementations)
     */
    validateLanguageOfPage(result) {
        const html = document.documentElement;
        if (!html.getAttribute('lang')) {
            result.status = 'fail';
            result.issues.push('Page missing language declaration');
            result.recommendations.push('Add lang attribute to html element');
        }
        return result;
    }

    validateOnFocus(result) {
        // This would require dynamic testing - simplified check
        result.status = 'warning';
        result.issues.push('Manual testing required for focus behavior');
        result.recommendations.push('Test that focus events do not cause unexpected context changes');
        return result;
    }

    validateOnInput(result) {
        // This would require dynamic testing - simplified check
        result.status = 'warning';
        result.issues.push('Manual testing required for input behavior');
        result.recommendations.push('Test that input changes do not cause unexpected context changes');
        return result;
    }

    validateErrorIdentification(result) {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            const errorElements = form.querySelectorAll('.error, [role="alert"], .invalid');
            if (errorElements.length === 0) {
                result.status = 'warning';
                result.issues.push(`Form ${index + 1} may lack error identification mechanism`);
                result.recommendations.push('Implement clear error identification for form validation');
            }
        });
        return result;
    }

    validateLabelsOrInstructions(result) {
        const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
        requiredInputs.forEach((input, index) => {
            const hasRequiredIndicator = input.getAttribute('aria-required') === 'true' ||
                                       input.closest('label')?.textContent.includes('*') ||
                                       input.getAttribute('aria-describedby');
            
            if (!hasRequiredIndicator) {
                result.status = 'warning';
                result.issues.push(`Required field ${index + 1} may lack clear indication`);
                result.recommendations.push('Clearly indicate required form fields');
            }
        });
        return result;
    }

    validateParsing(result) {
        // Basic HTML validation - would need more sophisticated parsing
        const duplicateIds = this.findDuplicateIds();
        if (duplicateIds.length > 0) {
            result.status = 'fail';
            result.issues.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
            result.recommendations.push('Ensure all IDs are unique');
        }
        return result;
    }

    validateNameRoleValue(result) {
        const customElements = document.querySelectorAll('[role]');
        customElements.forEach((element, index) => {
            const role = element.getAttribute('role');
            const hasName = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-labelledby') ||
                          element.textContent.trim();
            
            if (!hasName && ['button', 'link', 'menuitem'].includes(role)) {
                result.status = 'fail';
                result.issues.push(`Element ${index + 1} with role="${role}" missing accessible name`);
                result.recommendations.push('Provide accessible names for interactive elements');
            }
        });
        return result;
    }

    /**
     * Find duplicate IDs in the document
     */
    findDuplicateIds() {
        const ids = {};
        const duplicates = [];
        
        document.querySelectorAll('[id]').forEach(element => {
            const id = element.id;
            if (ids[id]) {
                if (!duplicates.includes(id)) {
                    duplicates.push(id);
                }
            } else {
                ids[id] = true;
            }
        });
        
        return duplicates;
    }

    /**
     * Display validation results
     */
    displayValidationResults(validation) {
        console.group('📋 WCAG 2.1 Compliance Validation Results');
        console.log('Timestamp:', validation.timestamp);
        console.log('URL:', validation.url);
        console.log('Level:', validation.level);
        
        console.group('📊 Summary');
        console.log('Total Guidelines Tested:', validation.summary.total);
        console.log('✅ Passed:', validation.summary.passed);
        console.log('❌ Failed:', validation.summary.failed);
        console.log('⚠️ Warnings:', validation.summary.warnings);
        console.groupEnd();
        
        // Display failed guidelines
        const failedGuidelines = Object.entries(validation.guidelines).filter(([_, result]) => result.status === 'fail');
        if (failedGuidelines.length > 0) {
            console.group('❌ Failed Guidelines');
            failedGuidelines.forEach(([guideline, result]) => {
                console.group(`${guideline}: ${result.description}`);
                result.issues.forEach(issue => console.log('Issue:', issue));
                result.recommendations.forEach(rec => console.log('Recommendation:', rec));
                console.groupEnd();
            });
            console.groupEnd();
        }
        
        // Display warnings
        const warningGuidelines = Object.entries(validation.guidelines).filter(([_, result]) => result.status === 'warning');
        if (warningGuidelines.length > 0) {
            console.group('⚠️ Warnings');
            warningGuidelines.forEach(([guideline, result]) => {
                console.group(`${guideline}: ${result.description}`);
                result.issues.forEach(issue => console.log('Issue:', issue));
                result.recommendations.forEach(rec => console.log('Recommendation:', rec));
                console.groupEnd();
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        
        // Overall compliance status
        const compliancePercentage = (validation.summary.passed / validation.summary.total * 100).toFixed(1);
        if (validation.summary.failed === 0) {
            console.log(`🎉 WCAG 2.1 ${validation.level} Compliance: ${compliancePercentage}% (No critical failures)`);
        } else {
            console.warn(`⚠️ WCAG 2.1 ${validation.level} Compliance: ${compliancePercentage}% (${validation.summary.failed} critical failures)`);
        }
    }

    /**
     * Export validation results
     */
    exportValidationResults() {
        if (this.validationResults.length === 0) {
            console.warn('No validation results available. Run validation first.');
            return null;
        }
        
        const latestResults = this.validationResults[this.validationResults.length - 1];
        const dataStr = JSON.stringify(latestResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `wcag-validation-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return latestResults;
    }
}

// Initialize validator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityValidator = new AccessibilityValidator();
    
    // Add keyboard shortcut for WCAG validation (Ctrl+Alt+W)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'w') {
            e.preventDefault();
            window.accessibilityValidator.validateWCAGCompliance();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityValidator;
}