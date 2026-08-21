export type ConnectedGitHubRepository = { fullName: string; name: string; owner: string; private: boolean; description: string | null; defaultBranch: string; updatedAt: string | null; language: string | null };

export async function listConnectedGitHubRepositories(accessToken: string): Promise<ConnectedGitHubRepository[]> {
  const response = await fetch("https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&per_page=100", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "User-Agent": "EsotericCode-private-import", "X-GitHub-Api-Version": "2022-11-28" } });
  if (!response.ok) throw new Error(response.status === 401 ? "Your GitHub connection has expired or was revoked. Reconnect it to continue." : "GitHub could not list your repositories.");
  const repositories = await response.json() as Array<{ full_name: string; name: string; private: boolean; description: string | null; default_branch: string; updated_at: string | null; language: string | null; owner: { login: string } }>;
  return repositories.map(repo => ({ fullName: repo.full_name, name: repo.name, owner: repo.owner.login, private: repo.private, description: repo.description, defaultBranch: repo.default_branch, updatedAt: repo.updated_at, language: repo.language }));
}
