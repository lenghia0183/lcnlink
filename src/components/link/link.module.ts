import { Module } from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkController } from './link.controller';
import { RepositoryModule } from '@database/repositories';

@Module({
  imports: [RepositoryModule],
  providers: [LinkService],
  controllers: [LinkController],
})
export class LinkModule {}
