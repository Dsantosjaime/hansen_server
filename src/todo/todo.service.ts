import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ToDo } from "generated/prisma/client";

import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTodoDto): Promise<ToDo> {
    return this.prisma.toDo.create({
      data: {
        contactId: dto.contactId,
        type: dto.type,
        title: dto.title,
        toDoAt: new Date(dto.toDoAt),
        done: dto.done ?? false,
      },
    });
  }

  async findAll(params?: {
    contactId?: string;
    done?: boolean;
  }): Promise<ToDo[]> {
    const contactId = params?.contactId;
    const done = params?.done;

    return this.prisma.toDo.findMany({
      where: {
        ...(contactId ? { contactId } : {}),
        ...(done !== undefined ? { done } : {}),
      },
      orderBy: [{ done: "asc" }, { toDoAt: "asc" }],
    });
  }

  async findOne(id: string): Promise<ToDo> {
    const todo = await this.prisma.toDo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException(`Todo with id=${id} not found`);
    return todo;
  }

  async update(id: string, dto: UpdateTodoDto): Promise<ToDo> {
    await this.findOne(id);
    return this.prisma.toDo.update({
      where: { id },
      data: {
        ...(dto.contactId ? { contactId: dto.contactId } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.toDoAt ? { toDoAt: new Date(dto.toDoAt) } : {}),
        ...(dto.done !== undefined ? { done: dto.done } : {}),
      },
    });
  }

  async remove(id: string): Promise<ToDo> {
    await this.findOne(id);
    return this.prisma.toDo.delete({ where: { id } });
  }
}
