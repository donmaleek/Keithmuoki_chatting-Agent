import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HealthResolver } from './health.resolver';
import { MessagesResolver } from './messages.resolver';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true
    }),
    MessagesModule
  ],
  providers: [HealthResolver, MessagesResolver]
})
export class AppGraphqlModule {}
