const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { response } = require('express')
var needle = require('needle'); //ssrf
var url = require('url'); //ssrf
var cookieParser = require('cookie-parser'); //deser
var escape = require('escape-html'); //deser
var serialize = require('node-serialize'); //deser
const router = new express.Router()

// Register New user

router.post('/api/v2/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.cookie('auth_token', token)
        // res.sendFile(path.resolve(__dirname, '..', 'src','templates', 'views', 'dashboard.html'));
        res.status(201).redirect('/dashboard')
    } catch (e) {
        res.status(400).send(e)
    }
})

// Log in existing user

router.post('/dashboard', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.cookie('auth_token', token)
        // res.sendFile('../templates/views/dashboard.hbs')
        res.status(201).redirect('/dashboard')
    } catch (e) {
        res.status(400).redirect('../index.html?error=' + encodeURIComponent('Wrong username or password'))
    }
})


//vulnerable code 1
    //   let myobj = { email: req.body.email, password: req.body.password };
//         const user = await User.findOne(req.body.email, req.body.password)
//         const token = await user.generateAuthToken()
//         res.cookie('auth_token', token)
//         // res.sendFile('../templates/views/dashboard.hbs')
//         res.status(201).redirect('/dashboard')
//     } catch (e) {
//         res.status(400).redirect('../index.html?error=' + encodeURIComponent('Wrong username or password'))
//     }
// })



// Vulnerable Code2

// router.post('/dashboard',function(req,res){
//     let query = { 
// 		email : req.body.email,
// 		password : req.body.password
// 	}
    
//     User.findOne(query, function (err, user)   {
        
//         console.log(user)
//         if(err){
//             res.send('error')
//         }
//         else{
//             if(!user){
//                 return res.send('success')

//             }
            
//         }
//         return res.send('error')
            
//         })
        

// })

// Vulnerable Code ends


// Log out user

router.get('/logout', auth, async (req, res) => {
	try {
		req.user.tokens = []
		await req.user.save()
		await res.redirect('/')

		
	} catch (e) {
		res.status(500).send()
	}
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


// === Backend page links - authorization needed === 

router.get('/api/v2/profile', auth, async (req, res) => {

     res.send({
         user: req.user
     })
})

router.post('/api/v2/profile', auth, async (req, res) => {


    var profile = req.body.profile
 	res.render('profile', profile)
})

router.get('/settings', auth, async (req, res) => {
	res.render('settings')

})


router.patch('/api/v2/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        console.log('saved')
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/api/v2/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/dashboard', auth, (req, res) => {
	try {
		res.render('dashboard')
	} catch (e) {
		res.status(500).send('')
	}
})

// === Frontend page links - no authorization === 

// router.get('/contact', (req, res) => {
// 	try {
// 		res.redirect('../contact.html')
// 	} catch (e) {
// 		res.status(500).send('')
// 	}
// })




//SSRF

router.get('/contact', (req, res) => {
    var url_parts = url.parse(req.url, true)
    var query = url_parts.query
    console.log(query.url)
    if (query.url !=undefined){
        needle.get(query.url, { timeout: 3000 }, function(error, response1) {
            if (!error) {
              
                res.redirect(query.url)
            } else {
                res.redirect('../contact.html?url=')
      
            }
          });

    }else{
        res.redirect('../contact.html?url')
    }
    
})


//SSRF ends
//cmd inj starts
router.get('/api/v2/user', function (req, res) {
    
    res.send('Welcome name ' + eval(req.query.name));
    console.log(req.query.name);
  });
//cmd inj ends


// =================Older Version APIs=========================


// router.get('/api/v1/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try {
//         const user = await User.findById(_id)

//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.get('/api/v1/users/:name', async (req, res) => {
    const name = req.params.name

    try {
        const user = await User.findOne({name: name})

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

// router.patch('/api/v1/users/:id', async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

//     if (!isValidOperation) {
//         return res.status(400).send({ error: 'Invalid updates!' })
//     }

//     try {
//         const user = await User.findById(req.params.id)

//         updates.forEach((update) => user[update] = req.body[update])
//         await user.save()

//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(400).send(e)
//     }
// })

router.patch('/api/v1/users/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const user = await User.findById(req.params.id)

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/api/v1/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

// ====================Older APIs Ends==================================
module.exports = router