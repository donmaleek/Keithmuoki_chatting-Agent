import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ConversationType {
  @Field()
  id!: string;

  @Field()
  clientId!: string;

  @Field()
  channel!: string;

  @Field()
  status!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class MessageType {
  @Field()
  id!: string;

  @Field()
  conversationId!: string;

  @Field()
  sender!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: Date;
}

@InputType()
export class IngestMessageInput {
  @Field()
  conversationId!: string;

  @Field()
  sender!: string;

  @Field()
  content!: string;

  @Field()
  channel!: string;
}
