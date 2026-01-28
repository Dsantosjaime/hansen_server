import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PermissionDto {
  @ApiProperty({ example: 'Post' })
  @IsString()
  subject!: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  action!: string;
}
