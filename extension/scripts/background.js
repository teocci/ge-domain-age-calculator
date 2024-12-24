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

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'fetchData') {
        const domain = psl.get(message.domain)
        const url = `https://www.whatsmydns.net/api/domain?ts=1&q=${domain}`

        return new Promise(async (resolve) => {
            try {
                const response = await fetch(url, {
                    mode: 'no-cors',
                })
                if (!response.ok) {
                    resolve({error: 'Unable to Fetch Domain Age'})
                }

                const json = await response.json()
                if (!json) {
                    resolve({error: 'Unable to Fetch Domain Age'})
                }

                const str = json.data.created
                if (!str) {
                    resolve({error: 'Unable to Fetch Domain Age'})
                }

                const created = new Date(str)
                const today = new Date()

                const age = calculateAge(created, today)

                resolve({age})
            } catch (error) {
                resolve({error: error.message})
            }
        })
    }
})
