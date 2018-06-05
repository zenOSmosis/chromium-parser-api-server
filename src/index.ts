import expressServer from './expressServer';

const API_PORT = process.env.HTTP_API_PORT || 8080;

if (expressServer.listen(API_PORT)) {
    console.log(`Listening on ${API_PORT}`);
}
