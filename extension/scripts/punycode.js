/** Detect free variable `exports` */
const freeExports = typeof exports == 'object' && exports &&
    !exports.nodeType && exports

/** Detect free variable `module` */
const freeModule = typeof module == 'object' && module &&
    !module.nodeType && module

let root = typeof window === 'object' && window ? window : (typeof global === 'object' && global ? global : this)

// /** Detect the free variable `global` */
// const freeGlobal = typeof global == 'object' && global
// if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
//     root = freeGlobal
// }

/**
 * A string representing the current Punycode.js version number.
 * @memberOf punycode
 * @type String
 */
const version = '1.4.1'

/**
 * An object of methods to convert from JavaScript's internal character
 * representation (UCS-2) to UTF-16 and back.
 * @memberOf punycode
 * @type Object
 */
const ucs2 = {
    'decode': function (string) {
        const output = []
        let counter = 0,
            length = string.length,
            value,
            extra
        while (counter < length) {
            value = string.charCodeAt(counter++)
            if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                // high surrogate
                extra = string.charCodeAt(counter++)
                if ((extra & 0xFC00) === 0xDC00) { // low surrogate
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000)
                } else {
                    // unmatched surrogate; only append this code unit, in case the next
                    // code unit is the high surrogate of a surrogate pair
                    output.push(value)
                    counter--
                }
            } else {
                output.push(value)
            }
        }
        return output
    },
    'encode': function (array) {
        const output = []
        let value,
            length = array.length,
            i = 0

        while (i < length) {
            value = array[i++]
            if (value > 0xFFFF) {
                value -= 0x10000
                output.push(String.fromCharCode(value >>> 10 & 0x3FF | 0xD800))
                value = 0xDC00 | value & 0x3FF
            }
            output.push(String.fromCharCode(value))
        }
        return output.join('')
    },
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @memberOf punycode
 * @param {String} string The Unicode input string.
 * @returns {Array} The array of code points.
 */
function ucs2decode(string) {
    return ucs2.decode(string)
}

/**
 * Creates a string based on an array of numeric code points.
 * @memberOf punycode
 * @param {Array} array An array of integers representing Unicode code points.
 * @returns {String} The string corresponding to the array of code points.
 */
function ucs2encode(array) {
    return ucs2.encode(array)
}

/**
 * The `basic` code points are U+0000 to U+007F, inclusive. Characters in
 * this range are encoded as themselves in Punycode.
 * @type Number
 */
const basicLength = 0x80

/**
 * The delimiter to separate a basic code point from a non-basic code point.
 * @type String
 */
const delimiter = '-'

/**
 * The base for representing integers.
 * @type Number
 */
const base = 36

/**
 * The number of bits per digit in a base-36 representation.
 * @type Number
 */
const digits = 26

/**
 * Bias for skewing the adaptative change of the bias.
 * @type Number
 */
const initialBias = 72

/**
 * Threshold for handling the bias.
 * @type Number
 */
const initialN = 128

/**
 * The maximum integer that can be represented in the base used.
 * @type Number
 */
const maxInt = 2147483647

/**
 * The minimum number of digits used to represent a non-basic code point.
 * @type Number
 */
const minLength = 1

/**
 * The maximum number of digits used to represent a non-basic code point.
 * @type Number
 */
const maxLength = 26

/**
 * A basic code point value to which a non-basic code point is added
 * to produce a value that is then encoded.
 * @type Number
 */
const skew = 38

/**
 * The maximum basic code point value that represents a basic code point.
 * @type Number
 */
const tmin = 1

/**
 * The minimum basic code point value that represents a basic code point.
 * @type Number
 */
const tmax = 26

/**
 * Creates a string representation of an integer.
 * @memberOf punycode
 * @param {Number} digit The integer to convert.
 * @returns {String} The string representation of the integer.
 */
function digitToBasic(digit) {
    //  0..25 map to a..z
    // 26..35 map to 0..9
    if (digit < 26) {
        return String.fromCharCode(0x61 + digit)
    } else if (digit < 36) {
        return String.fromCharCode(0x30 + digit - 26)
    }
    throw Error(
        'Number out of base range for digit conversion to basic code point: ' +
        digit,
    )
}

/**
 * Converts a basic code point to digit.
 * @memberOf punycode
 * @param {Number} basic The basic code point to convert.
 * @returns {Number} The digit of the basic code point, or `-1` on failure.
 */
function basicToDigit(basic) {
    if (basic - 0x30 < 10) {
        return basic - 0x16
    } else if (basic - 0x61 < 26) {
        return basic - 0x61
    }
    return -1
}

/**
 * Calculates the bias for a given value.
 * @memberOf punycode
 * @param {Number} delta The delta value.
 * @param {Number} numPoints The number of code points.
 * @param {Boolean} isFirstTime Is this the first time the script is running?
 * @returns {Number} The bias.
 */
function adapt(delta, numPoints, isFirstTime) {
    let k = 0
    delta = isFirstTime ? Math.floor(delta / skew) : delta >> 1
    delta += Math.floor(delta / numPoints)
    for (k = 0; delta > ((base - tmin) * maxLength) >> 1; k += base) {
        delta = Math.floor(delta / (base - tmin))
    }

    return Math.floor(k + (((base - tmin + 1) * delta) / (delta + skew)))
}

/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 * @memberOf punycode
 * @param {String} input The Punycode string to decode.
 * @returns {String} The Unicode string.
 * @throws {Error} If the string contains invalid Punycode
 * @throws {Error} If the input contains code points greater than the basic code point range.
 */
function decode(input) {
    const output = [],
        basicCodes = [],
        inputLength = input.length
    let i = 0,
        n = initialN,
        bias = initialBias,
        basic,
        j,
        index,
        oldi,
        w,
        k,
        digit,
        t,
        len,
        basicLength

    // `i` is the index of the next character to be decoded.
    // `n` is the current non-basic code point.
    // `bias` is the current bias.
    basicLength = input.lastIndexOf(delimiter)
    if (basicLength < 0) {
        basic = 0
    } else {
        for (i = 0; i < basicLength; ++i) {
            if (input.charCodeAt(i) >= 128) {
                throw Error('Illegal: input >= 0x80 (not a basic code point)')
            }
            basicCodes.push(input.charCodeAt(i))
        }
        basic = basicLength

    }

    for (j = 0; j < basicCodes.length; j++) {
        output.push(basicCodes[j])
    }

    // Main decoding loop: start as `i` goes through the string from `basic`
    // to the end. The number of basic code points will never increase.
    for (index = 0; basic < inputLength;) {
        for (oldi = i, w = 1, k = base; ; k += base) {
            if (index >= inputLength) {
                throw Error('Invalid input')
            }
            digit = basicToDigit(input.charCodeAt(index++))

            if (digit < 0) {
                throw Error('Invalid input')
            }

            if (digit > Math.floor((maxInt - i) / w)) {
                throw Error('Overflow: input needs wider integers to process')
            }

            i += digit * w
            t = k <= bias ? minLength : (k >= bias + maxLength ? maxLength : k - bias)
            if (digit < t) {
                break
            }
            w = Math.floor(w * (base - t))
        }

        bias = adapt(i - oldi, index, oldi === 0)
        if (Math.floor(i / index) > maxInt - n) {
            throw Error('Overflow: input needs wider integers to process')
        }

        n += Math.floor(i / index)
        i %= index
        output.splice(i, 0, n)
        index++
    }

    return ucs2encode(output)
}

/**
 * Converts a Unicode string to a Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The Unicode string to encode.
 * @returns {String} The Punycode string.
 * @throws {Error} If the string contains invalid Unicode
 */
function encode(input) {
    const output = []
    let n,
        delta,
        handledCPCount,
        basicLength,
        bias,
        j,
        m,
        q,
        k,
        t,
        currentValue

    input = ucs2decode(input)
    // Initialize the state
    n = initialN
    delta = 0
    bias = initialBias

    // Handle the basic code points
    for (j = 0; j < input.length; ++j) {
        if (input[j] < 0x80) {
            output.push(String.fromCharCode(input[j]))
        }
    }

    basicLength = output.length
    handledCPCount = basicLength

    // `handledCPCount` is the number of code points that have been handled;
    // `basicLength` is the number of basic code points.
    if (basicLength) {
        output.push(delimiter)
    }
    // Main encoding loop:
    while (handledCPCount < input.length) {
        // All non-basic code points have been handled at this point.
        // Find the next smallest non-basic code point.
        for (m = maxInt, j = 0; j < input.length; ++j) {
            currentValue = input[j]
            if (currentValue >= n && currentValue < m) {
                m = currentValue
            }
        }

        // Increase `delta` enough to advance the decoder's <n,i> state to
        // the next code point.
        delta += (m - n) * (handledCPCount + 1)

        // Encode `delta` as a base 36 integer.
        for (n = m, q = delta, k = base; ; k += base) {
            t = k <= bias ? minLength : (k >= bias + maxLength ? maxLength : k - bias)
            if (q < t) {
                output.push(digitToBasic(q))
                break
            }
            output.push(digitToBasic(t + (q - t) % (base - t)))
            q = Math.floor((q - t) / (base - t))
        }
        bias = adapt(delta, handledCPCount + 1, handledCPCount === basicLength)
        delta = 0
        handledCPCount++
    }
    return output.join('')
}

/**
 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
 * symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The Punycode string.
 */
function toASCII(input) {
    return mapDomain(input, function (domain) {
        let charCode
        if (/[\x00-\x7f]/.test(domain)) {
            return domain
        }
        for (let i = 0; i < domain.length; i++) {
            charCode = domain.charCodeAt(i)
            if (charCode > 127) {
                return 'xn--' + encode(domain)
            }
        }

        return domain
    })
}

/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 * @memberOf punycode
 * @param {String} input The Punycode string to decode.
 * @returns {String} The Unicode string.
 */
function toUnicode(input) {
    return mapDomain(input, function (domain) {
        if (/^xn--/.test(domain)) decode(domain.slice(4))

        return domain
    })
}

function mapDomain(domain, func) {
    const parts = domain.split('@')
    let result = ''

    if (parts.length > 1) {
        result = parts[0] + '@'
        domain = parts[1]
    }
    result = result + domain.split('.').map(function (domain) {
        return func(domain)
    }).join('.')

    return result
}

/**
 * A string representing the current Punycode.js version number.
 * @memberOf punycode
 * @type String
 */
function getVersion() {
    return version
}

/**
 * Public API
 */
const punycode = {
    version: getVersion(),
    ucs2,
    decode,
    encode,
    toASCII,
    toUnicode,
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = punycode
} else {
    root.punycode = punycode
}

export default punycode