import { Koa } from '@discordx/koa';

export const createHttpServer = async () => {
    // Create HTTP server
    const httpServer = new Koa();
    await httpServer.build();

    return new Promise<string>(resolve => {
        // Start HTTP server
        const port = process.env.PORT ?? 0;
        const server = httpServer.listen(port, () => {
            const address = server.address();
            const localURL = typeof address === 'string' ? address : `http://localhost:${address?.port}`;
            resolve(localURL);
        });
    });
};
