import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PermissionDto } from './permission.dto';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  name!: string;

  @ApiProperty({ type: [PermissionDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];
}
