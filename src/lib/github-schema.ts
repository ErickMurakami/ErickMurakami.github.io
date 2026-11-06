export interface RepositoryMetadata {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  topics: string[];
  updatedAt: string;
}
export interface Snapshot {
  version: 1;
  projects: RepositoryMetadata[];
}
export interface Publication {
  owner: string;
  approved: string[];
}
