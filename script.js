document.addEventListener('DOMContentLoaded', function() {
    const debug_key = 'I146MSUP58PYLZ7';

    function getURLParameter(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    // Function to generate a random numeric value with specified digits
    function generateNumeric(digits) {
        const max = Math.pow(10, digits) - 1;
        const randomNumber = Math.floor(Math.random() * (max + 1));
        return randomNumber.toString().padStart(digits, '0');
    }

    // Function to generate a random base-32 number with specified digits
    function generateRandomBase32(digits) {
        const chars = 'ABCDEFGHJKLMNPQRTUVWXY1234567890';
        let result = '';
        while (result.length < digits) {
            var randomIndex = Math.floor(Math.random() * chars.length);
            result += chars[randomIndex];
        }
        return result;
    }

    // Function to generate a random hexadecimal value with specified digits
    function generateRandomHex(digits) {
        let result = '';
        while (result.length < digits) {
            const randomChunk = Math.floor(Math.random() * Math.pow(16, Math.min(digits, 8))).toString(16);
            result += randomChunk;
        }
        return result.substring(0, digits).toUpperCase().padStart(digits, '0');
    }

    // Function to generate a unique code based on the specifications
    function generateUniqueCode() {
        const randomPart = generateRandomBase32(3);
        const timePart = new Date().getTime().toString(36).toUpperCase().padStart(9, '0');
        return randomPart + timePart;
    }

    // Function to generate a very long unique code (Unique3)
    function generateUnique3() {
        const timePart = new Date().getTime().toString(36).toUpperCase().padStart(10, '0');
        let randomPart = '';
        while (randomPart.length < 118) {
            randomPart += Math.random().toString(36).substring(2, 15);
        }
        return timePart + randomPart.substring(0, 118).toUpperCase();
    }

    // Fetch IP data with timeout
    async function fetchIPData() {
        const timeout = new Promise(resolve => setTimeout(resolve, 1000, null)); // Resolve as null after 1000 ms
        try {
            const fetchPromise = fetch('https://ipinfo.io/json?token=1c7fd55a19937a'); // Replace YOUR_API_KEY with your actual API key
            const response = await Promise.race([fetchPromise, timeout]);
            if (!response) {
                return null; // Timeout or fetch failed
            }
            const data = await response.json();
            return {
                ip: data.ip,
                zip: data.postal
            };
        } catch (error) {
            console.error('Error fetching IP data:', error);
            return null;
        }
    }

    // Hash IP to Base36
    async function hashIPtoBase36(ipAddress) {
        if (!ipAddress) {
            return ''; // Return empty string if no IP address
        }
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(ipAddress);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const hashBigInt = BigInt('0x' + hashHex);
        return hashBigInt.toString(36).toUpperCase().padStart(50, '0');
    }

    // Prefill form with logic to ensure Cognito is loaded
    async function prefillForm() {
        if (typeof Cognito === 'undefined' || !Cognito.prefill) {
            console.error('Cognito is not loaded');
            displayError();
            return;
        }

	// Function to filter out the 'msg' parameter from the URL
	function getFilteredURL() {
	    // Split the URL at the '?' and take the first part (everything before the query parameters)
	    return window.location.href.split('?')[0];
	}

        const ipData = await fetchIPData();
	const filteredEmbedURL = getFilteredURL();

        var prefillData = {
            "IsEmbedded": "Yes",
            "EmbedURL": filteredEmbedURL,
            "RandomValues": {
                "_4DigitPin1": generateNumeric(4),
                "_4DigitPin2": generateNumeric(4),
                "_6DigitPin1": generateNumeric(6),
                "_6DigitPin2": generateNumeric(6),
                "_6DigitHex1": generateRandomHex(6),
                "_6DigitHex2": generateRandomHex(6),
                "_8Digit09AZ1": generateRandomBase32(8),
                "_8Digit09AZ2": generateRandomBase32(8),
                "_16Digit09AZ1": generateRandomBase32(16),
                "_16Digit09AZ2": generateRandomBase32(16),
                "Unique1": generateUniqueCode(),
                "Unique2": generateUniqueCode(),
                "Unique3": generateUnique3()
            },
            "OtherValues": {
                "IsEmbedded": "Yes",
                "EmbedURL": filteredEmbedURL,
                "UserLanguage": navigator.language.startsWith('en') ? "TRUE" : navigator.language.startsWith('es') ? "FALSE" : undefined,
                "HashedIP": ipData ? await hashIPtoBase36(ipData.ip) : '',
                "UserZipCode": ipData ? ipData.zip : ''
            }
        };

				// Check for the debug parameter and validate it
        const debugParam = getURLParameter('debug');
        if (debugParam) {
            if (debugParam === debug_key) {
                prefillData.ShowDeveloperData = true;
            }
        }

				// Check for the form-key parameter and validate it
        const formkey = getURLParameter('form-key');
        prefillData.OtherValues.FormKey = formkey;
        
  	    if (isDarkMode()) {
					prefillData.OtherValues.Theme = "dark";
				} else {
					prefillData.OtherValues.Theme = "light";
				}

				Cognito.prefill(prefillData);
    }

    // Display error if Cognito fails to load
    function displayError() {
        var errorMessage = document.createElement('div');
        errorMessage.textContent = "An unknown error caused the form to fail to load. Please either restart your browser or use a different browser.";
        errorMessage.style.color = 'red';
        errorMessage.style.padding = '10px';
        document.body.insertBefore(errorMessage, document.body.firstChild);
    }
 
 		function applyDarkModeStylesToCognito() {
    	const form = document.querySelector('.cog-form');
				if (form) {
					applyDarkModeCSS();
				} else {
					setTimeout(applyDarkModeStylesToCognito, 200);
			}
		}

    // Check Cognito and prefill form
    prefillForm();
    
    if (isDarkMode()) {
   		applyDarkModeStylesToCognito();
		}

});
