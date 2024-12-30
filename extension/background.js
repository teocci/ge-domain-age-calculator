/**
 * Created by Teocci.
 * Author: teocci@yandex.com on 2023-5월-17
 */

const CUSTOM_HEADERS = new Headers({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998U1 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.21 Mobile Safari/537.36',
    Cookie: 'cf_clearance=kmZdRFDqevBM.PJE_zsH6JmDBse9urhQ6CQwJPbWXBc-1735547108-1.2.1.1-uhxXNVuQhsL9X28PKjWOfrAfX2VmfFUQttWutANv4mzsMXMjb73U0k1rM_oXv6wmcu7bLNGTjyFWomCYRWnNtgkI.ED_OB1OlAtzK5hKFSBm4rEBQVELlZjdN37BhH_g9xGIfW2m1Z9P61HNTFdVIYCRnByngYspSR3.Js79KTUR2v0BzGoEFtbXvFW3griTRL8bDq0k.s2RUe_3s0JsZEVE3kjhS.B4woCREgM3NnQK1EkJtlcdmpIsQZErtkke0kW.eiuF_9ZsKW3Eko_icOiNLVOasnScz71qEoivsy9oxVmzuotavN1ORDYcklY_Rf.QLQQcHjgqz1g.VKi4F4A9f_XmUW2ONZ6H82y47xmY6A6hYwLcJ0iMDtRn53YqRwyKrEtry6mmKkR1792Gy3URyPcFB2OrFN80CsaK8oSWUQpKPtXMacGf5cU3.z09th1pIsOxtFWqvBqJsiEpodHsxm9G1b94xTrPiulZmOELADHepRO7.dhCFJtQ9.KW; XSRF-TOKEN=eyJpdiI6Ilk1dFJ1cWRpVmdCL0x0dk5mZkphWEE9PSIsInZhbHVlIjoidWZnd09seFpPSzhtVThGSzBNTVp3TWgvcCtCbG5BK1I0S0V2c2hzY05sK01kTlFENnpnRTdhaCsvR3NCdVQ2TUtrb1czUlJPMmMyckFWbDBPM3lnc0QzSVlpdE5OWXBSN2MrWFJpei9IVXNDQWNwSnlLWHppdlFjNHR2STRpNVYiLCJtYWMiOiJmYjEzMjlmM2YzNjMxNGQzOWVkODRmZGEyMmUzODBkZDcxZTc2YjgzMTdkNWFhOTQ3ODM3YmQ1Yzc1OWFhNmJiIiwidGFnIjoiIn0%3D; whatsmydns_session=eyJpdiI6Im4rejhDZmQ5aTlvalZxZk1ES3dVZWc9PSIsInZhbHVlIjoiQ1ZNSHloZnZVR0s5akFJUzZxbWluMUN2cXpEM25mTzFPMlhLeFdhRThEZ1RMQTdRWFRRaUxOU3NQd3EzVlBaN0s5RlpHSUJYbUh0ODc5UXJDU3ZLb21UbFJZYW9QOEd5dnlKMnRVWmlkdk5mU044aUZWSWxMeGN4Z1hCSDcvWDQiLCJtYWMiOiJhYzQ2NDE1NDg3Mzk5MDM3ZTc5NGU5YmM3NmRkNjE0YmYwMmY5MzZlNjkwNDQwMWQzMGNhMGU0NjdlMjBmY2M1IiwidGFnIjoiIn0%3D',
    Referer: 'https://www.whatsmydns.net/domain-age?q=mozilla.org',
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
