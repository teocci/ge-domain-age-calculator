import punycode from './punycode.js'

/**
 * Represents a parsed rule from the Public Suffix List (PSL).
 *
 * @typedef {object} PSLRule
 * @property {string} rule The original rule string from the PSL.
 * @property {string} suffix The suffix portion of the rule (without leading '*' or '!').
 * @property {?string} punySuffix The Punycode-encoded version of the suffix. null if not yet calculated. This is calculated lazily.
 * @property {boolean} wildcard Indicates whether the rule is a wildcard rule (starts with '*').
 * @property {boolean} exception Indicates whether the rule is an exception rule (starts with '!').
 */

const RULES_FILE = 'scripts/rules.json'

const errorCodes = {
    DOMAIN_TOO_SHORT: 'Domain name too short.',
    DOMAIN_TOO_LONG: 'Domain name too long. It should be no more than 255 chars.',
    LABEL_STARTS_WITH_DASH: 'Domain name label can not start with a dash.',
    LABEL_ENDS_WITH_DASH: 'Domain name label can not end with a dash.',
    LABEL_TOO_LONG: 'Domain name label should be at most 63 chars long.',
    LABEL_TOO_SHORT: 'Domain name label should be at least 1 character long.',
    LABEL_INVALID_CHARS: 'Domain name label can only contain alphanumeric characters or dashes.',
}

const endsWith = (str, suffix) => str.indexOf(suffix, str.length - suffix.length) !== -1

/**
 * The list of rules from the Public Suffix List.
 * @type {PSLRule[]}
 */
let preparedRules = []

const rulesFile = chrome.runtime.getURL('scripts/rules.json')
console.log('punycode:', punycode.version)

fetch(RULES_FILE)
    .then((response) => response.json())
    .then(rules => {
        preparedRules = rules.map(rule => ({
            rule,
            suffix: rule.replace(/^(\*\.|\!)/, ''),
            punySuffix: null,
            wildcard: rule.startsWith('*'),
            exception: rule.startsWith('!'),
        }))
    })

const findRule = (domain) => {
    console.log('Domain:', domain)
    console.log({punycode})
    if (!punycode) return null

    const asciiDomain = punycode.toASCII(domain)

    return preparedRules.reduce((acc, rule) => {
        rule.punySuffix = rule.punySuffix === null ? punycode.toASCII(rule.suffix) : rule.punySuffix

        return endsWith(asciiDomain, `.${rule.punySuffix}`) || asciiDomain === rule.punySuffix ? rule : acc
    }, null)
}

const validate = (domain) => {
    console.log('Domain:', domain)
    console.log({punycode})
    if (!punycode) return null

    const asciiDomain = punycode.toASCII(domain)
    if (asciiDomain.length < 1) return 'DOMAIN_TOO_SHORT'
    if (asciiDomain.length > 255) return 'DOMAIN_TOO_LONG'

    const labels = asciiDomain.split('.')
    for (const label of labels) {
        if (!label.length) return 'LABEL_TOO_SHORT'
        if (label.length > 63) return 'LABEL_TOO_LONG'
        if (label.startsWith('-')) return 'LABEL_STARTS_WITH_DASH'
        if (label.endsWith('-')) return 'LABEL_ENDS_WITH_DASH'
        if (!/^[a-z0-9\-]+$/.test(label)) return 'LABEL_INVALID_CHARS'
    }
}

const parse = (domain) => {
    if (typeof domain !== 'string') {
        throw new TypeError('Domain name must be a string.')
    }

    let normalizedDomain = domain.slice(0).toLowerCase()
    if (normalizedDomain.endsWith('.')) {
        normalizedDomain = normalizedDomain.slice(0, -1)
    }

    const validationError = validate(normalizedDomain)
    if (validationError) {
        return {input: domain, error: {message: errorCodes[validationError], code: validationError}}
    }

    const result = {
        input: domain,
        tld: null,
        sld: null,
        domain: null,
        subdomain: null,
        listed: false,
    }

    const labels = normalizedDomain.split('.')

    if (labels[labels.length - 1] === 'local') {
        return result
    }
    const finalizeResult = () => {
        if (/xn--/.test(normalizedDomain)) {
            if (result.domain) result.domain = punycode.toASCII(result.domain)
            if (result.subdomain) result.subdomain = punycode.toASCII(result.subdomain)
        }
        return result
    }
    const rule = findRule(normalizedDomain)

    if (!rule) {
        if (labels.length < 2) return result
        result.tld = labels.pop()
        result.sld = labels.pop()
        result.domain = `${result.sld}.${result.tld}`
        if (labels.length) {
            result.subdomain = labels.pop()
        }
        return finalizeResult()
    }

    result.listed = true
    const suffixLabels = rule.suffix.split('.')
    const domainLabels = labels.slice(0, labels.length - suffixLabels.length)

    if (rule.exception) {
        domainLabels.push(suffixLabels.shift())
    }
    result.tld = suffixLabels.join('.')
    if (domainLabels.length) {
        if (rule.wildcard) {
            suffixLabels.unshift(domainLabels.pop())
            result.tld = suffixLabels.join('.')
        }
        if (domainLabels.length) {
            result.sld = domainLabels.pop()
            result.domain = `${result.sld}.${result.tld}`
            if (domainLabels.length) {
                result.subdomain = domainLabels.join('.')
            }
        }

    }

    return finalizeResult()

}

const get = (domain) => {
    const parsed = domain && parse(domain)
    return parsed ? parsed.domain : null
}

const isValid = (domain) => {
    const parsed = parse(domain)
    return Boolean(parsed.domain && parsed.listed)
}

export {parse, get, isValid}