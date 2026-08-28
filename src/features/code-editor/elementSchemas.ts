import { z } from "zod";
import type { ElementProperties, ElementType } from "../../state/types";

const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color, for example #0075de.");
const base = z
  .object({
    text: z.string().max(240).optional(),
    color: color.optional(),
    backgroundColor: color.optional(),
    fontSize: z.number().min(10).max(96).optional(),
    fontWeight: z.number().min(300).max(800).optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    width: z.number().min(40).max(1440).optional(),
    height: z.number().min(24).max(900).optional(),
    padding: z.number().min(0).max(120).optional(),
    gap: z.number().min(0).max(96).optional(),
    direction: z.enum(["row", "column"]).optional(),
    alignSelf: z.enum(["auto", "start", "center", "end", "stretch"]).optional(),
    borderRadius: z.number().min(0).max(100).optional(),
  })
  .strict();

export const elementSchemas: Record<
  ElementType,
  z.ZodType<ElementProperties>
> = {
  heading: base.pick({
    text: true,
    color: true,
    fontSize: true,
    fontWeight: true,
    align: true,
    alignSelf: true,
  }),
  paragraph: base.pick({
    text: true,
    color: true,
    fontSize: true,
    fontWeight: true,
    align: true,
    alignSelf: true,
  }),
  button: base.pick({
    text: true,
    color: true,
    backgroundColor: true,
    width: true,
    height: true,
    borderRadius: true,
    fontWeight: true,
    alignSelf: true,
  }),
  container: base.pick({
    backgroundColor: true,
    padding: true,
    gap: true,
    direction: true,
    width: true,
    height: true,
    alignSelf: true,
  }),
};
