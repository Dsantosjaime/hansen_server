import { PartialType } from "@nestjs/mapped-types";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { CreateTodoDto } from "./create-todo.dto";
import { ToDoType } from "generated/prisma/enums";

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @ApiPropertyOptional({ description: "ObjectId du contact" })
  @IsOptional()
  @IsMongoId()
  contactId?: string;

  @ApiPropertyOptional({ enum: ToDoType })
  @IsOptional()
  @IsEnum(ToDoType)
  type?: ToDoType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Date ISO" })
  @IsOptional()
  @IsDateString()
  toDoAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
