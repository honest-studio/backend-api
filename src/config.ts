import { readFileSync } from 'fs';

const SSL = {
    key: readFileSync("/home/kedar/certs/key.pem"),
    cert: readFileSync("/home/kedar/certs/certificate.pem")
}
const Copyleak = {
    Email: "kedarmail@gmail.com",
    ApiKey: readFileSync("/home/kedar/certs/copyleak_api_key", "utf-8")
}

export { SSL, Copyleak }
