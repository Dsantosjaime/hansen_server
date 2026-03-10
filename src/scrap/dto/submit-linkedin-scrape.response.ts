import { ApiProperty } from "@nestjs/swagger";

export class SubmitLinkedinScrapeResponseDto {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty({ example: 10 })
  received!: number;
}
