import { z } from 'zod';

export const ObjectiveSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  quarter: z.string().regex(/^\d{4}Q[1-4]$/, '例: 2026Q2'),
  status: z.enum(['active', 'completed', 'archived']),
});

export const KeyResultSchema = z.object({
  objectiveId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  targetValue: z.number(),
  currentValue: z.number().default(0),
  unit: z.string().min(1).max(50),
  dueDate: z.coerce.date(),
  status: z.enum(['on_track', 'at_risk', 'behind', 'completed']).default('on_track'),
});

export const ActionSchema = z.object({
  keyResultId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  estimatedMinutes: z.number().int().min(1).max(1440),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['todo', 'in_progress', 'done', 'skipped']).default('todo'),
});

export const ActionLogSchema = z.object({
  actionId: z.number().int().positive(),
  loggedAt: z.coerce.date(),
  note: z.string().default(''),
  progressDelta: z.number().default(0),
  mood: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const AppSettingsSchema = z.object({
  aiApiKey: z.string().default(''),
  aiProvider: z.enum(['openai', 'anthropic', 'local']).default('openai'),
  syncEnabled: z.boolean().default(false),
  ritualSettings: z.object({
    enabled: z.boolean().default(true),
    soundEnabled: z.boolean().default(true),
    confettiEnabled: z.boolean().default(true),
    streakGoal: z.number().int().min(1).max(365).default(7),
  }),
});

export type ObjectiveInput = z.infer<typeof ObjectiveSchema>;
export type KeyResultInput = z.infer<typeof KeyResultSchema>;
export type ActionInput = z.infer<typeof ActionSchema>;
export type ActionLogInput = z.infer<typeof ActionLogSchema>;
export type AppSettingsInput = z.infer<typeof AppSettingsSchema>;
