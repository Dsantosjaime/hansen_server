import { ApiProperty } from "@nestjs/swagger";

export class BrevoCampaignDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false, nullable: true })
  scheduledAt?: string | null;

  @ApiProperty({ required: false, nullable: true })
  createdAt?: string | null;

  @ApiProperty({ required: false, nullable: true })
  modifiedAt?: string | null;
}
