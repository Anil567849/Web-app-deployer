import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import mime from 'mime-types'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Kafka } from 'kafkajs'

const s3Client = new S3Client({
    region: '',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID
const DEPLOYEMENT_ID = process.env.DEPLOYEMENT_ID

const kafka = new Kafka({
    clientId: `docker-build-server-${DEPLOYEMENT_ID}`,
    brokers: [''],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'kafka.pem'), 'utf-8')]
    },
    sasl: {
        username: '',
        password: '',
        mechanism: 'plain'
    }
})

const producer = kafka.producer()

async function publishLog(log) {
    await producer.send({ 
        topic: `container-logs`,
         messages: [{ 
            key: 'log', 
            value: JSON.stringify({ PROJECT_ID, DEPLOYEMENT_ID, log }) 
        }] 
    })
}

async function init(){
    await producer.connect()

    console.log('Executing script.js')
    publishLog('Build Started...')

    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on('data', function (data) {
        console.log(data.toString())
        publishLog(data.toString())
    })

    p.stdout.on('error', function (data) {
        console.log('Error', data.toString())
        publishLog(`error: ${data.toString()}`)
    })

    p.on('close', async function () {
        console.log('Build Complete')
        publishLog(`Build Complete`)
        
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })

        console.log("Starting to upload");
        publishLog(`Starting to upload`)
        
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath)
            publishLog(`uploading ${file}`)
            
            const command = new PutObjectCommand({
                Bucket: 'vercel-clone-outputs',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command)
            publishLog(`uploaded ${file}`)
            console.log('uploaded', filePath)
        }
        publishLog(`Done`)
        console.log('Done')
        process.exit(0)
    })
}

init();