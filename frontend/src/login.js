import { showHideView, backendUrl } from './utils'
import { loadCertificationsViewForUser } from './certifications'
export const bindLogin = () => {
  console.log('bindLogin', document.querySelector('form.login'))
  document.querySelector('form.login').addEventListener('submit', async function (e) {
    e.preventDefault()
    const email = this.querySelector('.email').value
    login(email)
  })
}
export const login = async (email) => {
  console.log('email', email)
  const req = await window.fetch(`${backendUrl}/certifications/${email}`)
  const res = await req.json()
  console.log('certifications', res)
  if (res.error) {
    document.querySelector('.invalid-user').classList.remove('d-none')
  } else {
    document.querySelector('.invalid-user').classList.add('d-none')
    showHideView('certifications')
    loadCertificationsViewForUser(res)
  }
}
