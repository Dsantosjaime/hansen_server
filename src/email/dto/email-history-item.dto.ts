import { ApiProperty } from "@nestjs/swagger";

export class EmailHistoryItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  brevoCampaignId!: number;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  deliveredAt?: Date;

  @ApiProperty({ required: false })
  openedAt?: Date;

  @ApiProperty({ required: false })
  clickedAt?: Date;

  @ApiProperty({ required: false })
  bouncedAt?: Date;

  @ApiProperty({ required: false })
  unsubscribedAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}
