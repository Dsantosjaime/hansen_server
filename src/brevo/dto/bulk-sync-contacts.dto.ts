import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsEmail } from "class-validator";

export class BulkSyncContactsDto {
  @ApiProperty({
    example: ["alice@acme.com", "bob@acme.com"],
    description: "Emails à upsert + ajouter à la liste Brevo du sous-groupe.",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails!: string[];
}
