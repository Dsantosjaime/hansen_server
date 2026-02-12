import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoService } from "./todo.service";

@ApiTags("todos")
@ApiBearerAuth("jwt")
@Controller("todos")
@UseGuards(JwtAuthGuard, CaslGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @ApiOperation({
    summary: "Lister les todos (filtre optionnel: contactId, done)",
  })
  @ApiQuery({ name: "contactId", required: false, type: String })
  @ApiQuery({
    name: "done",
    required: false,
    type: Boolean,
    description: "true|false",
  })
  @CheckAbilities({ action: "read", subject: "Todo" })
  async findAll(
    @Query("contactId") contactId?: string,
    @Query("done") doneStr?: string,
  ) {
    const done =
      doneStr === undefined ? undefined : doneStr === "true" ? true : false;

    return this.todoService.findAll({ contactId, done });
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un todo" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "Todo" })
  async findOne(@Param("id") id: string) {
    return this.todoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Créer un todo" })
  @CheckAbilities({ action: "create", subject: "Todo" })
  async create(@Body() dto: CreateTodoDto) {
    return this.todoService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un todo" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Todo" })
  async update(@Param("id") id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un todo" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "Todo" })
  async remove(@Param("id") id: string) {
    return this.todoService.remove(id);
  }
}
