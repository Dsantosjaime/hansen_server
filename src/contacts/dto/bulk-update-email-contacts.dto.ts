import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";

export class BulkUpdateContactEmailsDto {
  @ApiProperty({ type: [String], minItems: 1, description: "Ids des contacts" })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({
    example: "hansen-marine",
    description: "Domaine de l'email, sans extension",
  })
  @IsString()
  @IsNotEmpty()
  domain!: string;

  @ApiProperty({
    example: "com",
    description: "Extension du domaine",
  })
  @IsString()
  @IsNotEmpty()
  extension!: string;

  @ApiProperty({
    example: "{first}.{last}",
    description: "Pattern de génération d'email",
  })
  @IsString()
  @IsNotEmpty()
  pattern!: string;
}
