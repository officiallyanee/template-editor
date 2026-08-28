import type { TemplateState } from "../state/types";
import { dashboardTemplate } from "./dashboardTemplate";
import { starterTemplate } from "./starterTemplate";

export const TEMPLATE_OPTIONS = [
  {
    id: starterTemplate.templateId,
    label: "Example Studio",
    description: "Editorial landing page",
    template: starterTemplate,
  },
  {
    id: dashboardTemplate.templateId,
    label: "Launch Dashboard",
    description: "Responsive status layout",
    template: dashboardTemplate,
  },
] as const;

export type TemplateOptionId = (typeof TEMPLATE_OPTIONS)[number]["id"];

export function templateOption(templateId: string) {
  return TEMPLATE_OPTIONS.find((option) => option.id === templateId);
}

export function freshTemplate(templateId: string): TemplateState {
  const option = templateOption(templateId) ?? TEMPLATE_OPTIONS[0];
  return structuredClone(option.template);
}
