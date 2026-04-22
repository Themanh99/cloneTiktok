import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({})
export class UserModule {
    constructor(private readonly configService: ConfigService) {
        console.log(this.configService.get('databaseUser'));
        console.log(this.configService.get('databasePassword'));
    }
}
