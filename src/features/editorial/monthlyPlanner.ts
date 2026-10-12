export type EditorialFormat = "post" | "reels" | "carousel";
export interface MonthlyItem {
  date: string;
  format: EditorialFormat;
  title: string;
  copy: string;
  editorial?: EditorialTrace;
}
export interface EditorialContext {
  objective: string;
  audience: string;
  tone: string;
  positioning: string;
  restrictions: string;
  topics?: string[];
  forbiddenTerms?: string[];
  avoidedTopics?: string[];
  approvedFacts?: string[];
  visualGuidance?: string;
  carouselSlides?: number;
  reelsSeconds?: number;
  reelsScenes?: number;
  changeNote?: string;
  strategyId?: string;
  briefingRevision?: string;
  repertoireVersion?: number;
  engineVersion?: string;
}
export const emptyContext: EditorialContext = {
  objective: "",
  audience: "",
  tone: "",
  positioning: "",
  restrictions: "",
};
export const formatNames = {
  post: "Post",
  reels: "Reels",
  carousel: "Carrossel",
};
export interface EditorialTrace {
  humanEdited?: boolean;
  version: string;
  theme: string;
  pillarId: string;
  pillar: string;
  family: string;
  angle: string;
  journey: string;
  objective: string;
  audience: string;
  cta: string;
  signature: string;
  visual: string;
  caption?: string;
  postConcept?: { headline: string; support: string; composition: string; caption: string };
  slides?: { text: string; visual: string; headline?: string; role?: string }[];
  scenes?: { seconds: number; text: string; visual: string; narration?: string; onScreen?: string; camera?: string; audio?: string; role?: string }[];
  warnings: string[];
  sources: string[];
  rules: string[];
}
export { generateCampaignPlan as generateMonthlyPlan } from "./campaignEngine";
