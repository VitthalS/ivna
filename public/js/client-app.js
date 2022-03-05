// Client-Side Application - REST API Based (state saved in Back-End Database served up to this Front-End via a REST API)

// Initialization
// If CORS has been enabled you can set this to 'http://localhost:3000' and then browse to 'http://127.0.0.1:3000' and it will still work
const apiUrl = ''										// Blank will default to current host, if set make sure CORS is configured on the back-end!
const authToken = 'Bearer ' + (getCookie('auth_token') || getCookie('task_manager_auth_token'))		// Grab the Token from either the back-end set Cookie or one we've set
var todoItems = []										// Main array for the todo list
hookMessageTags()										// Three optional message display <P> tags

// Add Event Handlers
document.addEventListener('DOMContentLoaded', handlerDomLoaded)									// Initialization Handler for when DOM is complete
document.querySelector('#input-form').addEventListener('submit', handleSubmitForm)				// Submit new Task form
document.querySelector('#todo-list').addEventListener('click', handleTodoListButtonClicks)		// Click handler for the whole List (Done, Edit, or Delete buttons)
document.querySelector('#btn-clear-all').addEventListener('click', handleClearAll);				// Clear the whole List button
document.querySelector('#btn-logout').addEventListener('click', handleLogout);					// Logout button

// Event Handlers
async function handlerDomLoaded() {
	// Retrieve existing Todo Items from the API once the Document has loaded

	// Alternative to modifying the back-end code to accept cookies: capture the Token that comes back from login/register to a cookie client-side 
	// and then pass it with each fetch(). Works better for CORS, esp as Chrome won't send Cookies for CORS unless SameSite=None + Secure
	try {
		const response = await fetch(apiUrl + '/api/v2/tasks', {
			credentials: 'include',
			headers: {
				Authorization: authToken
			}
		})				// GET is the default Fetch method
		if (response.ok) {
			todoItems = await response.json()						// Parse the returned JSON from the returned Body
		} else {
			throw `Failed to retrieve existing Task data! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to GET All Tasks! Logout and Login then try again!"
		throw message3.textContent
	}

	if (todoItems.length) {
		todoItems.forEach( item => updatePageDom(item) )
	} 
}

function handleSubmitForm(event) {
	event.preventDefault()		// Stop Form's default submit/page refresh action
	clearMessages()				// Clear any existing messages if the user has interacted with the page
	const input = document.querySelector('#input-field')
	const inputValue = stripHTML(input.value).trim()			// or sanitizeHTML()

	if (inputValue != '') {
		addTodo(inputValue)
	}
	input.focus()
	input.value = ''				// Clear the form
}

function handleTodoListButtonClicks(event) {
	const parentItemId = event.target.parentElement.id.replace('item-','')		// ID of the Parent of the button that was clicked (ie. the ListItem)

	// Determine if user clicked on one of the buttons
	switch (event.target.name) {
		case 'btn-check':
			clearMessages()					// Clear any existing messages if the user has clicked a valid button
			return checkTodo(parentItemId)
		case 'btn-edit':
			clearMessages()
			return editTodo(parentItemId)
		case 'btn-delete':
			clearMessages()
			return deleteTodo(parentItemId)
		default:
			// User clicked somewhere else within the #todo-list
	}
}

async function handleClearAll(event) {
	// Combination Handler/Workflow/DOM function
	clearMessages()
	// BEST would be to create a Delete All API route...

	// Slow/Alternate method (as it deletes and update Page DOM for every single Task)
	/*
		const allIds = todoItems.map( item => item._id)		// We can't directly delete every item as deleteTodo() changes todoItems
		allIds.forEach( id => deleteTodo(id) ) 
	*/

	// Next best method: Delete all Tasks in parallel and then clear the DOM
	try {
		const allDeletes = todoItems.map( item => fetch(apiUrl + '/api/v2/tasks/' + item._id, {					// An array of Promises
				credentials: 'include',
				method: 'DELETE',
				headers: { Authorization: authToken }
			})
		)
		const allResponses = await Promise.all(allDeletes)				// Promise.allSettled() does not exist/work in Legacy Edge
		if ( !allResponses.every( response => response.ok ) ) {
			allResponses.forEach( response => { 
				if (!response.ok) { console.log('Failed to delete: ' + response.url) } 
			})
			throw "At least one Task was unable to be deleted!"
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to DELETE all Tasks!"
		throw message3.textContent
	}
	
	// Finally, quickly update the page DOM
	todoItems = []
	let todoList = document.querySelector('#todo-list')
	todoList.innerHTML = ''
	document.querySelector('#instructions').classList.remove('w3-hide')		
	document.querySelector('#btn-clear-all').classList.add('w3-hide')
}

async function handleLogout(event) {
	// Combination Handler/Workflow
	clearMessages()
	try {
		const ignored = await fetch(apiUrl + '/api/v2/users/logout', {
			credentials: 'include',
			method: 'POST',
			headers: { Authorization: authToken }
		})
	} catch (err) {
		// We don't really care if it worked or not, but we'll log it all the same.
		message2.textContent = 'Warning: Unable to fully logout!'
		console.log('Error! Unable to POST logout!');
		console.log(err)
	}
	
	setCookie('auth_token', 'deleted', -1)						// Should be deleted by the API but if it fails we'll remove it
	setCookie('task_manager_auth_token', 'deleted', -1)			// Our Cookie so we must remove it
	window.location.href = "login.html"
}

// Workflow functions
async function addTodo(text) {
	let todo = {
		// _id (and owner) will be returned when added automatically by the API
		description: text,
		completed: false		// Though this the Default anyway
	}

	try {
		const response = await fetch(apiUrl + '/api/v2/tasks', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authToken
			},
			body: JSON.stringify(todo)
		})
		if (response.ok) {
			todo = await response.json()				// The added Task is returned, including _id
		} else {
			throw `Failed Adding Task! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to POST new Task!"
		console.log(text)
		throw message3.textContent
	}
	todoItems.push(todo)
	updatePageDom(todo)
}

function updatePageDom(todo) {
	// Updates the Page's DOM by adding, removing, or updating one Todo List Item
	let todoList = document.querySelector('#todo-list')
	const existingItem = todoList.querySelector(`#item-${todo._id}`)

	// Show/Hide the Clear All button and the Instructions (they end up being mutually exclusive)
	if (todoItems.length > 0) {
		document.querySelector('#instructions').classList.add('w3-hide')		// The Instructions are only shown if there's NO todo items
		document.querySelector('#btn-clear-all').classList.remove('w3-hide')	// Only show Clear All if there's something to clear
	} else {
		document.querySelector('#instructions').classList.remove('w3-hide')		
		document.querySelector('#btn-clear-all').classList.add('w3-hide')		// Safe, can't add class more than once
	}

	if (todo.deleted) {															// Added by deleteTodo() to signal removal
		return existingItem.remove();
	}

	let newListItem = document.createElement('li')
	newListItem.id = `item-${todo._id}`											// ID of the new List Item = item-<todo._id Number>
	newListItem.classList.add('w3-container')
	newListItem.innerHTML = `<input type="checkbox" name="btn-check" class="w3-check w3-margin-right w3-padding-small w3-large">
		<span name="todo-text">${todo.description}</span>
		<button name="btn-delete" class="w3-right w3-margin-left w3-padding-small sa-no-focus-outline w3-hover-theme w3-border-0 w3-large w3-hover-border-theme"><i class="fa fa-trash-o sa-no-pointer-events"></i></button>
		<button name="btn-edit" class="w3-right w3-margin-left w3-padding-small sa-no-focus-outline w3-hover-theme w3-border-0 w3-large w3-hover-border-theme"><i class="fa fa-pencil sa-no-pointer-events"></i></button>
	`;

	if (todo.completed) {
		newListItem.children['btn-check'].checked = true
		let todoText = newListItem.querySelector(`span`)			// There's only one span (could use .nextElementSibling but we might change the order later)
		todoText.classList.toggle('w3-text-grey')
		todoText.classList.toggle('sa-text-line-through')
	}

	if (existingItem) {
		todoList.replaceChild(newListItem, existingItem)
	} else {
		todoList.append(newListItem)
	}
}

async function checkTodo(id) {
	const index = todoItems.findIndex( (item) => item._id == id )

	todoItems[index].completed = !todoItems[index].completed			// toggle the completed property
	try {
		const response = await fetch(apiUrl + '/api/v2/tasks/' + todoItems[index]._id, {
			credentials: 'include',
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authToken
			},
			body: JSON.stringify(todoItems[index], ['completed', 'description'])		// Send only the Properties allowed to be updated
		})
		if (response.ok) {
			todoItems[index] = await response.json()
		} else {
			// If we wanted to see OUR API error message we'd need to: await response.json() and use that as it comes in the body. Ie. the: res.status(400).send( {error: 'Invalid updates!'} )
			throw `Failed Completing Task! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to PATCH Complete Task! " + todoItems[index]._id
		throw message3.textContent
	}
	updatePageDom(todoItems[index])
}

async function deleteTodo(id) {
	let todo = todoItems.find( (item) => item._id == id )

	try {
		const response = await fetch(apiUrl + '/api/v2/tasks/' + todo._id, {
			credentials: 'include',
			method: 'DELETE',
			headers: { Authorization: authToken }
		})
		if (response.ok) {
			todo = await response.json()			// The whole Task is returned on successful delete (we could add the .deleted property in the API)
		} else {
			throw `Failed Removing Task! ${response.statusText} - ${response.status}`
		}
	} catch (err) {
		message1.textContent = 'ERROR!'
		message2.textContent = err
		message3.textContent = "Unable to DELETE Task! " + todo._id
		throw message3.textContent
	}
	todo.deleted = true													// Signal to updatePageDom() that this item is to be removed
	todoItems = todoItems.filter( (item) => item._id != id )			// Remove it from the main array
	updatePageDom(todo)
}

async function editTodo(id) {
	const index = todoItems.findIndex( (item) => item._id == id )

	let input = window.prompt("Edit Todo item", todoItems[index].description)
	let inputValue = input ? stripHTML(input).trim() : ''			// or sanitizeHTML()
	if (inputValue != '' && inputValue != todoItems[index].description) {
		todoItems[index].description = inputValue
		try {
			const response = await fetch(apiUrl + '/api/v2/tasks/' + todoItems[index]._id, {
				credentials: 'include',
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: authToken
				},
				body: JSON.stringify(todoItems[index], ['completed','description'])			// Send only the properties we're allowed to update
			})
			if (response.ok) {
				todoItems[index] = await response.json()
			} else {
				throw `Failed Updating Task! ${response.statusText} - ${response.status}`
			}
		} catch (err) {
			message1.textContent = 'ERROR!'
			message2.textContent = err
			message3.textContent = "Unable to PATCH Update Task! " + todoItems[index]._id
			throw message3.textContent
		}
		updatePageDom(todoItems[index])
	}
}
