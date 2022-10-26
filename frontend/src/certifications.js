import { backendUrl } from './utils'
import { getImage, getImageData, initImageProcessor, certPreviewToLego } from './image-processor'

export const loadCertificationsViewForUser = (userData) => {
  // Add user details
  const user = userData.user
  console.log('loadCertificationsViewForUser', user)
  for (const userEle of document.querySelectorAll('.user')) {
    userEle.innerHTML = user
  }
  document.querySelector('.certification-user').value = user

  // Load certificates
  const certList = document.querySelector('.certification-list')
  if (userData.certifications.length === 0) {
    certList.innerHTML = '<p>No certifications added</p>'
  } else {
    certList.innerHTML = ''
  }
  for (const certification of userData.certifications) {
    certList.innerHTML += `<div class="col-sm-2">
            <div class="card mb-3">
            <img src="${backendUrl}/certification-bricks/${certification.id}.png" class="card-img-top to-lego" crossorigin="anonymous">
            <div class="card-body">
                <h5 class="card-title">${certification.name}</h5>
                <p class="card-text">${certification.category} - ${certification.provider}</p>
                <a href="/certification-remove" class="btn btn-danger float-end certification-remove" data-id="${certification.id}"><i class="bi bi-x-lg"></i> Remove</a>
            </div>
            </div>
        </div>`
    for (const certRemove of certList.querySelectorAll('.certification-remove')) {
      certRemove.addEventListener('click', async function (e) {
        e.preventDefault()
        const id = this.getAttribute('data-id')
        console.log('remove cert', user, id)

        const req = await window.fetch(`${backendUrl}/certifications/${user}/${id}`, {
          method: 'DELETE'
        })

        const res = await req.json()
        console.log('remove cert res', res)

        if (res.error) {
          //
        } else {
          loadCertificationsViewForUser(res)
        }
      })
    }
    for (const toLegoImage of certList.querySelectorAll('.to-lego')) {
      certPreviewToLego(toLegoImage)
    }
  }

  // Reset add form
  document.querySelector('.certification-reset').click()
  document.querySelector('.brick-source-reset').click()

  // Temp
  document.querySelector('.certification-category').value = 'Architecture'
  document.querySelector('.certification-provider').value = 'AWS'
  document.querySelector('.certification-name').value = 'Cert 123'
}

export const bindBrickSources = () => {
  const brickSourcePreviewEle = document.querySelector('.brick-source-preview')
  const brickSourcePreviewHolderEle = document.querySelector('.brick-source-preview-holder')
  document.querySelector('.brick-source-image-file').addEventListener('change', function (e) {
    console.log('.brick-source-image-file change', this, e)
    const fr = new window.FileReader()
    fr.onload = function () {
      brickSourcePreviewEle.setAttribute('src', fr.result)
      brickSourcePreviewHolderEle.classList.remove('d-none')
      initImageProcessor(brickSourcePreviewEle)
    }
    fr.readAsDataURL(e.target.files[0])
  })
  document.querySelector('.brick-source-image-url-submit').addEventListener('click', function (e) {
    console.log('.brick-source-image-file change', this, e)
    const url = document.querySelector('.brick-source-image-url').value
    brickSourcePreviewEle.setAttribute('src', url)
    brickSourcePreviewHolderEle.classList.remove('d-none')
    initImageProcessor(brickSourcePreviewEle)
  })

  for (const selectImage of document.querySelectorAll('.brick-source-image-select')) {
    selectImage.addEventListener('click', function () {
      const url = this.getAttribute('src')
      console.log('url', url)
      brickSourcePreviewEle.setAttribute('src', url)
      brickSourcePreviewHolderEle.classList.remove('d-none')
      initImageProcessor(brickSourcePreviewEle)
    })
  }
  document.querySelector('.certification-reset').addEventListener('click', function (e) {
    document.querySelector('.certification-category').value = 'Developer'
    document.querySelector('.certification-provider').value = ''
    document.querySelector('.certification-name').value = ''
  })
  document.querySelector('.brick-source-reset').addEventListener('click', function (e) {
    brickSourcePreviewHolderEle.classList.add('d-none')
    document.querySelector('.brick-source-image-file').value = ''
    document.querySelector('.brick-source-image-url').value = ''
  })
  document.querySelector('.certification-submit').addEventListener('click', function (e) {
    const invalidCertificationEle = document.querySelector('.invalid-certification')
    const certification = {
      user: document.querySelector('.certification-user').value,
      category: document.querySelector('.certification-category').value,
      provider: document.querySelector('.certification-provider').value,
      name: document.querySelector('.certification-name').value,
      image: getImage(),
      imageData: getImageData()
    }
    console.log('certification', certification)
    if (certification.category.length < 1) {
      invalidCertificationEle.textContent = 'Invalid certification category'
      invalidCertificationEle.classList.remove('d-none')
    } else if (certification.provider.length < 1) {
      invalidCertificationEle.textContent = 'Invalid certification provider'
      invalidCertificationEle.classList.remove('d-none')
    } else if (certification.name.length < 1) {
      invalidCertificationEle.textContent = 'Invalid certification name'
      invalidCertificationEle.classList.remove('d-none')
    } else if (certification.image === undefined || certification.imageData === undefined) {
      invalidCertificationEle.textContent = 'Invalid brick image, please add another'
      invalidCertificationEle.classList.remove('d-none')
    } else {
      invalidCertificationEle.classList.add('d-none')
      addCertification(certification)
    }
  })
}

const addCertification = async (certification) => {
  const data = new window.FormData()
  data.append('category', certification.category)
  data.append('provider', certification.provider)
  data.append('name', certification.name)
  data.append('image', certification.image)
  data.append('imageData', certification.imageData)

  const invalidCertificationEle = document.querySelector('.invalid-certification')
  const submitBtn = document.querySelector('.certification-submit')
  submitBtn.setAttribute('disabled', 'disabled')
  const req = await window.fetch(`${backendUrl}/certifications/${certification.user}`, {
    method: 'POST',
    body: data
  })

  const res = await req.json()
  console.log('addCertification res', res)
  submitBtn.removeAttribute('disabled')

  if (res.error) {
    invalidCertificationEle.textContent = res.errorMsg
    invalidCertificationEle.classList.remove('d-none')
  } else {
    invalidCertificationEle.classList.add('d-none')
    loadCertificationsViewForUser(res)
  }
}
// https://pbs.twimg.com/profile_images/1473756532827246593/KRgw2UkV_400x400.jpg
