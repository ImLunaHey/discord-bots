import 'reflect-metadata';
import { dirname as dirnameImporter, importx } from '@discordx/importer';
import { Koa } from '@discordx/koa';
import { logger } from '../common/logger.js';
import { createDiscordClient } from '../common/discord-client.js';
import { environment, botToken } from '../common/config.js';

const NAME = 'user-tag-manager';

const main = async () => {
  logger.info('Starting "%s" in "%s" mode.', NAME, environment);

  // Check we have everything we need to start
  if (!botToken) throw Error(`"BOT_TOKEN" environment variable missing.`);

  // Load all the events, commands and api
  await importx(`${dirnameImporter(import.meta.url)}/{events,commands,api}/**/*.{ts,js}`);

  // Create the discord.js client
  const client = createDiscordClient(NAME, { intents: [], partials: [], prefix: '$utm' });

  // let's start the bot
  await client.login(botToken);

  // api: prepare server
  const httpServer = new Koa();

  // api: need to build the api server first
  await httpServer.build();

  // api: let's start the server now
  const port = process.env.PORT ?? 0;
  const server = httpServer.listen(port, () => {
    const address = server.address();
    const localURL = typeof address === 'string' ? address : `http://localhost:${address?.port}`;
    logger.info('API server started at "%s"', localURL);
  });
};

main().catch(async (error: unknown) => {
  const { environment } = await import('../common/config.js');

  if (!(error instanceof Error)) throw new Error(`Unknown error "${error}"`); 
  if (environment !== 'production') logger.error('Failed to load bot with "%s"\n%s', error.message, error.stack);
  else logger.error('Failed to load bot with "%s"', error.message);
});
