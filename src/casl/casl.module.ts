import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CaslGuard } from './casl.guard';
import { UsersModule } from 'src/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [CaslAbilityFactory, CaslGuard],
  exports: [CaslAbilityFactory, CaslGuard],
})
export class CaslModule {}
