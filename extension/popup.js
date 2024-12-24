import Loader from './scripts/loader-component.js'

'use strict'

const $age = document.getElementById('age')
const $header = document.getElementById('header')
const $loader = document.getElementById('loader')
$loader.style.display = 'block'

async function fetchAge(domain) {
    const loader = new Loader($loader)
    try {
        loader.show()
        const response = await chrome.runtime.sendMessage({
            type: 'fetch-age',
            domain,
        })
        console.log({response})

        if (!response || response.error || !response?.age) throw new Error('Unable to Fetch Domain Age')
        $header.textContent = 'Domain age is'
        $age.textContent = response.age
    } catch (error) {
        console.error(error)
        $header.textContent = 'Unable to Fetch Domain Age'
        $age.textContent = ''
    } finally {
        loader.hide()
    }

}

chrome.tabs.query({
    active: true,
    currentWindow: true,
}, function (tabs) {

    let domain = new URL(tabs[0].url)
    if (domain && domain?.protocol?.includes('http')) {
        domain = domain.hostname
        fetchAge(domain).then()
    }
})

