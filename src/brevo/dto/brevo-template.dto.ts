import { ApiProperty } from "@nestjs/swagger";

export class BrevoTemplateDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  isActive!: boolean;
}
