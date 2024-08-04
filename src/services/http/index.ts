import { createServer, RequestListener } from 'http';
import { isTestingEnv } from '@/helper';

const PORT = 3000;
const DOMAIN = "localhost";
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_TEXT = { 'Content-Type': 'text/plain' };

export function createServiceHttp() {
    // Create a server
    const module = {
        mainFunction: (((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, CONTENT_TYPE_JSON);
                
                res.end(JSON.stringify({
                    
                }));
            } else {
                res.writeHead(404, CONTENT_TYPE_TEXT);
                res.end('Not Found');
            }
        }) as RequestListener),
        server: (() => {
            if (isTestingEnv()) return null;

            return createServer(this.mainFunction)
                .listen(PORT, () => {
                    console.log(`Server running at http://${DOMAIN}:${PORT}`);
                });
        })()
    };

    return module;
}
