import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SkillsModule } from './modules/skills/skills.module.js';

@Module({
  imports: [PrismaModule, SkillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
