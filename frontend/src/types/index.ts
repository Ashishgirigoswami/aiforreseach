export interface ResearchProject {
  id: string;
  title: string;
  domain: string;
  createdAt: string;
  stage: "discover" | "analyze" | "write" | "publish";
  progress: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal: string;
  doi?: string;
  tags?: string[];
  notes?: string;
}

export interface ResearchTopic {
  title: string;
  noveltyScore: number;
  researchGap: string;
  keywords: string[];
}

export interface Hypothesis {
  problemStatement: string;
  variables: {
    independent: string[];
    dependent: string[];
    control: string[];
  };
  hypotheses: Array<{
    id: string;
    statement: string;
    type: "null" | "alternative";
  }>;
}

export interface AnalysisResult {
  themes: string[];
  codes: Array<{ code: string; frequency: number; sentiment: string }>;
  sentiment: { positive: number; negative: number; neutral: number };
}

export interface Citation {
  apa: string;
  mla: string;
  chicago: string;
}

export interface PublishScore {
  clarity: number;
  novelty: number;
  journalReadiness: number;
  plagiarismRisk: number;
  aiRisk: number;
}

export interface Journal {
  name: string;
  impactFactor: number;
  domain: string;
  submissionLink: string;
  acceptance: string;
}
