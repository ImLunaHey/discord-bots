import 'reflect-metadata';
import { dirname as dirnameImporter, importx } from '@discordx/importer';
import { logger } from '../../common/logger.js';
import { createDiscordClient } from '../../common/discord-client.js';
import { environment, botToken } from '../../common/config.js';
import { Intents } from 'discord.js';

const NAME = 'levels';

const main = async () => {
  logger.info('Starting "%s" in "%s" mode.', NAME, environment);

  // Check we have everything we need to start
  if (!botToken) throw Error(`"BOT_TOKEN" environment variable missing.`);

  // Load all the events, commands and api
  await importx(`${dirnameImporter(import.meta.url)}/{events,commands,api}/**/*.{ts,js}`);

  // Create the discord.js client
  const client = createDiscordClient(NAME, { intents: [Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILDS], partials: [], prefix: '$l' });

  // Connect to the discord gateway
  await client.login(botToken);
};

main().catch(async (error: unknown) => {
  const { environment } = await import('../../common/config.js');

  if (!(error instanceof Error)) throw new Error(`Unknown error "${error}"`); 
  if (environment !== 'production') logger.error('Failed to load bot with "%s"\n%s', error.message, error.stack);
  else logger.error('Failed to load bot with "%s"', error.message);
});
