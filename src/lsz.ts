/**
 * @file
 * LSZ - Lukassz111 Basic Addon Library.
 * Can be used without any other dependencies.
 * 
 * Conventions:
 * - Class names start with a capital letter.
 */

interface LszBehavior {
    name: string;
    description: string;
    /** Callback for the whole page load */
    callbackForPage: (lsz: Lsz) => void;
    /** Callback for a specific element */
    callbackForElement: (lsz: Lsz, element: HTMLElement) => void;
    triggerOnElementsWithClass: Array<string>;
    triggerOnElementsWithAttribute: Array<string>;
    ignoreTriggerAttributes: Array<string>;
    triggerOnWindowResize: boolean;
}

interface LszLangFunction {
    name: string;
    callback: (...args: Array<any>) => any;
}
interface LszLangFunctionWithElement {
    name: string;
    callback: (element: HTMLElement, ...args: Array<any>) => any;
}

interface LszConditionalClassRule {
    class: string;
    condition: string;
}

/** Main class */
export class Lsz {
    /** Singleton code */
    private static instance: Lsz|null = null;

    public static getInstance(): Lsz {
        if (Lsz.instance === null) {
            Lsz.instance = new Lsz();
        }
        return Lsz.instance;
    }

    public static start(): void {
        Lsz.getInstance();
    }

    /**
     * Debug code
     */
    public static isDebugMode(): boolean {
        return true;
    }
    public static debugLog(...args: any[]): void {
        if (Lsz.isDebugMode()) {
            console.log('[LSZ DEBUG]:', ...args);
        }
    }
    public static debugLogForBehavior(behaviorName: string, ...args: any[]): void {
        let muttedBehaviorsName: Array<string> = ['html-content','conditional-class'];
        if(muttedBehaviorsName.indexOf(behaviorName) !== -1) {
            return;
        }
        if (Lsz.isDebugMode()) {
            console.log(`[LSZ DEBUG][Behavior: ${behaviorName}]:`, ...args);
        }
    }

    public static debugLogForMutationObserver(...args: any[]): void {
        const muted = true;
        if(muted) {
            return;
        }
        if (Lsz.isDebugMode()) {
            console.log('[LSZ DEBUG][MutationObserver]:', ...args);
        }
    }

    /** Main code */
    private mutationsObserver: MutationObserver|null = null;

    private constructor() {
        // Private constructor to prevent direct instantiation.
        this.mutationsObserver = new MutationObserver((mutationsList) => {
            
            mutationsList.forEach((mutation) => {
                if(mutation.type === 'childList') {
                    this.behaviors.forEach((behavior) => {
                        mutation.addedNodes.forEach((node) => {
                            if(node instanceof HTMLElement) {
                                if(behavior.triggerOnElementsWithAttribute.some((attributeName) => node.hasAttribute(attributeName)) ||
                                   behavior.triggerOnElementsWithClass.some((className) => node.classList.contains(className))) {
                                    Lsz.debugLogForMutationObserver('Triggering behavior for added element:', {
                                        behavior: behavior.name,
                                        element: node
                                    });
                                    if(behavior.ignoreTriggerAttributes.some((ignoreAttribute) => node.hasAttribute(ignoreAttribute))) {
                                        Lsz.debugLogForMutationObserver('Ignoring behavior for added element due to ignoreTriggerAttributes:', {
                                            behavior: behavior.name,
                                            element: node
                                        });
                                    } else {
                                        behavior.callbackForElement(this, node);
                                    }
                                }
                            }
                        });
                        if(mutation.target instanceof HTMLElement) {
                            const target = mutation.target as HTMLElement;
                            if(behavior.triggerOnElementsWithAttribute.some((attributeName) => target.hasAttribute(attributeName)) ||
                               behavior.triggerOnElementsWithClass.some((className) => target.classList.contains(className))) {
                                Lsz.debugLogForMutationObserver('Triggering behavior for target element due to childList mutation:', {
                                    behavior: behavior.name,
                                    element: target
                                });
                                if(behavior.ignoreTriggerAttributes.some((ignoreAttribute) => target.hasAttribute(ignoreAttribute))) {
                                    Lsz.debugLogForMutationObserver('Ignoring behavior for added element due to ignoreTriggerAttributes:', {
                                        behavior: behavior.name,
                                        element: target
                                    });
                                } else {
                                    behavior.callbackForElement(this, target);
                                }
                            }
                        }
                    });
                }
                else if(mutation.type === 'attributes' || mutation.type === 'characterData') {
                    if(mutation.attributeName === this.getAttributeNameforlszOnce()) {
                        // Ignore mutations for lsz-once attribute
                        return;
                    }
                    const attributeName = mutation.attributeName || '';
                    const target = mutation.target as HTMLElement;

                    this.behaviors.forEach((behavior) => {
                        if(behavior.ignoreTriggerAttributes.indexOf(attributeName) !== -1) {
                            Lsz.debugLogForMutationObserver('Ignoring behavior for element due to ignoreTriggerAttributes:', {
                                behavior: behavior.name,
                                attributeName: attributeName,
                                element: target
                            });
                            return;
                        }
                        if(behavior.triggerOnElementsWithAttribute.indexOf(attributeName) !== -1 || behavior.triggerOnElementsWithAttribute.indexOf('*') !== -1) {
                            Lsz.debugLogForMutationObserver('Triggering behavior for element due to attribute mutation:', {
                                behavior: behavior.name,
                                attributeName: attributeName,
                                element: target
                            });
                            behavior.callbackForElement(this, target);
                        } else if(behavior.triggerOnElementsWithClass.some((className) => target.classList.contains(className))) {
                            Lsz.debugLogForMutationObserver('Triggering behavior for element due to class mutation:', {
                                behavior: behavior.name,
                                element: target
                            });
                            behavior.callbackForElement(this, target);
                        }
                    });

                } else {

                    Lsz.debugLogForMutationObserver('Mutation observed:', {
                        type: mutation.type,
                    });
                }
            });

        });
        this.mutationsObserver.observe(document.body, { 
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        this.createInitialBehavior();

        // Run behaviors when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
            this.runBehaviors();
            });
        } else {
            // DOM already loaded
            this.runBehaviors();
        }
    }

    /** Utility functions */
    
    /** 
     *  Mainpulate classes 
     */
    public htmlElementAddClassIfNotExists(element: HTMLElement, className: string): void {
        if (!element.classList.contains(className)) {
            element.classList.add(className);
        }
    }
    
    public htmlElementRemoveClassIfExists(element: HTMLElement, className: string): void {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    }


    /**
     * Prepare the class names with the prefix.
     */
    public prepareClassName(className: string): string {
        return 'lsz-' + className;
    }

    /**
     * Prepare the attribute names with the prefix.
     */
    public prepareAttributeName(attributeName: string): string {
        return 'data-lsz-' + attributeName;
    }

    public getAttributeNameforlszOnce(): string {
        return this.prepareAttributeName('once');
    }
    /**
     * Simple once function to ensure a block of code runs only once per unique ID.
     * @param {Array<HTMLElement>} htmlElements - The elements to process.
     * @param {string} uniqueId - A unique identifier for the once operation.
     * @returns Array<HTMLElement> - The elements that have not been processed yet.
     */
    public lszOnce(htmlElements: Array<HTMLElement>, uniqueId: string): Array<HTMLElement> {
        const attribName = this.getAttributeNameforlszOnce();
        
        htmlElements.filter(function (element) {
            if(element.hasAttribute(attribName)) {
                let attribValue = element.getAttribute(attribName) || '';
                let processedIds = attribValue.split(' ');
                if (processedIds.indexOf(uniqueId) !== -1) {
                    return false; // Already processed
                } else {
                    // Mark as processed
                    processedIds.push(uniqueId);
                    element.setAttribute(attribName, processedIds.join(' '));
                    return true; // Not processed yet
                }
            } else {
                element.setAttribute(attribName, uniqueId);
                return true; // Not processed yet
            }
        });
        return htmlElements;
    }
    /** Once implementation */
    /**
     * Wrapper for lszOnce to use CSS selector directly.
     * @param { string } selector - The CSS selector to find elements. 
     * @param { string } uniqueId - A unique identifier for the once operation.
     * @returns Array<HTMLElement> - The elements that have not been processed yet.
     */
    public lszOnceSelector(selector: string, uniqueId: string): Array<HTMLElement> {
        return this.lszOnce([...document.querySelectorAll<HTMLElement>(selector)], uniqueId);
    }

    /**
     * Wrapper for lszOnce to use CSS class as selector directly.
     * @param { string } className - The CSS class name to find elements.
     * @param { string } uniqueId - A unique identifier for the once operation.
     * @returns Array<HTMLElement> - The elements that have not been processed yet. 
     */
    public lszOnceClass(className: string, uniqueId: string): Array<HTMLElement> {
        const selector = '.' + className
        return this.lszOnceSelector(selector, uniqueId);
    }
    /**
     * Wrapper for lszOnce to use CSS attribute as selector directly.
     * @param { string } attributeName - The CSS attribute name to find elements.
     * @param { string } uniqueId - A unique identifier for the once operation.
     * @returns Array<HTMLElement> - The elements that have not been processed yet. 
     */
    public lszOnceAttribute(attributeName: string, uniqueId: string): Array<HTMLElement> {
        const selector = '[' + attributeName + ']'
        return this.lszOnceSelector(selector, uniqueId);
    }

    /** Selects html elements */

    /**
     * Select elements from the given array that have the specified class.
     * @param { Array<HTMLElement> } htmlElements - The elements to filter.
     * @param { string } className - The class name to filter by.
     * @returns Array<HTMLElement> - The filtered elements.
     */
    public selectElementsWithClass(htmlElements: Array<HTMLElement>, className: string): Array<HTMLElement> {
        // Placeholder for future filtering logic
        return htmlElements.filter((element) => element.classList.contains(className));
    }

    /**
     * Select elements from the given array that have the specified attribute.
     * @param { Array<HTMLElement> } htmlElements - The elements to filter.
     * @param { string } attributeName - The attribute name to filter by.
     * @returns Array<HTMLElement> - The filtered elements.
     */
    public selectElementsWithAttribute(htmlElements: Array<HTMLElement>, attributeName: string): Array<HTMLElement> {
        // Placeholder for future filtering logic
        return htmlElements.filter((element) => element.hasAttribute(attributeName));
    }

    /** Embbeded lang */

    /**
     * Function to map LszLangFunctionWithElement to LszLangFunction by binding the element.
     * @param element 
     * @param fnList 
     * @returns 
     */
    private mapFunctionsWithElementToBasic(element: HTMLElement, fnList: Array<LszLangFunctionWithElement>): Array<LszLangFunction> {
        return fnList.map((fn) => {
            return {
                name: fn.name,
                callback: (...args: Array<any>) => {
                    return fn.callback(element, ...args);
                }
            };
        });
    }


    private functionsHtmlCodeElement: Array<LszLangFunctionWithElement> = [
        {
            name: 'attr',
            callback: (element: HTMLElement, args: Array<string>|string) => {
                let attribName = '';
                if (Array.isArray(args)) {
                    const attributeName = args[0] || '';
                }
                else {
                    attribName = args;
                }
                // console.log('attr function called with attribName:', attribName, 'on element:', element);
                
                return element.getAttribute(attribName) || '';
            }
        },
        {
            name: 'isParentOf',
            callback: (element: HTMLElement, args: Array<string>|string) => {
                let selector = '';
                if (Array.isArray(args)) {
                    selector = args[0] || '';
                }
                else {
                    selector = args;
                }
                return [...element.querySelectorAll(selector)].filter((el) => {
                    return el.parentElement === element;
                }).length > 0;
            }
        },
        {
            name: 'isAncestorOf',
            callback: (element: HTMLElement, args: Array<string>|string) => {
                let selector = '';
                if (Array.isArray(args)) {
                    selector = args[0] || '';
                }
                else {
                    selector = args;
                }
                return element.querySelector(selector) !== null;
            }
        }
    ];


    private evaluateExpression(exporession: string, langFunctions: Array<LszLangFunction>): any {
        // console.log('Evaluating expression:', exporession, langFunctions);
        let cpExpression = exporession;
        for(const langFunction of langFunctions) {
            const functionRegex = new RegExp(langFunction.name + '\\((.*?)\\)', 'g');
            let match;
            let iterationSafetyCounter = 0;
            while ((match = functionRegex.exec(cpExpression)) !== null) {
                // console.log('Found function match:', match, 'for expression:', cpExpression);
                const fullMatch = match[0];
                const argsString = match[1];
                
                const result = langFunction.callback(argsString).toString()
                    .replace(/{/g, '&lcub;')
                    .replace(/}/g, '&rcub;');
                cpExpression = cpExpression.replace(fullMatch, result);

                iterationSafetyCounter++;
                
                if(iterationSafetyCounter > 1000) {
                    console.warn('Potential infinite loop detected in evaluateExpression for function:', langFunction.name);
                    break;
                }
            }
        }
        return cpExpression;
    }

    /**
     * Run embedded HTML code in the context of the given element.
     * It's use {{ }} for expressions.
     * @param element 
     * @param code 
     * @returns 
     */
    public evaluateHtmlCodeElement(element: HTMLElement, code: string): string {

        const langFunctions = this.mapFunctionsWithElementToBasic(element, this.functionsHtmlCodeElement);
            

        let expressionsMatch = code.match(/{{(.*?)}}/g);
        for(const expressionMatch of expressionsMatch || []) {
            const expressionCode = expressionMatch.slice(2, -2).trim();
            const result = this.evaluateExpression(expressionCode, langFunctions);
            code = code.replace(expressionMatch, result);

        }
        return code; 
    }

    public evaluateConditionCodeElement(element: HTMLElement, code: string): boolean {
        const langFunctions = this.mapFunctionsWithElementToBasic(element, this.functionsHtmlCodeElement);
        const simplifiedParts: Map<RegExp, string> = new Map();

        // Run functions
        langFunctions.forEach((langFunction) => {
            const functionRegex = new RegExp(langFunction.name + '\\((.*?)\\)');
            let match: RegExpExecArray | null = null;
            do {
                match = functionRegex.exec(code);
                if (match != null) {
                    const fullMatch = match[0];
                    const argsString = match[1];
                    const callFunctionResult = langFunction.callback(argsString) ? 'true()' : 'false()';
                    code = code.replace(fullMatch, callFunctionResult);
                }
            } while (match != null);
        });


        // Simplify logical operators
        simplifiedParts.set(/not\s{1,}true\(\)/, 'false()');
        simplifiedParts.set(/not\s{1,}false\(\)/, 'true()');
        simplifiedParts.set(/true\(\)\s{1,}or\s{1,}true\(\)/, 'true()');
        simplifiedParts.set(/true\(\)\s{1,}or\s{1,}false\(\)/, 'true()');
        simplifiedParts.set(/false\(\)\s{1,}or\s{1,}true\(\)/, 'true()');
        simplifiedParts.set(/false\(\)\s{1,}or\s{1,}false\(\)/, 'false()');
        simplifiedParts.set(/true\(\)\s{1,}and\s{1,}true\(\)/, 'true()');
        simplifiedParts.set(/true\(\)\s{1,}and\s{1,}false\(\)/, 'false()');
        simplifiedParts.set(/false\(\)\s{1,}and\s{1,}true\(\)/, 'false()');
        simplifiedParts.set(/false\(\)\s{1,}and\s{1,}false\(\)/, 'false()');
        simplifiedParts.set(/\(\s{1,}false\(\)\s{1,}\)/, 'false()');
        simplifiedParts.set(/\(\s{1,}true\(\)\s{1,}\)/, 'true()');

        const simplifyCode = (codeToSimplify: string): string => {
            let oldCode = codeToSimplify;
            let currentCode = codeToSimplify;
            do {
                oldCode = currentCode;
                simplifiedParts.forEach((replacement, regex) => {
                    currentCode = currentCode.replace(regex, replacement);
                });
            } while(oldCode !== currentCode);
            return currentCode;
        }
        code = simplifyCode(code);


        if(code.trim() === 'true()') {
            return true;
        } else {
            return false;
        }


    }


    private behaviors: Array<LszBehavior> = [];
    private createInitialBehavior() {

        /**
         * Behavior: css-scroll
         * Description: When an element with class 'lsz-css-scroll' is scrolled,
         * it adds/removes classes 'lsz-scroll-at-top' and 'lsz-scrolled' based on scroll position.
         * Usage: Add class 'lsz-css-scroll' to any element to enable this behavior.
         * 
         * 
         */
        (() => {
            const onElementScrollSelectorClass = this.prepareClassName('css-scroll');
            const onElementScrollClassNameForScrollAtTop = this.prepareClassName('scroll-at-top');
            const onElementScrollClassNameForScrolled = this.prepareClassName('scrolled');
            const onElementScrollClassNameForScrolledProcess = (target: HTMLElement|Window) => {

                let element: HTMLElement|null = null;
                let scrollTop = 0;
                if(target instanceof HTMLElement) {
                    element = target;
                    scrollTop = element.scrollTop;
                } else {
                    element = document.querySelector('body') as HTMLElement;
                    scrollTop = window.scrollY || document.documentElement.scrollTop;
                }
                const computedStyle = window.getComputedStyle(element);

                const scrollPaddingTop = parseFloat(computedStyle.scrollPaddingTop) || 0;
                const isMaxScrolledUp = (scrollTop <= scrollPaddingTop * 1.1); // Adding a small tolerance
                if(isMaxScrolledUp) {
                    this.htmlElementAddClassIfNotExists(element, onElementScrollClassNameForScrollAtTop);
                    this.htmlElementRemoveClassIfExists(element, onElementScrollClassNameForScrolled);
                } else {
                    this.htmlElementAddClassIfNotExists(element, onElementScrollClassNameForScrolled);
                    this.htmlElementRemoveClassIfExists(element, onElementScrollClassNameForScrollAtTop);
                }
            };
            const onElementScrollListenerClass = (event: Event) => {
                const target = event.currentTarget;
                onElementScrollClassNameForScrolledProcess(target as HTMLElement|Window);
            };

            this.behaviors.push({
                
                name: 'css-scroll',
                description: 'When an element with class dispatches event scroll on itself.',
                callbackForPage: (lsz: Lsz) => {
                    lsz.lszOnceClass(onElementScrollSelectorClass, 'css-scroll-initialized').forEach((element) => {
                        // console.log('Adding scroll listener to element:', element);
                        if(element.tagName.toUpperCase() === 'BODY') {
                            window.addEventListener('scroll', onElementScrollListenerClass);
                            onElementScrollClassNameForScrolledProcess(window);
                        } else {
                            element.addEventListener('scroll', onElementScrollListenerClass);
                            onElementScrollClassNameForScrolledProcess(element);
                        }
                    });
                },
                callbackForElement: (lsz: Lsz, element: HTMLElement) => {
                    lsz.lszOnce(lsz.selectElementsWithClass([element], onElementScrollSelectorClass), 'css-scroll-initialized').forEach((el) => {
                        // console.log('Adding scroll listener to element:', element);
                        if(element.tagName.toUpperCase() === 'BODY') {
                            window.addEventListener('scroll', onElementScrollListenerClass);
                            onElementScrollClassNameForScrolledProcess(window);
                        } else {
                            element.addEventListener('scroll', onElementScrollListenerClass);
                            onElementScrollClassNameForScrolledProcess(element);
                        }
                    });
                },
                triggerOnElementsWithClass: [onElementScrollSelectorClass],
                triggerOnElementsWithAttribute: [],
                ignoreTriggerAttributes: [],
                triggerOnWindowResize: false
            });
        })();


        /**
         * Behavior: html-content
         * Description: Set innerHTML of element with attribute value 'data-lsz-html-content' to the attribute's value.
         * Usage: Add attribute 'data-lsz-html-content' to any element to enable this behavior.
         */
        (() => {
            const attributeName = this.prepareAttributeName('html-content');
            const attriubteNameLock = this.prepareAttributeName('html-content-locked');
            const processFuncElement = (lsz: Lsz, element: HTMLElement) => {
                if(element.hasAttribute(attriubteNameLock)) {
                    Lsz.debugLogForBehavior('html-content', 'Element is locked, skipping processing for element:', element);
                    return;
                }
                element.setAttribute(attriubteNameLock, '1');

                
                Lsz.debugLogForBehavior('html-content', 'Processing html-content for element:', element);
                const content = element.getAttribute(attributeName) || '';
                const newInnerHtml = lsz.evaluateHtmlCodeElement(element, content);
                if(element.innerHTML !== newInnerHtml) {
                    element.innerHTML = newInnerHtml;
                    Lsz.debugLogForBehavior('html-content', 'Updated innerHTML for element:', element);
                }

                setTimeout(() => {
                    element.removeAttribute(attriubteNameLock);
                }, 100);
            }
            this.behaviors.push({
                name: 'html-content',
                description: 'Set innerHTML of element with attribute value \'data-lsz-html-content\' to the attribute\'s value.',
                callbackForPage: (lsz: Lsz) => {
                    document.querySelectorAll<HTMLElement>('[' + attributeName + ']').forEach((element) => {
                        processFuncElement(lsz, element);
                    });
                },
                callbackForElement: (lsz: Lsz, element: HTMLElement) => {
                    lsz.selectElementsWithAttribute([element], attributeName).forEach((el) => {
                        processFuncElement(lsz, el);
                    });
                },
                triggerOnElementsWithClass: [],
                triggerOnElementsWithAttribute: [attributeName,'*'],
                ignoreTriggerAttributes: [attriubteNameLock],
                triggerOnWindowResize: false
            });
        })(); 


        /**
         * Behavior: coditional-class
         * Description: Add or remove classes based on conditions defined in 'data-lsz-conditional-class' attribute.
         * Usage: Add attribute 'data-lsz-conditional-class' to any element to enable this behavior.
         */
        (() => {
            const attributeName = this.prepareAttributeName('conditional-class');
            const processFuncElement = (lsz: Lsz, element: HTMLElement) => {
                const content = element.getAttribute(attributeName) || '';
                const conditions: Array<LszConditionalClassRule> = JSON.parse(content);
                conditions.forEach((condition) => {
                    const className = condition.class;
                    const conditionExp = condition.condition;
                    Lsz.debugLogForBehavior('conditional-class', 'Processing conditional-class for element:', element, 'with condition:', condition);
                    const resultOfCondition = this.evaluateConditionCodeElement(element, conditionExp);
                    if(resultOfCondition) {
                        lsz.htmlElementAddClassIfNotExists(element, className);
                        Lsz.debugLogForBehavior('conditional-class', `Added class '${className}' to element:`, element);
                    } else {
                        lsz.htmlElementRemoveClassIfExists(element, className);
                        Lsz.debugLogForBehavior('conditional-class', `Removed class '${className}' from element:`, element);
                    }
                    // const shouldHaveClass = (evalResult === 'true' || evalResult === '1');
                });
                // Lsz.debugLogForBehavior('conditional-class', 'Processing conditional-class for element:', element, 'with conditions:', conditions);
                
            };
            this.behaviors.push({
                name: 'conditional-class',
                description: 'Add or remove classes based on conditions defined in \'data-lsz-conditional-class\' attribute.',
                callbackForPage: (lsz: Lsz) => {
                    let elements = Array.from(document.querySelectorAll<HTMLElement>('[' + attributeName + ']'));
                    // Lsz.debugLogForBehavior('conditional-class', 'Processing conditional-class for page.',elements);
                    document.querySelectorAll<HTMLElement>('[' + attributeName + ']').forEach((element) => {
                        // Lsz.debugLogForBehavior('conditional-class', 'X Processing conditional-class for element:', element);
                        processFuncElement(lsz, element);
                    });
                },
                callbackForElement: (lsz: Lsz, element: HTMLElement) => {
                    // Lsz.debugLogForBehavior('conditional-class', 'Processing conditional-class for element:', element);
                    lsz.selectElementsWithAttribute([element], attributeName).forEach((el) => {
                        // Lsz.debugLogForBehavior('conditional-classXXX', 'X Processing conditional-class for element:', element);
                        processFuncElement(lsz, el);
                    });
                },
                triggerOnElementsWithClass: [],
                triggerOnElementsWithAttribute: [attributeName,'*'],
                ignoreTriggerAttributes: [],
                triggerOnWindowResize: false
            });
        })();

        


        /**
         * Behavior: fetch-html-content
         * Description: Set innerHTML of element with attribute value 'data-lsz-fetch-html-content' to the attribute's value.
         * Usage: Add attribute 'data-lsz-fetch-html-content' to any element to enable this behavior.
         */
        (() => {
            const attributeName = this.prepareAttributeName('fetch-html-content');
            const attriubteNameLock = this.prepareAttributeName('fetch-html-content-locked');
            const processFuncElement = (lsz: Lsz, element: HTMLElement) => {
                let attribValue = element.getAttribute(attributeName) || '';
                if(element.hasAttribute(attriubteNameLock) && attribValue.trim() == (element.getAttribute(attriubteNameLock) || '').trim()) {
                    Lsz.debugLogForBehavior('fetch-html-content', 'Element is locked, skipping processing for element:', element);
                    return;
                }
                element.setAttribute(attriubteNameLock, attribValue);
                if(attribValue.trim() === '') {
                    Lsz.debugLogForBehavior('fetch-html-content', 'Attribute value is empty, skipping processing for element:', element);
                    return;
                }
                let url = new URL(attribValue, window.location.href);
                fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'text/html'
                    }
                }).then((response) => {
                    if(!response.ok) {
                        Lsz.debugLogForBehavior('fetch-html-content', 'Fetch error, response not ok for URL:', url.toString(), 'Status:', response.status);
                        element.removeAttribute(attriubteNameLock);
                    } else {
                        return response.text();
                    }
                }).then((htmlContent) => {
                    if(element.innerHTML !== htmlContent && typeof htmlContent === 'string') {
                        element.innerHTML = htmlContent;
                        Lsz.debugLogForBehavior('fetch-html-content', 'Updated innerHTML for element:', element);
                    }
                }).catch((error) => {
                    console.error('Fetch error for URL:', url.toString(), error);
                    element.removeAttribute(attriubteNameLock);
                });
                    

                Lsz.debugLogForBehavior('fetch-html-content', 'Processing fetch-html-content for element:', element, 'with URL:', url.toString());
                
            }
            this.behaviors.push({
                name: 'fetch-html-content',
                description: 'Set innerHTML of element with attribute value \'data-lsz-fetch-html-content\' to the attribute\'s value.',
                callbackForPage: (lsz: Lsz) => {
                    document.querySelectorAll<HTMLElement>('[' + attributeName + ']').forEach((element) => {
                        processFuncElement(lsz, element);
                    });
                },
                callbackForElement: (lsz: Lsz, element: HTMLElement) => {
                    lsz.selectElementsWithAttribute([element], attributeName).forEach((el) => {
                        processFuncElement(lsz, el);
                    });
                },
                triggerOnElementsWithClass: [],
                triggerOnElementsWithAttribute: [attributeName,'*'],
                ignoreTriggerAttributes: [attriubteNameLock],
                triggerOnWindowResize: false
            });
        })(); 

    }

    
    
    runBehaviors() {
        // Run page-level behaviors
        this.behaviors.forEach((behavior) => {
            behavior.callbackForPage(this);
        });
    }
}