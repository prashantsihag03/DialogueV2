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
const formStatusEle = document.getElementById('form-status')
const formStatusContainerEle = document.getElementById('form-status-container')

const updateFormStatus = (message = '', color = 'green') => {
  if (message.length > 0) {
    formStatusContainerEle.style.top = '1rem'
    formStatusEle.style.backgroundColor = color
    formStatusEle.innerHTML = message
  } else {
    formStatusContainerEle.style.top = '-5rem'
    formStatusEle.innerHTML = ''
  }
}

const signupContainer = document.getElementById('signup')
const loginContainer = document.getElementById('login')
const formSwitch = document.getElementById('form-switch')
const illustrateImg = document.getElementById('illustration-img')

const showLoginForm = () => {
  document.getElementById('login').style.display = 'flex'
  document.getElementById('signup').style.display = 'none'
  document.getElementById('form-heading').innerHTML = 'Log In'
  document.getElementById('form-switch').innerHTML = 'signup instead'
  illustrateImg.src = 'images/chatting.svg'
  return
}

document.getElementById('form-switch').addEventListener('click', () => {
  loginFormDisplay = document.getElementById('login').style.display
  updateFormStatus('')

  // show login form
  if (loginFormDisplay === 'none') {
    showLoginForm()
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

login.addEventListener('submit', async (e) => {
  e.preventDefault()
  updateFormStatus('')
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

  if (!loginformValid) {
    return
  }

  fetch('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: login.username.value.trim(),
      password: login.password.value.trim()
    })
  })
    .then((response) => {
      if (response.status === 200) {
        updateFormStatus('Success. Redirecting ...', 'green')
        setTimeout(() => {
          window.location.replace('/home')
        }, 500)
        return
      } else {
        updateFormStatus(response.statusText, 'red')
      }
    })
    .catch((err) => {
      updateFormStatus('Error. Please try again!', 'red')
    })
})

const validateUsername = async (username) => {
  try {
    if (username == null || username.length <= 1) {
      return false
    }

    const resp = await fetch(`/username/${username.toLocaleLowerCase().trim()}/available`, {
      method: 'GET'
    })

    if (resp.status == 404) {
      signup.children[0].innerHTML = 'this username is not available. Try a different one.'
      return false
    } else if (resp.status == 200) {
      signup.children[0].innerHTML = ''
      return true
    }
  } catch {
    signup.children[0].innerHTML = 'Error validating username. Please try again later.'
    return false
  }
}

signup.addEventListener('submit', async (e) => {
  updateFormStatus('')
  let signupformValid
  let userIdAvailable = false
  e.preventDefault()

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

  // validation
  if (signup.username.value.trim() == '') {
    signup.children[0].innerHTML = 'this field is required'
    signupformValid = false
  } else {
    userIdAvailable = await validateUsername(signup.username.value)
  }

  if (!signupformValid || !userIdAvailable) return

  fetch('/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: signup.username.value.trim(),
      password: signup.password.value.trim(),
      email: signup.email.value.trim()
    })
  })
    .then((response) => {
      if (response.status === 200) {
        updateFormStatus('Success', 'green')
        setTimeout(() => {
          updateFormStatus('')
          showLoginForm()
        }, 500)
        return
      } else {
        updateFormStatus(response.statusText, 'red')
      }
    })
    .catch((err) => {
      updateFormStatus('Error. Please try again!', 'red')
    })
})
