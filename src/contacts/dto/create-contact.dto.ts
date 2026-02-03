import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsString, MinLength } from "class-validator";

export class CreateContactDto {
  @ApiProperty({ example: "John" })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: "CTO" })
  @IsString()
  function!: string;

  @ApiProperty({ example: "Actif" })
  @IsString()
  status!: string;

  @ApiProperty({ example: "john.doe@company.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: ["+33600000000", "+33600000001"] })
  @IsArray()
  @IsString({ each: true })
  phoneNumber!: string[];

  @ApiProperty({ example: "2026-01-01" })
  @IsString()
  lastContact!: string;

  @ApiProperty({ example: "2026-01-10" })
  @IsString()
  lastEmail!: string;

  @ApiProperty({ example: "65b000000000000000000001" })
  @IsString()
  groupId!: string;

  @ApiProperty({ example: "65b100000000000000000001" })
  @IsString()
  subGroupId!: string;
}
