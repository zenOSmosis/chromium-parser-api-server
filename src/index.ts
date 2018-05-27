import expressServer from './expressServer';

const API_PORT = process.env.HTTP_API_PORT || 8080;

expressServer.listen(HTTP_API_PORT);