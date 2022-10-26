
export const showHideView = (activeClass) => {
  for (const view of document.querySelectorAll('.view')) {
    if (view.classList.contains(activeClass)) {
      view.classList.remove('d-none')
    } else {
      view.classList.add('d-none')
    }
  }
  for (const view of document.querySelectorAll('.nav-link')) {
    if (view.classList.contains(activeClass)) {
      view.classList.add('active')
    } else {
      view.classList.remove('active')
    }
  }
}
export const backendUrl = 'http://localhost:3001'
