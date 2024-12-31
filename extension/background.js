/**
 * Created by Teocci.
 * Author: teocci@yandex.com on 2023-5월-17
 */

const CUSTOM_HEADERS = new Headers({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998U1 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.21 Mobile Safari/537.36',
    Cookie: 'cf_clearance=grmr47dzP8uR1KPYDIcwNEIeyXQG6W7DIJhazuwrnnM-1735606759-1.2.1.1-OUfMkXZpRO6bmfeTOVlzkfOqov3DgrDDH0AuhVPlTXB.kdyjXzzEsJVCKy2nmd6tMZVKTjQ5N8VYZVFNIsKfAcbHzizqCt.ES_MlVz9GAp0tRn3Xr2T.aVbF9Vu4sLNyuiQ97Za1vLeZJwmPjjFSI3sdFqQqGAEcj90m2y68j2HRmdLjh4LRszhtRhLFOjvicYTA8QvpwnyOMOjmiOU7hxW8u5tKRJkj5PhxK3w7s9K0w22ypyu67FFHjFt3.pJilxQ7UoSDz1o2jgt5VjViIVPESJPJ.GdP4aYBc_zxucy2EDuoLa5P5Tq1CIx88NjhYO1tKbennFLVkqcy2hL18St46s8AIJW6hc9b0Y9qoDddPAJH8517u0s3nv8olOyjDUeCrI4ncr3k9SWf5YcArFZmKplIAaRUcMrn9Fmza3KaovvzYAo6TzTxBLh3vWEU',
    Referer: 'https://www.whatsmydns.net/api/domain?ts=1&q=mozilla.org&__cf_chl_tk=llTAXaSpY9Dq7_iU20Ucq.2Xm52UtT8OauY657Y18kQ-1735606759-1.0.1.1-eeJ1Q.kgVtJ6.QUCUAL5at7PpUxWXsm1Q4C9bfUoBaI',
    'sec-ch-ua': 'Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24',
    Origin: 'https://www.whatsmydns.net',
})

function calculateAge(date) {
    const birthDate = new Date(date)

    const today = new Date()

    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    let days = today.getDate() - birthDate.getDate()

    if (days < 0) {
        months--
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate() // Get last day of the previous month
    }
    if (months < 0) {
        years--
        months += 12
    }

    return `${years} Year${years !== 1 ? 's' : ''}, ${months} Month${months !== 1 ? 's' : ''}, ${days} Day${days !== 1 ?
        's' :
        ''}`
}

async function fetchDomainAge(domain) {
    const url = `https://www.whatsmydns.net/api/domain?ts=1&q=${domain}`

    const payload = {
        type: 'on-fetch-age-data',
        error: null,
        age: null,
    }

    const response = await fetch(url, {
        mode: 'same-origin',
        headers: CUSTOM_HEADERS,
    })
    if (!response.ok) {
        payload.error = 'Unable to Fetch Domain Age'
        return
    }

    const json = await response.json()
    if (!json) {
        payload.error = 'Unable to Fetch Domain Age'
        return
    }

    const str = json.data.created
    if (!str) {
        payload.error = 'Unable to Fetch Domain Age'
        return
    }

    const created = new Date(str)
    const today = new Date()

    payload.age = calculateAge(created, today)

    return payload
}

// chrome.runtime.onMessage.addListener((message) => {
//     if (message.type === 'fetchData') {
//         const domain = psl.get(message.domain)
//         const url = `https://www.whatsmydns.net/api/domain?ts=1&q=${domain}`
//
//         return new Promise(async (resolve) => {
//             try {
//                 const response = await fetch(url, {
//                     mode: 'no-cors',
//                 })
//                 if (!response.ok) {
//                     resolve({error: 'Unable to Fetch Domain Age'})
//                 }
//
//                 const json = await response.json()
//                 if (!json) {
//                     resolve({error: 'Unable to Fetch Domain Age'})
//                 }
//
//                 const str = json.data.created
//                 if (!str) {
//                     resolve({error: 'Unable to Fetch Domain Age'})
//                 }
//
//                 const created = new Date(str)
//                 const today = new Date()
//
//                 const age = calculateAge(created, today)
//
//                 resolve({age})
//             } catch (error) {
//                 resolve({error: error.message})
//             }
//         })
//     }
// })

const initFetchChannel = async (port) => {
    port.onMessage.addListener(async (ev) => {
        if (ev.type === 'fetch-age') {
            if (!ev || !ev?.domain) {
                port.postMessage({
                    type: 'on-fetch-age-data',
                    error: 'Unable to Fetch Domain Age',
                    age: null,
                })
                return
            }

            port.postMessage('fetch-age-initiated')
            const response = await fetchDomainAge(ev.domain)

            if (!response || response.error) {
                port.postMessage({
                    type: 'on-fetch-age-data',
                    error: response.error,
                    age: null,
                })
                return
            }

            port.postMessage(response)
        }
    })
}

const init = () => {
    chrome.runtime.onConnect.addListener(async port => {
        console.log(`Background[port][name]: ${port.name}`)

        if (port.name === 'fetch-channel') await initFetchChannel(port)
    })
}

init()
