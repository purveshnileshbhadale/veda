export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'researcher' | 'student' | 'professor' | 'admin';
  institution?: string;
  department?: string;
  avatar_url?: string;
  research_interests: string[];
  is_verified: boolean;
  created_at: string;
}

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  doi?: string;
  arxiv_id?: string;
  authors: Author[];
  year?: number;
  journal?: string;
  citation_count: number;
  status: string;
  tags: string[];
  created_at: string;
}

export interface Author {
  name: string;
  affiliation?: string;
  orcid?: string;
  author_order: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  paper_count: number;
  tags: string[];
  created_at: string;
}

export interface Concept {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  aliases: string[];
  paper_count: number;
  confidence: number;
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  is_public: boolean;
  node_count: number;
  edge_count: number;
}

export interface Experiment {
  id: string;
  title: string;
  description?: string;
  hypothesis?: string;
  research_question?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'failed' | 'analyzed';
  tags: string[];
  variable_count: number;
  created_at: string;
}

export interface Manuscript {
  id: string;
  title: string;
  abstract?: string;
  status: 'draft' | 'writing' | 'reviewing' | 'completed' | 'published';
  template?: string;
  target_journal?: string;
  keywords: string[];
  word_count: number;
  version: number;
  sections: ManuscriptSection[];
  created_at: string;
}

export interface ManuscriptSection {
  id: string;
  title: string;
  content: string;
  section_type?: string;
  order: number;
  word_count: number;
  ai_generated: boolean;
}

export interface GapAnalysis {
  topic: string;
  identified_gaps: Array<{
    gap: string;
    description: string;
    significance: string;
    related_papers: string[];
  }>;
  opportunities: Array<{
    opportunity: string;
    potential_impact: string;
    feasibility: string;
  }>;
  recommendations: string[];
  confidence: number;
}

export interface DashboardStats {
  total_papers: number;
  total_experiments: number;
  total_manuscripts: number;
  recent_activity: ActivityItem[];
  citations_over_time: { date: string; count: number }[];
  research_progress: { category: string; progress: number }[];
}

export interface ActivityItem {
  id: string;
  type: 'paper_added' | 'experiment_created' | 'manuscript_updated' | 'analysis_completed';
  description: string;
  timestamp: string;
}
