const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = 8000

const BASE_PATH = 'https://vercel-clone-outputs.s3.ap-south-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy()

app.use((req, res) => { // middleware
    const hostname = req.hostname; // eg: meet.google.com
    const subdomain = hostname.split('.')[0]; // eg meet

    // Custom Domain - DB Query

    const resolvesTo = `${BASE_PATH}/${subdomain}`

    // target: http-proxy instance to forward the incoming request to the resolvesTo
    // changeOrigin: true: This modifies the Host header of the proxied request to match the target URL (resolvesTo), making the request appear as if it was made directly to the target server.

    // Streams Response: The proxy streams the response from S3 back to the client.
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true }) // GET request: The proxy returns the response from that S3 URL to the user.

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))