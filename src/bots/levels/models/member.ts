import autoBind from 'auto-bind';
import { Entity, EntityData, Schema } from 'redis-om';
import { client } from '../../../common/redis.js';

export interface Member {
    id: string | null;
    guildId: string | null;
    'levels.xp': number | null;
    'levels.level': number | null;
    'levels.messagesPerWindow': number | null;
    'stats.messageCount': number | null;
    'stats.reactionCount': number | null;
    'stats.voiceMinutes': number | null;
}

export class Member extends Entity {
    constructor(schema: Schema<any>, id: string, data?: EntityData | undefined) {
        super(schema, id, data);
        autoBind(this);
    }

    /**
     * Deletes the member from the database
     */
    async delete() {
        await memberRepository.remove(this.entityId);
    }

    /**
     * Persists the member to the database
     */
    async save() {
        await memberRepository.save(this);
    }
};

export const memberSchema = new Schema(Member, {
    id: { type: 'number' },
    guildId: { type: 'number' },
    'levels.xp': { type: 'number' },
    'levels.level': { type: 'number' },
    'levels.messagesPerWindow': { type: 'number' },
    'stats.messageCount': { type: 'number' },
    'stats.reactionCount': { type: 'number' },
    'stats.voiceMinutes': { type: 'number' }
}, {
    dataStructure: 'HASH'
});

export const memberRepository = client.fetchRepository(memberSchema);

await memberRepository.createIndex();
