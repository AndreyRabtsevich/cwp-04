const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const port = 8124;
const filesRequest = 'FILES';
const accept = 'ACK';
const decline = 'DEC';
const requestOnNextFile = 'REMAINING FILES';
const remoteRequest = 'REMOTE';
const reqRemCopy = 'COPY';
const reqRemEncode = 'ENCODE';
const reqRemDecode = 'DECODE';
const algorithm = 'aes-128-cbc';
const defaultDir = process.env.FILES_DIR;
const maxCountConnection = parseInt(process.env.MAX_COUNT_CON);
let seed = 0;
let clients = [];
let files = [];
let flag = 0;
let connections = 0;

function getUniqID() {
    return Date.now() + seed++;
}
const server = net.createServer((client) => {
    let writeableStream;
    if(++connections === maxCountConnection){
        client.destroy();
    }
    client.setEncoding('utf8');

    client.on('data', (data) => {
        if (data === filesRequest || data === remoteRequest) {
            client.id = getUniqID();
            if (data == filesRequest)
            {
                files[client.id] = [];
                fs.mkdir(defaultDir + path.sep + client.id);
            }
            console.log(data);
            console.log(`Client ${client.id} connected`);
            clients[client.id] = data;
            client.write(accept);
           
        }
        else if (client.id === undefined) {
            client.write(decline);
            client.destroy();
        }
        else if (clients[client.id] === filesRequest && data !== filesRequest) {
            files[client.id].push(data);
            flag++;
            if (flag === 2) {
                let buf = Buffer.from(files[client.id][0],'hex');
                let filePath = defaultDir+path.sep+client.id+path.sep+files[client.id][1];
                writeableStream = fs.createWriteStream(filePath);
                writeableStream.write(buf);
                flag=0;
                files[client.id] = [];
                writeableStream.close();
                client.write(requestOnNextFile);
            }
        }
        else if(clients[client.id] === remoteRequest && data !== remoteRequest){
            console.log(data);
            let file = data.split(' ');
            let readStream = fs.createReadStream(file[1]);
            let writeStream = fs.createWriteStream(file[2]);
            if(file[0] === reqRemCopy){
                readStream.pipe(writeStream).on('close', sendNext);
            }
            if(file[0] === reqRemEncode){
                let cryptoStream = crypto.createCipher(algorithm, file[3]);
                readStream.pipe(cryptoStream).pipe(writeStream).on('close', sendNext);
            }
            if(file[0] === reqRemDecode){
                let cryptoStream = crypto.createDecipher(algorithm, file[3]);
                readStream.pipe(cryptoStream).pipe(writeStream).on('close', sendNext);
            }
        }
    });
    function sendNext() {
        client.write(accept);
    }
    client.on('end', () => {
        connections--;
        console.log(`Client ${client.id} disconnected`);
    });
});

server.listen(port, () => {
    console.log(`Server listening on localhost:${port}`);
});
