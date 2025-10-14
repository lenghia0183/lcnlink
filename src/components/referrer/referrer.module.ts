import { Module } from '@nestjs/common';
import { ReferrerService } from './referrer.service';
import { ReferrerController } from './referrer.controller';
import { RepositoryModule } from '@database/repositories';

@Module({
  imports: [RepositoryModule],
  providers: [ReferrerService],
  controllers: [ReferrerController],
})
export class ReferrerModule {}
