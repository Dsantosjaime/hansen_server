import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserWithRoleDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'john.doe@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'TempPassw0rd!' })
  @IsString()
  @MinLength(8)
  temporaryPassword!: string;

  @ApiProperty({
    example: '66f2c1e4d2a9b7c3f1a2b3c4',
    description: 'Mongo ObjectId du rôle',
  })
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
