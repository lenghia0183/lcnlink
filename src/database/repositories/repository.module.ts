import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './user/user.repository';
import { User } from '@database/entities/user.entity';
import { LinkRepository } from './link/link.repository';
import { Link } from '@database/entities/link.entity';
import { ClickRepository } from './click/click.repository';
import { Click } from '@database/entities/click.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Link, Click])],
  providers: [UserRepository, LinkRepository, ClickRepository],
  exports: [UserRepository, LinkRepository, ClickRepository],
})
export class RepositoryModule {}
