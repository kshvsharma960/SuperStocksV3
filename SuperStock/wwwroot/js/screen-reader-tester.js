/**
 * Screen Reader Compatibility Testing Suite
 * Tests for screen reader accessibility and ARIA implementation
 */

class ScreenReaderTester {
    constructor() {
        this.testResults = [];
        this.ariaRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'dialog', 'directory', 'document', 'feed', 'figure',
            'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
            'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math',
            'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
            'navigation', 'none', 'note', 'option', 'presentation', 'progressbar',
            'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
            'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
            'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
            'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
            'treeitem'
        ];
        this.landmarkRoles = ['banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search'];
    }

    /**
     * Run comprehensive screen reader compatibility tests
     */
    async runScreenReaderTests() {
        console.log('🔊 Starting screen reader compatibility tests...');
        
        const testResults = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            tests: {}
        };

        // Test 1: ARIA landmarks and structure
        testResults.tests.landmarks = await this.testLandmarks();
        
        // Test 2: ARIA labels and descriptions
        testResults.tests.ariaLabels = await this.testAriaLabels();
        
        // Test 3: ARIA live regions
        testResults.tests.liveRegions = await this.testLiveRegions();
        
        // Test 4: ARIA states and properties
        testResults.tests.ariaStates = await this.testAriaStates();
        
        // Test 5: Semantic HTML structure
        testResults.tests.semanticStructure = await this.testSemanticStructure();
        
        // Test 6: Form accessibility
        testResults.tests.formAccessibility = await this.testFormAccessibility();
        
        // Test 7: Table accessibility
        testResults.tests.tableAccessibility = await this.testTableAccessibility();
        
        // Test 8: Image accessibility
        testResults.tests.imageAccessibility = await this.testImageAccessibility();
        
        // Test 9: Link accessibility
        testResults.tests.linkAccessibility = await this.testLinkAccessibility();

        this.testResults.push(testResults);
        this.displayScreenReaderResults(testResults);
        
        return testResults;
    }

    /**
     * Test ARIA landmarks and page structure
     */
    async testLandmarks() {
        const test = {
            name: 'ARIA Landmarks and Page Structure',
            status: 'pass',
            issues: [],
            landmarksFound: {},
            totalLandmarks: 0
        };

        // Check for essential landmarks
        const essentialLandmarks = {
            main: 'main, [role="main"]',
            navigation: 'nav, [role="navigation"]',
            banner: 'header, [role="banner"]',
            contentinfo: 'footer, [role="contentinfo"]'
        };

        Object.entries(essentialLandmarks).forEach(([landmark, selector]) => {
            const elements = document.querySelectorAll(selector);
            test.landmarksFound[landmark] = elements.length;
            test.totalLandmarks += elements.length;

            if (elements.length === 0) {
                const severity = landmark === 'main' ? 'fail' : 'warning';
                if (test.status !== 'fail') test.status = severity;
                
                test.issues.push({
                    type: 'missing_landmark',
                    landmark: landmark,
                    severity: severity,
                    message: `Missing ${landmark} landmark`,
                    recommendation: `Add ${landmark === 'main' ? '<main>' : landmark === 'navigation' ? '<nav>' : landmark === 'banner' ? '<header>' : '<footer>'} element or role="${landmark}"`
                });
            } else if (elements.length > 1 && landmark !== 'navigation') {
                test.status = 'warning';
                test.issues.push({
                    type: 'multiple_landmarks',
                    landmark: landmark,
                    severity: 'warning',
                    message: `Multiple ${landmark} landmarks found (${elements.length})`,
                    recommendation: `Consider using only one ${landmark} landmark or add aria-label to distinguish them`
                });
            }
        });

        // Check for proper landmark labeling
        const labeledLandmarks = document.querySelectorAll('[role="region"], nav, aside, section');
        labeledLandmarks.forEach((element, index) => {
            const hasLabel = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby');
            const role = element.getAttribute('role') || element.tagName.toLowerCase();
            
            if ((role === 'region' || element.tagName === 'SECTION') && !hasLabel) {
                test.status = 'warning';
                test.issues.push({
                    type: 'unlabeled_landmark',
                    element: this.getElementDescription(element),
                    severity: 'warning',
                    message: `${role} landmark missing accessible name`,
                    recommendation: 'Add aria-label or aria-labelledby to identify the purpose of this landmark'
                });
            }
        });

        return test;
    }

    /**
     * Test ARIA labels and descriptions
     */
    async testAriaLabels() {
        const test = {
            name: 'ARIA Labels and Descriptions',
            status: 'pass',
            issues: [],
            elementsChecked: 0,
            labelIssues: 0
        };

        // Check elements with aria-labelledby
        const labelledByElements = document.querySelectorAll('[aria-labelledby]');
        labelledByElements.forEach((element, index) => {
            test.elementsChecked++;
            const labelIds = element.getAttribute('aria-labelledby').split(' ');
            
            labelIds.forEach(labelId => {
                const labelElement = document.getElementById(labelId.trim());
                if (!labelElement) {
                    test.labelIssues++;
                    test.status = 'fail';
                    test.issues.push({
                        type: 'broken_labelledby',
                        element: this.getElementDescription(element),
                        severity: 'fail',
                        message: `aria-labelledby references non-existent ID: ${labelId}`,
                        recommendation: 'Ensure all IDs referenced by aria-labelledby exist'
                    });
                }
            });
        });

        // Check elements with aria-describedby
        const describedByElements = document.querySelectorAll('[aria-describedby]');
        describedByElements.forEach((element, index) => {
            test.elementsChecked++;
            const descriptionIds = element.getAttribute('aria-describedby').split(' ');
            
            descriptionIds.forEach(descId => {
                const descElement = document.getElementById(descId.trim());
                if (!descElement) {
                    test.labelIssues++;
                    test.status = 'fail';
                    test.issues.push({
                        type: 'broken_describedby',
                        element: this.getElementDescription(element),
                        severity: 'fail',
                        message: `aria-describedby references non-existent ID: ${descId}`,
                        recommendation: 'Ensure all IDs referenced by aria-describedby exist'
                    });
                }
            });
        });

        // Check interactive elements for accessible names
        const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [role="link"]');
        interactiveElements.forEach((element, index) => {
            test.elementsChecked++;
            const hasAccessibleName = this.getAccessibleName(element);
            
            if (!hasAccessibleName) {
                test.labelIssues++;
                test.status = 'fail';
                test.issues.push({
                    type: 'missing_accessible_name',
                    element: this.getElementDescription(element),
                    severity: 'fail',
                    message: 'Interactive element missing accessible name',
                    recommendation: 'Add aria-label, aria-labelledby, or visible text content'
                });
            }
        });

        return test;
    }

    /**
     * Test ARIA live regions
     */
    async testLiveRegions() {
        const test = {
            name: 'ARIA Live Regions',
            status: 'pass',
            issues: [],
            liveRegionsFound: 0,
            recommendedRegions: 0
        };

        const liveRegions = document.querySelectorAll('[aria-live]');
        test.liveRegionsFound = liveRegions.length;

        // Check for recommended live regions
        const politeRegion = document.getElementById('aria-live-polite') || document.querySelector('[aria-live="polite"]');
        const assertiveRegion = document.getElementById('aria-live-assertive') || document.querySelector('[aria-live="assertive"]');

        if (politeRegion) test.recommendedRegions++;
        if (assertiveRegion) test.recommendedRegions++;

        if (!politeRegion) {
            test.status = 'warning';
            test.issues.push({
                type: 'missing_live_region',
                severity: 'warning',
                message: 'No polite live region found for status updates',
                recommendation: 'Add a polite live region for non-urgent announcements'
            });
        }

        if (!assertiveRegion) {
            test.status = 'warning';
            test.issues.push({
                type: 'missing_live_region',
                severity: 'warning',
                message: 'No assertive live region found for urgent announcements',
                recommendation: 'Add an assertive live region for urgent announcements'
            });
        }

        // Check live region implementation
        liveRegions.forEach((region, index) => {
            const ariaLive = region.getAttribute('aria-live');
            const ariaAtomic = region.getAttribute('aria-atomic');
            const ariaRelevant = region.getAttribute('aria-relevant');

            if (!['polite', 'assertive', 'off'].includes(ariaLive)) {
                test.status = 'warning';
                test.issues.push({
                    type: 'invalid_live_value',
                    element: this.getElementDescription(region),
                    severity: 'warning',
                    message: `Invalid aria-live value: ${ariaLive}`,
                    recommendation: 'Use "polite", "assertive", or "off" for aria-live'
                });
            }

            // Check if live region is properly positioned (usually off-screen)
            const rect = region.getBoundingClientRect();
            const style = window.getComputedStyle(region);
            
            if (rect.width > 1 && rect.height > 1 && style.position !== 'absolute' && style.position !== 'fixed') {
                test.status = 'warning';
                test.issues.push({
                    type: 'visible_live_region',
                    element: this.getElementDescription(region),
                    severity: 'warning',
                    message: 'Live region may be visible to sighted users',
                    recommendation: 'Consider positioning live regions off-screen for screen reader only announcements'
                });
            }
        });

        return test;
    }

    /**
     * Test ARIA states and properties
     */
    async testAriaStates() {
        const test = {
            name: 'ARIA States and Properties',
            status: 'pass',
            issues: [],
            elementsChecked: 0,
            stateIssues: 0
        };

        // Check expandable elements
        const expandableElements = document.querySelectorAll('[aria-expanded]');
        expandableElements.forEach((element, index) => {
            test.elementsChecked++;
            const expanded = element.getAttribute('aria-expanded');
            
            if (!['true', 'false'].includes(expanded)) {
                test.stateIssues++;
                test.status = 'fail';
                test.issues.push({
                    type: 'invalid_aria_expanded',
                    element: this.getElementDescription(element),
                    severity: 'fail',
                    message: `Invalid aria-expanded value: ${expanded}`,
                    recommendation: 'Use "true" or "false" for aria-expanded'
                });
            }
        });

        // Check checked elements
        const checkedElements = document.querySelectorAll('[aria-checked]');
        checkedElements.forEach((element, index) => {
            test.elementsChecked++;
            const checked = element.getAttribute('aria-checked');
            
            if (!['true', 'false', 'mixed'].includes(checked)) {
                test.stateIssues++;
                test.status = 'fail';
                test.issues.push({
                    type: 'invalid_aria_checked',
                    element: this.getElementDescription(element),
                    severity: 'fail',
                    message: `Invalid aria-checked value: ${checked}`,
                    recommendation: 'Use "true", "false", or "mixed" for aria-checked'
                });
            }
        });

        // Check disabled elements
        const disabledElements = document.querySelectorAll('[aria-disabled]');
        disabledElements.forEach((element, index) => {
            test.elementsChecked++;
            const disabled = element.getAttribute('aria-disabled');
            
            if (!['true', 'false'].includes(disabled)) {
                test.stateIssues++;
                test.status = 'fail';
                test.issues.push({
                    type: 'invalid_aria_disabled',
                    element: this.getElementDescription(element),
                    severity: 'fail',
                    message: `Invalid aria-disabled value: ${disabled}`,
                    recommendation: 'Use "true" or "false" for aria-disabled'
                });
            }
        });

        // Check hidden elements
        const hiddenElements = document.querySelectorAll('[aria-hidden]');
        hiddenElements.forEach((element, index) => {
            test.elementsChecked++;
            const hidden = element.getAttribute('aria-hidden');
            
            if (!['true', 'false'].includes(hidden)) {
                test.stateIssues++;
                test.status = 'fail';
                test.issues.push({
                    type: 'invalid_aria_hidden',
                    element: this.getElementDescription(element),
                    severity: 'fail',
                    message: `Invalid aria-hidden value: ${hidden}`,
                    recommendation: 'Use "true" or "false" for aria-hidden'
                });
            }

            // Check if focusable elements are hidden
            const focusableChildren = element.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (hidden === 'true' && focusableChildren.length > 0) {
                test.stateIssues++;
                test.status = 'warning';
                test.issues.push({
                    type: 'hidden_focusable_content',
                    element: this.getElementDescription(element),
                    severity: 'warning',
                    message: 'Element with aria-hidden="true" contains focusable content',
                    recommendation: 'Remove focusable elements from aria-hidden containers or use different hiding method'
                });
            }
        });

        return test;
    }

    /**
     * Test semantic HTML structure
     */
    async testSemanticStructure() {
        const test = {
            name: 'Semantic HTML Structure',
            status: 'pass',
            issues: [],
            headingStructure: [],
            semanticElements: 0
        };

        // Check heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            test.headingStructure.push({ level, text: heading.textContent.trim().substring(0, 50) });
            
            if (index === 0 && level !== 1) {
                test.status = 'warning';
                test.issues.push({
                    type: 'no_h1',
                    severity: 'warning',
                    message: 'Page does not start with h1 heading',
                    recommendation: 'Use h1 for the main page heading'
                });
            }
            
            if (level > previousLevel + 1) {
                test.status = 'warning';
                test.issues.push({
                    type: 'skipped_heading_level',
                    element: `${heading.tagName} (${heading.textContent.trim().substring(0, 30)})`,
                    severity: 'warning',
                    message: `Heading level skipped from h${previousLevel} to h${level}`,
                    recommendation: 'Use heading levels in sequential order'
                });
            }
            
            if (!heading.textContent.trim()) {
                test.status = 'fail';
                test.issues.push({
                    type: 'empty_heading',
                    element: heading.tagName,
                    severity: 'fail',
                    message: 'Empty heading found',
                    recommendation: 'Provide descriptive heading text'
                });
            }
            
            previousLevel = level;
        });

        // Check for semantic elements
        const semanticElements = document.querySelectorAll('main, nav, aside, section, article, header, footer');
        test.semanticElements = semanticElements.length;

        if (test.semanticElements === 0) {
            test.status = 'warning';
            test.issues.push({
                type: 'no_semantic_elements',
                severity: 'warning',
                message: 'No HTML5 semantic elements found',
                recommendation: 'Use semantic elements like main, nav, section, article for better structure'
            });
        }

        // Check for proper list structure
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach((list, index) => {
            const listItems = list.children;
            let hasNonListItems = false;
            
            Array.from(listItems).forEach(child => {
                if (child.tagName !== 'LI') {
                    hasNonListItems = true;
                }
            });
            
            if (hasNonListItems) {
                test.status = 'warning';
                test.issues.push({
                    type: 'invalid_list_structure',
                    element: `${list.tagName} #${index + 1}`,
                    severity: 'warning',
                    message: 'List contains non-list-item children',
                    recommendation: 'Only use li elements as direct children of ul/ol'
                });
            }
        });

        return test;
    }

    /**
     * Test form accessibility
     */
    async testFormAccessibility() {
        const test = {
            name: 'Form Accessibility',
            status: 'pass',
            issues: [],
            formsFound: 0,
            inputsChecked: 0,
            labelIssues: 0
        };

        const forms = document.querySelectorAll('form');
        test.formsFound = forms.length;

        forms.forEach((form, formIndex) => {
            // Check form has accessible name
            const formName = form.getAttribute('aria-label') || 
                           form.getAttribute('aria-labelledby') ||
                           form.querySelector('legend, h1, h2, h3, h4, h5, h6');
            
            if (!formName && forms.length > 1) {
                test.status = 'warning';
                test.issues.push({
                    type: 'unlabeled_form',
                    element: `Form #${formIndex + 1}`,
                    severity: 'warning',
                    message: 'Form missing accessible name',
                    recommendation: 'Add aria-label or associate with heading'
                });
            }

            // Check form inputs
            const inputs = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
            inputs.forEach((input, inputIndex) => {
                test.inputsChecked++;
                
                const hasLabel = this.hasFormLabel(input);
                if (!hasLabel) {
                    test.labelIssues++;
                    test.status = 'fail';
                    test.issues.push({
                        type: 'missing_form_label',
                        element: this.getElementDescription(input),
                        severity: 'fail',
                        message: 'Form input missing label',
                        recommendation: 'Associate input with label using for/id or aria-labelledby'
                    });
                }

                // Check required field indication
                if (input.hasAttribute('required')) {
                    const hasRequiredIndicator = input.getAttribute('aria-required') === 'true' ||
                                               input.getAttribute('aria-describedby') ||
                                               this.hasRequiredIndicator(input);
                    
                    if (!hasRequiredIndicator) {
                        test.status = 'warning';
                        test.issues.push({
                            type: 'missing_required_indicator',
                            element: this.getElementDescription(input),
                            severity: 'warning',
                            message: 'Required field not clearly indicated',
                            recommendation: 'Add aria-required="true" or visual indicator for required fields'
                        });
                    }
                }
            });
        });

        return test;
    }

    /**
     * Test table accessibility
     */
    async testTableAccessibility() {
        const test = {
            name: 'Table Accessibility',
            status: 'pass',
            issues: [],
            tablesFound: 0,
            dataTablesFound: 0
        };

        const tables = document.querySelectorAll('table');
        test.tablesFound = tables.length;

        tables.forEach((table, index) => {
            const rows = table.querySelectorAll('tr');
            const headers = table.querySelectorAll('th');
            const cells = table.querySelectorAll('td');

            if (cells.length > 0) {
                test.dataTablesFound++;

                // Check for caption or accessible name
                const hasCaption = table.querySelector('caption') || 
                                 table.getAttribute('aria-label') ||
                                 table.getAttribute('aria-labelledby');
                
                if (!hasCaption) {
                    test.status = 'warning';
                    test.issues.push({
                        type: 'missing_table_caption',
                        element: `Table #${index + 1}`,
                        severity: 'warning',
                        message: 'Table missing caption or accessible name',
                        recommendation: 'Add caption element or aria-label to describe table purpose'
                    });
                }

                // Check for headers
                if (headers.length === 0) {
                    test.status = 'fail';
                    test.issues.push({
                        type: 'missing_table_headers',
                        element: `Table #${index + 1}`,
                        severity: 'fail',
                        message: 'Data table missing header cells',
                        recommendation: 'Use th elements for table headers'
                    });
                }

                // Check header scope attributes
                headers.forEach((header, headerIndex) => {
                    if (!header.getAttribute('scope') && !header.getAttribute('id')) {
                        test.status = 'warning';
                        test.issues.push({
                            type: 'missing_header_scope',
                            element: `Table #${index + 1}, Header #${headerIndex + 1}`,
                            severity: 'warning',
                            message: 'Table header missing scope attribute',
                            recommendation: 'Add scope="col" or scope="row" to table headers'
                        });
                    }
                });

                // Check for complex table structure
                const hasRowspan = table.querySelector('[rowspan]');
                const hasColspan = table.querySelector('[colspan]');
                
                if ((hasRowspan || hasColspan) && !table.querySelector('[headers]')) {
                    test.status = 'warning';
                    test.issues.push({
                        type: 'complex_table_structure',
                        element: `Table #${index + 1}`,
                        severity: 'warning',
                        message: 'Complex table may need headers attribute for cell associations',
                        recommendation: 'Use headers attribute to associate cells with headers in complex tables'
                    });
                }
            }
        });

        return test;
    }

    /**
     * Test image accessibility
     */
    async testImageAccessibility() {
        const test = {
            name: 'Image Accessibility',
            status: 'pass',
            issues: [],
            imagesFound: 0,
            decorativeImages: 0,
            missingAlt: 0
        };

        const images = document.querySelectorAll('img');
        test.imagesFound = images.length;

        images.forEach((img, index) => {
            const hasAlt = img.hasAttribute('alt');
            const altText = img.getAttribute('alt');
            const isDecorative = altText === '' || img.getAttribute('role') === 'presentation';
            
            if (isDecorative) {
                test.decorativeImages++;
            }

            if (!hasAlt) {
                test.missingAlt++;
                test.status = 'fail';
                test.issues.push({
                    type: 'missing_alt_attribute',
                    element: `Image #${index + 1} (${img.src ? img.src.split('/').pop() : 'no src'})`,
                    severity: 'fail',
                    message: 'Image missing alt attribute',
                    recommendation: 'Add alt attribute (empty for decorative images, descriptive for informative images)'
                });
            } else if (altText && altText.length > 125) {
                test.status = 'warning';
                test.issues.push({
                    type: 'long_alt_text',
                    element: `Image #${index + 1}`,
                    severity: 'warning',
                    message: 'Alt text is very long (>125 characters)',
                    recommendation: 'Consider using shorter alt text and longdesc or aria-describedby for detailed descriptions'
                });
            }

            // Check for redundant alt text
            if (altText && (altText.toLowerCase().includes('image of') || altText.toLowerCase().includes('picture of'))) {
                test.status = 'warning';
                test.issues.push({
                    type: 'redundant_alt_text',
                    element: `Image #${index + 1}`,
                    severity: 'warning',
                    message: 'Alt text contains redundant phrases',
                    recommendation: 'Remove phrases like "image of" or "picture of" from alt text'
                });
            }
        });

        return test;
    }

    /**
     * Test link accessibility
     */
    async testLinkAccessibility() {
        const test = {
            name: 'Link Accessibility',
            status: 'pass',
            issues: [],
            linksFound: 0,
            ambiguousLinks: 0,
            emptyLinks: 0
        };

        const links = document.querySelectorAll('a[href]');
        test.linksFound = links.length;

        const linkTexts = new Map();

        links.forEach((link, index) => {
            const linkText = this.getAccessibleName(link);
            
            if (!linkText) {
                test.emptyLinks++;
                test.status = 'fail';
                test.issues.push({
                    type: 'empty_link',
                    element: `Link #${index + 1} (${link.href})`,
                    severity: 'fail',
                    message: 'Link has no accessible text',
                    recommendation: 'Add visible text, aria-label, or alt text for image links'
                });
            } else {
                // Check for ambiguous link text
                const ambiguousTexts = ['click here', 'read more', 'more', 'here', 'link', 'continue'];
                if (ambiguousTexts.some(text => linkText.toLowerCase().includes(text))) {
                    test.ambiguousLinks++;
                    test.status = 'warning';
                    test.issues.push({
                        type: 'ambiguous_link_text',
                        element: `Link #${index + 1}: "${linkText}"`,
                        severity: 'warning',
                        message: 'Link text may be ambiguous out of context',
                        recommendation: 'Use descriptive link text that makes sense when read alone'
                    });
                }

                // Track duplicate link texts
                if (linkTexts.has(linkText)) {
                    linkTexts.set(linkText, linkTexts.get(linkText) + 1);
                } else {
                    linkTexts.set(linkText, 1);
                }
            }

            // Check for new window links
            const opensNewWindow = link.target === '_blank' || 
                                 link.getAttribute('onclick')?.includes('window.open');
            
            if (opensNewWindow) {
                const hasWarning = link.getAttribute('aria-describedby') ||
                                 linkText.includes('opens in new window') ||
                                 linkText.includes('external link');
                
                if (!hasWarning) {
                    test.status = 'warning';
                    test.issues.push({
                        type: 'new_window_no_warning',
                        element: `Link #${index + 1}: "${linkText}"`,
                        severity: 'warning',
                        message: 'Link opens new window without warning',
                        recommendation: 'Indicate that link opens in new window (aria-describedby or text)'
                    });
                }
            }
        });

        // Report duplicate link texts with different destinations
        linkTexts.forEach((count, text) => {
            if (count > 1) {
                const linksWithSameText = Array.from(links).filter(link => 
                    this.getAccessibleName(link) === text
                );
                
                const uniqueDestinations = new Set(linksWithSameText.map(link => link.href));
                
                if (uniqueDestinations.size > 1) {
                    test.status = 'warning';
                    test.issues.push({
                        type: 'duplicate_link_text',
                        element: `"${text}" (${count} links)`,
                        severity: 'warning',
                        message: 'Multiple links with same text but different destinations',
                        recommendation: 'Make link text more specific or add aria-describedby to distinguish links'
                    });
                }
            }
        });

        return test;
    }

    /**
     * Get accessible name for an element
     */
    getAccessibleName(element) {
        // Check aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel.trim();

        // Check aria-labelledby
        const ariaLabelledby = element.getAttribute('aria-labelledby');
        if (ariaLabelledby) {
            const labelElements = ariaLabelledby.split(' ')
                .map(id => document.getElementById(id.trim()))
                .filter(el => el);
            
            if (labelElements.length > 0) {
                return labelElements.map(el => el.textContent).join(' ').trim();
            }
        }

        // Check visible text content
        const textContent = element.textContent?.trim();
        if (textContent) return textContent;

        // Check for image alt text (for image links)
        const img = element.querySelector('img');
        if (img && img.alt) return img.alt.trim();

        // Check title attribute (last resort)
        const title = element.getAttribute('title');
        if (title) return title.trim();

        return '';
    }

    /**
     * Check if form input has proper label
     */
    hasFormLabel(input) {
        // Check for aria-label
        if (input.getAttribute('aria-label')) return true;

        // Check for aria-labelledby
        if (input.getAttribute('aria-labelledby')) return true;

        // Check for associated label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return true;
        }

        // Check for wrapping label
        const parentLabel = input.closest('label');
        if (parentLabel) return true;

        // Check for placeholder (not ideal but sometimes used)
        if (input.getAttribute('placeholder')) return true;

        return false;
    }

    /**
     * Check if input has required field indicator
     */
    hasRequiredIndicator(input) {
        const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        if (label && (label.textContent.includes('*') || label.textContent.includes('required'))) {
            return true;
        }

        const describedBy = input.getAttribute('aria-describedby');
        if (describedBy) {
            const description = document.getElementById(describedBy);
            if (description && description.textContent.toLowerCase().includes('required')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get element description for reporting
     */
    getElementDescription(element) {
        let description = element.tagName.toLowerCase();
        
        if (element.id) {
            description += `#${element.id}`;
        }
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2);
            if (classes.length > 0) {
                description += `.${classes.join('.')}`;
            }
        }
        
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
            const shortText = text.substring(0, 30);
            description += ` ("${shortText}${text.length > 30 ? '...' : ''}")`;
        }
        
        return description;
    }

    /**
     * Display screen reader test results
     */
    displayScreenReaderResults(results) {
        console.group('🔊 Screen Reader Compatibility Test Results');
        console.log('Timestamp:', results.timestamp);
        console.log('URL:', results.url);
        
        Object.entries(results.tests).forEach(([testName, testResult]) => {
            const status = testResult.status === 'pass' ? '✅' : 
                          testResult.status === 'warning' ? '⚠️' : '❌';
            
            console.group(`${status} ${testResult.name}`);
            console.log('Status:', testResult.status);
            
            // Display test-specific metrics
            if (testResult.landmarksFound) {
                console.log('Landmarks found:', testResult.landmarksFound);
            }
            if (testResult.elementsChecked !== undefined) {
                console.log('Elements checked:', testResult.elementsChecked);
            }
            if (testResult.liveRegionsFound !== undefined) {
                console.log('Live regions found:', testResult.liveRegionsFound);
            }
            
            if (testResult.issues.length > 0) {
                console.group(`Issues Found (${testResult.issues.length})`);
                testResult.issues.forEach(issue => {
                    const severity = issue.severity === 'fail' ? '❌' : '⚠️';
                    console.group(`${severity} ${issue.type || 'Issue'}`);
                    if (issue.element) console.log('Element:', issue.element);
                    console.log('Message:', issue.message);
                    console.log('Recommendation:', issue.recommendation);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
        
        // Summary
        const totalTests = Object.keys(results.tests).length;
        const passedTests = Object.values(results.tests).filter(test => test.status === 'pass').length;
        const failedTests = Object.values(results.tests).filter(test => test.status === 'fail').length;
        
        console.log(`📊 Screen Reader Compatibility Summary: ${passedTests}/${totalTests} tests passed`);
        if (failedTests > 0) {
            console.warn(`⚠️ ${failedTests} critical screen reader compatibility issues found`);
        }
    }

    /**
     * Export screen reader test results
     */
    exportResults() {
        if (this.testResults.length === 0) {
            console.warn('No test results available. Run screen reader tests first.');
            return null;
        }
        
        const latestResults = this.testResults[this.testResults.length - 1];
        const dataStr = JSON.stringify(latestResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `screen-reader-test-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return latestResults;
    }
}

// Initialize screen reader tester when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.screenReaderTester = new ScreenReaderTester();
    
    // Add keyboard shortcut for screen reader testing (Ctrl+Alt+S)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 's') {
            e.preventDefault();
            window.screenReaderTester.runScreenReaderTests();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenReaderTester;
}