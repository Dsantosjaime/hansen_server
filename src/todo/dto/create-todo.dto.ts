import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

import { ToDoType } from "generated/prisma/enums";

export class CreateTodoDto {
  @ApiProperty({
    description: "ObjectId du contact",
    example: "65b3d2f5c9a1b3e7f1c2d3e4",
  })
  @IsMongoId()
  contactId!: string;

  @ApiProperty({ enum: ToDoType, example: ToDoType.REMINDER })
  @IsEnum(ToDoType)
  type!: ToDoType;

  @ApiProperty({ example: "Rappeler le client" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: "Date ISO", example: "2026-02-04T10:00:00.000Z" })
  @IsDateString()
  toDoAt!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
