// Utility functions
console.log('/user?name=')

// Initialization:
var message1, message2, message3

// Functions:
function hookMessageTags() {
	// Grabs 3 'standard' message tags, which may (or may not) exist on a page
	// Can then use: message1.textContent = "Error! Please log in!" or something. Clear them with clearMessages()
	message1 = document.querySelector('#message-1')		// Three optional message display <P> tags
	message2 = document.querySelector('#message-2')		// Generally errors from API fetching, cleared by page DOM interaction
	message3 = document.querySelector('#message-3')		// (any message will be displayed until the user interacts with the page again)
}

function clearMessages() {
	// Clears the 3 'standard' message tags
	message1.textContent = ''
	message2.textContent = ''
	message3.textContent = ''
}

function stripHTML(html) {
	// In a browser, can use DOM tricks. In Node can find one of several HTML to Text packages
	// This is just a simple RegEx version that works fairly well. DOM Tricks may lead to scripting attacks through.
	if (!html) { return '' }
	const STANDARD_HTML_ENTITIES = {		// If adding any update the final .replace() below
		nbsp: String.fromCharCode(160),
		amp: "&",
		quot: '"',
		apos: "'",
		lt: "<",
		gt: ">"
	};
	html = html.replace(/<style([\s\S]*?)<\/style>/gi, '')
		.replace(/<script([\s\S]*?)<\/script>/gi, '')
		.replace(/<\/div>/ig, '\n')
		.replace(/<\/li>/ig, '\n')
		.replace(/<li>/ig, '  *  ')
		.replace(/<\/ul>/ig, '\n')
		.replace(/<\/p>/ig, '\n')
		.replace(/<br\s*[\/]?>/gi, "\n")
		.replace(/<[^>]+>/ig, '')
		.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec) )
		.replace(/&(nbsp|amp|quot|apos|lt|gt);/g, (a, b) => STANDARD_HTML_ENTITIES[b] );

	return html
}

function sanitizeHTML(string) {
	// Returns the text with HTML converted quoted HTML - so includes the tags
	var dummyDiv = document.createElement('div')
	dummyDiv.textContent = string
	return dummyDiv.innerHTML
}

function getCookie(name) {
	// Returns the value of a Cookie by name, blank if it doesn't exist
	const cookieName = name + '='
	const allCookies = decodeURIComponent(document.cookie).split(';')
	for(let cookie of allCookies) {
		while (cookie.charAt(0) == ' ') {
			cookie = cookie.substring(1)		// Cookies may be split by just ';' or by '; '
		}
		if (cookie.indexOf(cookieName) == 0) {
			return cookie.substring(cookieName.length, cookie.length);
		}
	}
	return '';
}

function setCookie(name, value, expiresInDays = null, path = '/', sameSite = 'Lax', secure = false) {
	// Sets a cookie with a value that expires in some days (or the Session if not specified)
	// Can set a path, SameSite or Secure. Delete a cookie by using negative expiration days.
	let expires = ''
	if (expiresInDays) {
		let today = new Date()
		today.setTime(today.getTime() + (1000 * 60 * 60 * 24 * expiresInDays))
		expires = "; Expires="+ today.toUTCString()
	}
	document.cookie = name + "=" + encodeURIComponent(value) + expires + '; Path=' + path + '; SameSite=' + sameSite + (secure ? ' Secure' : '')
}

function getFormData(formElement, trim = false) { 
	// Returns an Object of an HTML Form's various input types. Careful trimming if passwords may start/end with spaces!
	// Checkboxes will be checkboxName: 'on' if checked and not present at all if not checked
	const formData = new FormData(formElement)
    let tempObject = {}

    formData.forEach((value, key) => { 
        tempObject[key] = trim ? value.trim() : value;
    })
    return tempObject;
}

function removeEmptyProperties(obj) {
	// Removes any properties of an Object that are blank/"", null, or undefined (but not 0)
	for (let prop of Object.keys(obj)) {
		if (obj[prop] === '' || obj[prop] === null || obj[prop] === undefined ) { delete obj[prop] }
	}
	return obj;
}