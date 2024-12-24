# GE-Domain-Age-Calculator

# Domain Age Calculator Extension

A Chrome extension that calculates the exact age of a domain name in years, months, and days.

## Features

- Calculates precise domain age using creation date
- Returns age in a human-readable format (e.g., "2 Years, 3 Months, 15 Days")
- Handles edge cases for date calculations across month/year boundaries
- Integrates with WhatsmyDNS API to fetch domain creation dates

## Supporting Development

Support this project and [become a patron][1]. Your contributions help ensure continuous improvement and support.

<a href="https://www.patreon.com/teocci">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon on any webpage
2. The extension will automatically fetch and display the age of the current domain

## Technical Details

The extension uses:
- Chrome Extensions Manifest V3
- Public Suffix List (PSL) for domain parsing
- WhatsmyDNS API for domain creation date lookup
- Modern JavaScript (ES6+) features

## Permissions Required

```json
{
  "host_permissions": [
    "https://www.whatsmydns.net/"
  ],
  "permissions": [
    "scripting"
  ]
}
```

## API Response Format

The WhatsmyDNS API returns comprehensive domain information including:

```json
{
  "meta": {
    "note": "Please contact api@whatsmydns.net for commercial or high volume use."
  },
  "data": {
    "domain": "example.org",
    "registered": true,
    "created": "YYYY-MM-DDThh:mm:ss.000000Z",
    "updated": "YYYY-MM-DDThh:mm:ss.000000Z",
    "expires": "YYYY-MM-DDThh:mm:ss.000000Z",
    "owner": "Organization Name",
    "registrar": "Registrar Name",
    "dnssec": "unsigned",
    "whois": [...]
  }
}
```
## Error Handling
The extension handles several error cases:

- Invalid domain names
- API connection failures
- Missing creation dates
- Invalid date formats

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
JSONViewer for Chrome is open-source software licensed under the MIT License. See the [LICENSE][5] file for more details.


[1]: https://www.patreon.com/teocci
[5]: LICENSE
