import Loader from './scripts/loader-component.js'
import * as PSLHelper from './scripts/psl-helper.js'

'use strict'

const port = chrome.runtime.connect({name: 'fetch-channel'})

const $age = document.getElementById('age')
const $header = document.getElementById('header')
const $loader = document.getElementById('loader')
$loader.style.display = 'block'

function fetchAge(ev) {
    const loader = new Loader($loader)

    const type = ev.type
    switch (type) {
        case 'fetch-age-initiated':
            console.log('fetch-age-initiated')
            loader.show()
            break
        case 'on-fetch-age-data':
            if (!ev || ev.error || !ev?.age) {
                loader.hide()
                $header.textContent = 'Unable to Fetch Domain Age'
                $age.textContent = ''
                return
            }

            $header.textContent = 'Domain age is'
            $age.textContent = ev.age
            break
        default:
            loader.hide()
            break
    }
}

window.onload = () => {
    console.log('init')

    port.onMessage.addListener(ev => {
        console.log('Content[ev][type]', ev.type)
        fetchAge(ev)
    })

    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, function (tabs) {
        console.log('Tabs:', {tabs, tab: tabs[0], url: tabs[0].url})

        let domain = new URL(tabs[0].url)
        if (domain && domain?.protocol?.includes('http')) {
            domain = PSLHelper.get(domain.hostname) ?? domain.hostname
            console.log('Domain:', domain)

            port.postMessage({
                type: 'fetch-age',
                domain,
            })
        }
    })
}
