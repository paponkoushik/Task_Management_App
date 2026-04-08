import { z } from "zod";
import { TASK_STATUSES } from "@/lib/app-constants";

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nullablePositiveInt = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().int().positive().nullable());

const nullableStoryPoints = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().int().min(1).max(100).nullable());

const memberIdArray = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    if (typeof item === "string") {
      const parsed = Number(item);
      return Number.isNaN(parsed) ? item : parsed;
    }

    return item;
  });
}, z.array(z.number().int().positive()).max(20));

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.preprocess(emptyToNull, z.string().max(500).nullable()),
  storyPoints: nullableStoryPoints,
  estimate: z.preprocess(emptyToNull, z.string().max(60).nullable()),
  assigneeIds: memberIdArray,
});

export const managerTaskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.preprocess(emptyToNull, z.string().max(500).nullable()),
  storyPoints: nullableStoryPoints,
  estimate: z.preprocess(emptyToNull, z.string().max(60).nullable()),
  assigneeIds: memberIdArray,
  sprintId: nullablePositiveInt,
  status: z.enum(TASK_STATUSES),
});

export const memberTaskUpdateSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const createSprintSchema = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.preprocess(emptyToNull, z.string().max(220).nullable()),
});

export const sprintStatusUpdateSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const createTaskCommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
});
