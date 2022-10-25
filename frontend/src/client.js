import { transform } from 'legofy'
import * as Cropper from 'cropperjs'
import { bindLogin, login } from './login'
import { showHideView } from './utils'
import { bindBrickSources } from './certifications'
import { initWall } from './wall'
const legofyAll = () => {
    for (const imgElement of document.querySelectorAll('.img-lego')) {
        console.log('imgElement', imgElement)
        const res = transform(imgElement, {
            factor: 0.05,
            blendMode: 'overlay'
        })
        console.log('res', res)
    }
}


const bindNav = () => {
    document.querySelector('.nav-link.wall').addEventListener('click', function(e) {
        e.preventDefault()
        showHideView('wall')
    })
    document.querySelector('.nav-link.stats').addEventListener('click', function(e) {
        e.preventDefault()
        showHideView('stats')
    })
    document.querySelector('.nav-link.certifications').addEventListener('click', function(e) {
        e.preventDefault()
        showHideView('login')
    })
}
const bindInputs = () => {
    bindLogin()
    bindBrickSources()
}
const init = () => {
    bindNav()
    bindInputs()
    initWall()
    // Temp
    // login('test.user@tui.com')
}

init()