const net = require('net');
const fs = require('fs');
const port = 8124;
const client = new net.Socket();
const remoteRequest = 'REMOTE';
const accept = 'ACK';
const decline = 'DEC';
let count = 0;

client.setEncoding('utf8');

client.connect(port, () => {
    console.log('Connected');
    client.write(remoteRequest);
});

client.on('data', (data) => {
    console.log(data);
    if(data === decline){
        client.destroy();
    }
    else if(data === accept){
        count++;
        switch (count){
            case 1:
                sendCopy();
                break;
            case 2:
                sendEncode();
                break;
            case 3:
                sendDecode();
                break;
            case 4:
                client.destroy();
        }
    }
});
function sendCopy() {
    client.write('COPY D:\\sosiska.txt D:\\testo.txt');
}
function sendEncode() {
    client.write('ENCODE D:\\sosiska.txt D:\\encode.txt 123');
}
function sendDecode() {
    client.write('DECODE D:\\encode.txt D:\\decode.txt 123');
}
client.on('close', function () {
    console.log('Connection closed');
});