import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './user/user.repository';
import { User } from '@database/entities/user.entity';
import { LinkRepository } from './link/link.repository';
import { Link } from '@database/entities/link.entity';
import { ClickRepository } from './click/click.repository';
import { Click } from '@database/entities/click.entity';
import { ReferrerRepository } from './referrer/referrer.repository';
import { Referrer } from '@database/entities/referrer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Link, Click, Referrer])],
  providers: [
    UserRepository,
    LinkRepository,
    ClickRepository,
    ReferrerRepository,
  ],
  exports: [
    UserRepository,
    LinkRepository,
    ClickRepository,
    ReferrerRepository,
  ],
})
export class RepositoryModule {}
