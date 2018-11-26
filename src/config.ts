import { readFileSync } from 'fs';

const SSL = {
    key: readFileSync("/home/kedar/certs/key.pem"),
    cert: readFileSync("/home/kedar/certs/certificate.pem")
}

export { SSL }
