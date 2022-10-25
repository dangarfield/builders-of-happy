const fastify = require('fastify')({ logger: false })
const cors = require('@fastify/cors')
const multipart = require('@fastify/multipart')
const static = require('@fastify/static')
const {v4: uuidv4} = require('uuid')
const jsoning = require('jsoning')
let db = new jsoning('data/db.json')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { listenerCount } = require('process')

fastify.register(cors)
fastify.register(multipart, { attachFieldsToBody: true })
fastify.register(static, {
  root: path.join(__dirname, 'files'),
  prefix: '/certification-bricks/'
})

// Declare a route
fastify.get('/certifications/:user', async (req, reply) => {
    const user = req.params.user
    if (!user.includes('@tui.')) {
        return {error: 'Invalid user'}
    }
    let userRecord = await db.get(user)
    if (!userRecord) {
        userRecord = {user: user, certifications: []}
    }
    console.log('userRecord', user, userRecord)
    return userRecord
})

fastify.post('/certifications/:user', async (req, reply) => {
    const user = req.params.user
    if (!user.includes('@tui.')) {
        return {error: 'Invalid user'}
    }
    console.log('addCert', user)
    const data = await req.file()
    console.log('data.fields', data, req.body)
    try {


      if (!req.body || !req.body.category || req.body.category.value.length < 1) {
        console.log('Add cert - invalid category field')
        return {error: true, errorMsg: 'Unable to process request - Invalid category field'}
      } else if ( !req.body.provider || req.body.provider.value.length < 1) {
        console.log('Add cert - Invalid provider field')
        return {error: true, errorMsg: 'Unable to process request - Invalid provider field'}
      } else if ( !req.body.name || req.body.name.value.length < 1) {
        console.log('Add cert - Invalid certification name field')
        return {error: true, errorMsg: 'Unable to process request - Invalid certification name field'}
      } else if ( !req.body.image || req.body.image.value.length < 1) {
        console.log('Add cert - Invalid image field')
        return {error: true, errorMsg: 'Unable to process request - Invalid image field'}
      } else if ( !req.body.imageData || req.body.imageData.value.length < 1) {
        console.log('Add cert - Invalid imageData field')
        return {error: true, errorMsg: 'Unable to process request - Invalid imageData field'}
      } else {

        let userRecord = await db.get(user)
        if (!userRecord) {
            userRecord = {user: user, certifications: []}
        }
        const certification = {
          id: uuidv4(),
          category: req.body.category.value,
          provider: req.body.provider.value,
          name: req.body.name.value,
          imageData: req.body.imageData.value
        }

        const base64Data = req.body.image.value.replace(/^data:image\/png;base64,/, "")
        fs.writeFileSync(path.join('files', `${certification.id}.png`), base64Data, 'base64')
        userRecord.certifications.push(certification)
        console.log('addCertification', user, userRecord)
        await db.set(user, userRecord)

        return userRecord
      }
    } catch (error) {
      console.log('Add cert - Error processing', error)
      return {error: true, errorMsg: 'Error processing request'}
    }

})

fastify.delete('/certifications/:user/:id', async (req, reply) => {
    const user = req.params.user
    const id = req.params.id
    if (!user.includes('@tui.')) {
        return {error: 'Invalid user'}
    }
    let userRecord = await db.get(user)
    if (!userRecord) {
        userRecord = {user: user, certifications: []}
    }
    for(var i in userRecord.certifications){
      if(userRecord.certifications[i].id === id){
        userRecord.certifications.splice(i,1)
        break
      }
    }
    const imgPath = path.join('files', `${id}.png`)
    if (fs.existsSync(imgPath)) { fs.unlinkSync(imgPath)}
    await db.set(user, userRecord)

    // console.log('delete cert userRecord', user, userRecord)
    return userRecord
})

const combineImages = async () => {
  let files = []
  const filesTemp = fs.readdirSync('files').filter(f => f !== 'all-bricks.png').map(f => path.join('files', f))

  for (let i = 0; i < 30; i++) {
    console.log('concat')
    files = files.concat(filesTemp)
  }
  const total = files.length
  const rowCount = Math.ceil(files.length/9)
  const lineCount = Math.ceil(total/rowCount)
  const firstImage = await sharp(files[0])
  const { width, height } = await firstImage.metadata()



        // const x = i % imageData.width
        // const y = i / imageData.width
  files = files.map((f,i) => {
    const row = Math.floor(i / rowCount)
    const left = Math.floor(i % rowCount) * width + row % 2 * (width/2)
    const top = row * height
    return {
      input: f,
      left,
      top
    }
  })
  console.log('combineImages', files, files.length)
  console.log('w',width, 'h', height, 'rowCount', rowCount, 'lineCount', lineCount, 'total', total)
  await sharp({
  create: {
    width: (rowCount * width) + width/2,
    height: lineCount * height,
    channels: 4,
    background: { r: 100, g: 100, b: 100, alpha: 1 }
  }
})
.png()
.composite(files)
.toFile(path.join('files', 'all-bricks.png'))
}

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3001 })
    combineImages()
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
