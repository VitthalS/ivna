// Client-Side Profile code for the REST API

// Initialization
const apiUrl = ''															// Blank will default to current host, if set make sure CORS is configured on the back-end!
const profileForm = document.querySelector('#profile-form')
var userProfile = {}														// Will hold the current User's Profile
hookMessageTags()															// Three optional message display <P> tags

// Add Event Handlers
document.addEventListener('DOMContentLoaded', handlerDomLoaded)									// Initialization Handler for when DOM is complete
profileForm.addEventListener('submit', handleSubmitForm)										// Profile form handler
document.querySelector('#delete').addEventListener('click', handleDeleteProfile)	
// Event Handlers
async function handlerDomLoaded() {
	// Retrieve User's Profile from the API once the Document has loaded
	try {
		const response = await fetch(apiUrl + '/api/v2/profile', {			// GET is the default Fetch method
			credentials: 'include'
			
		})
		if (response.ok) {
			userProfile = await response.json()						// Parse the returned JSON from the returned Body
		} else {
			throw `Failed to retrieve Profile data! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to GET User Profile! Logout and Login then try again!"
		throw message3.textContent
	}

	if (Object.keys(userProfile).length > 0) {
		document.querySelector('#name').value = userProfile.user.name
		document.querySelector('#email').value = userProfile.user.email
		document.querySelector('#age').value = userProfile.user.age
	}
 }

async function handleSubmitForm(event) {
	// Combination Handler / Workflow function
	event.preventDefault()							// Stop Form's default submit/page refresh action
	clearMessages()									// Clear any existing messages if the user has interacted with the page
	let formData = getFormData(profileForm, true)	// The API trims leading/trailing spaces from passwords anyway
	let result;

	removeEmptyProperties(formData)
	let updateEmailCookie = getCookie('task_manager_email') == userProfile.email ? true : false;

	try {
		// Update the User's profile
		const response = await fetch(apiUrl + '/api/v2/users/me', {
			credentials: 'include',
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
		})
		result = await response.json()			// The Updated user is returned
		if (!response.ok) {
			throw `Failure Updating User Profile! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err + " " + result.error
		message3.textContent = "Unable to PATCH User Profile! Check name, email, password, or age and try again!"
		throw message3.textContent
	}

	message1.textContent = 'SUCCESS!'
	message2.textContent = 'Updated your User Profile'
	if (updateEmailCookie) { setCookie('task_manager_email', result.email) }

}

async function handleLogoutAll(event) {
	// Combination Handler/Workflow
	clearMessages()
	try {
		const response = await fetch(apiUrl + '/api/v2/users/logoutAll', {
			credentials: 'include',
			method: 'POST',
			headers: { Authorization: authToken }
		})
		if (!response.ok) {
			throw `Failed to logout all Sessions! ${response.statusText} - ${response.status}`
		}
		message1.textContent = 'SUCCESS!'
		message2.textContent = 'All your Sessions have been logged out'
		message3.textContent = 'You will be returned to the login page in 3 seconds'
		setCookie('task_manager_auth_token', 'deleted', -1)				// Our Cookie so we must remove it
		setTimeout( () => {
			window.location.href = "login.html"
		}, 3000)
	} catch (err) {
		// User can try again perhaps
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = 'Unable to POST logout all Sessions!'
		throw message3.textContent
	}
}

async function handleDeleteProfile(event) {
	// Combination Handler/Workflow
	clearMessages()

	let confirm = window.confirm("Click OK to delete your Profile")
	if (!confirm) { return; }

	try {
		const response = await fetch(apiUrl + '/api/v2/users/me', {
			credentials: 'include',
			method: 'DELETE'
		})
		if (!response.ok) {
			throw `Failed to delete Profile! ${response.statusText} - ${response.status}`
		} 
		setCookie('auth_token', 'deleted', -1)				// Our Cookie so we must remove it
		setCookie('auth_token', 'deleted', -1)							// Remove just in case
		message1.textContent = 'SUCCESS!'
		message2.textContent = 'Your Profile has been deleted'
		message3.textContent = 'You will be returned to the main page in 3 seconds'
		setTimeout( () => {
			window.location.href = "login.html"
		}, 3000)
	} catch (err) {
		// User can try again perhaps
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = 'Unable to DELETE Profile!'
		throw message3.textContent
	}
}