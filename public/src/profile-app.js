// Retrieve user data to display on account settings page
cosole.log('dsdsasd')
fetch('/api/v2/profile')
	.then((response) => {
        if (!response.ok) {
            throw Error(response.statusText)
        }
    	return response.json()
    })
    .then((data) => {

        // Displays info depending on if data for user exists
        const display = (userData, dataId, dataName) => {
            if (userData) {
                document.getElementById(dataId).innerHTML = `<strong>${dataName}</strong>: ${userData}`
            } else {
                document.getElementById(dataId).innerHTML = `<strong>${dataName}</strong>: <em>Add details</em>`
            }
        }

        
        display(data.user.name, 'name', 'Name')             // Name
    	document.querySelector('#email').innerHTML = `<strong>Email</strong>: ${data.user.email}` // Email
        // Don't display password details for security reasons
        // https://github.com/VitthalS/ivna

    	console.log(data.user)
	})
    .catch(err => console.log(err))





