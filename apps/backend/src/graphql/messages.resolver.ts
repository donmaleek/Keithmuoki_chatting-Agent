import { Query, Resolver, Args } from '@nestjs/graphql';
import { ConversationType, MessageType } from './types';
import { MessagesService } from '../messages/messages.service';

@Resolver()
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @Query(() => [ConversationType])
  async conversations(
    @Args('status', { nullable: true }) status?: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true, defaultValue: 50 }) take?: number
  ) {
    return this.messagesService.listConversations({
      status,
      skip: skip?.toString(),
      take: take?.toString()
    });
  }

  @Query(() => ConversationType)
  async conversation(@Args('id') id: string) {
    return this.messagesService.getConversation(id);
  }

  @Query(() => [MessageType])
  async messages(
    @Args('conversationId') conversationId: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true, defaultValue: 50 }) take?: number
  ) {
    return this.messagesService.listMessages(conversationId, {
      skip: skip?.toString(),
      take: take?.toString()
    });
  }
}
