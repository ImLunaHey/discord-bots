import { CommandInteraction, GuildMember, MessageAttachment } from 'discord.js';
import { Discord, On, Slash, SlashOption } from 'discordx';
import type { ArgsOf } from 'discordx';
import canvacord from 'canvacord';
import { memberRepository } from '../models/member.js';
import { logger } from '../../../common/logger.js';

const RankCard = canvacord.Rank;

@Discord()
export class LevelCommands {
    constructor() {
        // Every minute check users with XP in this window
        setInterval(async () => {
            // Get members who have messaged in the last minute
            const members = await memberRepository.search().where('levels.messagesPerWindow').greaterThan(0).return.all();
            await Promise.allSettled(members.map(async member => {
                try {
                    // Award XP for at most 20 messages in the last minute
                    const messagesPerWindow = member['levels.messagesPerWindow'] ?? 0;
                    const xp = Math.min(messagesPerWindow, 20);
                    member['levels.messagesPerWindow'] = 0;
                    member['levels.xp'] = (member['levels.xp'] ?? 0) + xp;

                    // If XP is enough grant them the level
                    if (member['levels.xp'] >= 100) {
                        member['levels.xp'] = 0;
                        member['levels.level'] = (member['levels.level'] ?? 0) + 1;
                    }

                    // Persist xp update to database
                    await member.save();
                } catch (error: unknown) {
                    logger.error(error as string);
                }
            }));
        }, 10_000);
    }

    @On('messageCreate')
    async onMesssageCreate([message]: ArgsOf<'messageCreate'>) {
        if (!message.guild?.id || !message.member?.id) return;
        
        // Get member from database
        const member = await memberRepository.fetch(`${message.member?.id}:${message.guild?.id}`);

        // Update message count for this window
        member['levels.messagesPerWindow'] = (member['levels.messagesPerWindow'] ?? 1) + 1;

        // Update total message count
        member['stats.messageCount'] = (member['stats.messageCount'] ?? 1) + 1;

        // Save member to database
        await member.save();
    }

    @Slash('rank', {
        description: 'Check your rank'
    })
    async getRank(
        @SlashOption('member', { type: 'USER', description: 'Who\'s rank to check', required: false }) _selectedMember: GuildMember | undefined,
        interaction: CommandInteraction
    ) {
        const selectedMember = (_selectedMember ?? interaction.member) as GuildMember;
        const memberId = selectedMember.id;
        if (!interaction.guild?.id || !memberId) return;

        // Get member from database
        const member = await memberRepository.fetch(`${selectedMember.guild?.id}:${selectedMember?.id}`);

        // Get member's avatar URL
        const avatarURL = selectedMember.displayAvatarURL({
            format: 'png'
        });

        // Generate the rank card
        const rankCard = await new RankCard()
            .setAvatar(avatarURL)
            .setCurrentXP(((member['levels.level'] ?? 0) * 100) + (member['levels.xp'] ?? 0))
            .setRequiredXP(100)
            .setStatus((selectedMember.presence ?? 'offline') as 'online' | 'idle' | 'dnd' | 'offline' | 'streaming', false)
            .setProgressBar('#FFFFFF', 'COLOR')
            .setUsername(selectedMember.nickname ?? selectedMember.displayName)
            .setDiscriminator(selectedMember.user.discriminator)
            // @ts-expect-error
            .build();

        // Create the attachment for the reply
        const attachment = new MessageAttachment(rankCard, 'rank.png');

        // Success
        await interaction.reply({
            files: [attachment],
            ephemeral: true
        });
    }
}
