function checkWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('/').then((registration) => {
      if (registration == undefined) {
        // register worker
        navigator.serviceWorker
          .register('/worker.js', { scope: '/' })
          .then((registration) => {
            console.log('SW registered')
          })
          .catch((error) => {
            console.error('SW registration failed')
          })
      } else {
        console.log('SW already registered')
        if (registration.active.state == 'activated') {
          console.log('and is activated')
        } else {
          console.log("but isn't activated")
        }
      }
    })
  }
}
checkWorker()

const login = document.forms[0]
const signup = document.forms[1]

const signupContainer = document.getElementById('signup')
const loginContainer = document.getElementById('login')
const formSwitch = document.getElementById('form-switch')
const illustrateImg = document.getElementById('illustration-img')

document.getElementById('form-switch').addEventListener('click', () => {
  loginFormDisplay = document.getElementById('login').style.display

  // show login form
  if (loginFormDisplay === 'none') {
    document.getElementById('login').style.display = 'flex'
    document.getElementById('signup').style.display = 'none'
    document.getElementById('form-heading').innerHTML = 'Log In'
    document.getElementById('form-switch').innerHTML = 'signup instead'
    illustrateImg.src = 'images/chatting.svg'
    return
  }

  // show signup form
  document.getElementById('signup').style.display = 'flex'
  document.getElementById('login').style.display = 'none'
  document.getElementById('form-heading').innerHTML = 'Sign Up'
  document.getElementById('form-switch').innerHTML = 'login instead'
  illustrateImg.src = 'images/messaging.svg'
})

document.getElementById('logo').addEventListener('click', () => {
  location.reload()
})

login.addEventListener('submit', (e) => {
  e.preventDefault()
  console.log('logging in ..')
  let loginformValid
  // validation
  if (login.username.value == '') {
    login.children[0].innerHTML = 'this field is required'
    loginformValid = false
  } else {
    login.children[0].innerHTML = ''
    loginformValid = true
  }
  if (login.password.value == '') {
    login.children[2].innerHTML = 'this field is required'
    loginformValid = false
  } else {
    // validate values here
    if (login.password.value.length < 4) {
      login.children[2].innerHTML = 'password must be atleast 8 letters long'
      loginformValid = false
    } else {
      // good to go
      login.children[2].innerHTML = ''
      loginformValid = true
    }
  }
  if (loginformValid) {
    login.submit()
  }
})

signup.addEventListener('submit', (e) => {
  let signupformValid
  e.preventDefault()
  console.log('signing up ..')

  // validation
  if (signup.username.value.trim() == '') {
    signup.children[0].innerHTML = 'this field is required'
    signupformValid = false
  } else {
    fetch('/usernameAvailability', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: signup.username.value.trim() })
    }).then((response) => {
      if (response.status == 302) {
        signup.children[0].innerHTML = 'Username already taken'
        signupformValid = false
      } else if (response.status == 404) {
        signup.children[0].innerHTML = ''
        signupformValid = true
      }
    })
  }
  if (signup.password.value.trim() == '') {
    signup.children[2].innerHTML = 'this field is required'
    signupformValid = false
  } else {
    // validate values here
    if (signup.password.value.length < 8) {
      signup.children[2].innerHTML = 'Must include atleast 8 letters'
      signupformValid = false
    } else {
      // good to go
      signup.children[2].innerHTML = ''
      signupformValid = true
    }
  }
  if (signup.email.value == '') {
    login.children[4].innerHTML = 'this field is required'
    signupformValid = false
  } else {
    // validate values here
    signup.children[4].innerHTML = ''
    signupformValid = true
  }
  if (signupformValid) {
    signup.submit()
  }
})
