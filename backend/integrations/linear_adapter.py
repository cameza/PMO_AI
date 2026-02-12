"""
Linear API adapter — fetches initiatives, projects, and milestones via GraphQL.

Uses httpx (already in deps) to POST to https://api.linear.app/graphql.
No new dependencies required.
"""

import logging
from typing import List, Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)

LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql"


class LinearAdapter:
    """Thin adapter for Linear's GraphQL API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

    def _query(self, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute a GraphQL query against Linear."""
        payload: Dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables

        resp = httpx.post(
            LINEAR_GRAPHQL_URL,
            headers=self.headers,
            json=payload,
            timeout=30.0,
        )
        resp.raise_for_status()
        result = resp.json()

        if "errors" in result:
            error_msgs = [e.get("message", str(e)) for e in result["errors"]]
            raise RuntimeError(f"Linear GraphQL errors: {'; '.join(error_msgs)}")

        return result.get("data", {})

    def test_connection(self) -> Dict[str, Any]:
        """Test the API key and return workspace info."""
        query = """
        query {
            viewer {
                id
                name
                email
            }
            organization {
                id
                name
                urlKey
            }
        }
        """
        try:
            data = self._query(query)
            return {
                "success": True,
                "user": data.get("viewer", {}),
                "organization": data.get("organization", {}),
            }
        except Exception as e:
            logger.error(f"Linear connection test failed: {e}")
            return {"success": False, "error": str(e)}

    def fetch_initiatives(self) -> List[Dict[str, Any]]:
        """Fetch all initiatives from the workspace."""
        query = """
        query($cursor: String) {
            initiatives(first: 100, after: $cursor) {
                nodes {
                    id
                    name
                    description
                    status
                    targetDate
                    createdAt
                    updatedAt
                    owner {
                        id
                        name
                        email
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        all_initiatives: List[Dict[str, Any]] = []
        cursor = None

        while True:
            data = self._query(query, {"cursor": cursor})
            initiatives_data = data.get("initiatives", {})
            nodes = initiatives_data.get("nodes", [])
            all_initiatives.extend(nodes)

            page_info = initiatives_data.get("pageInfo", {})
            if not page_info.get("hasNextPage"):
                break
            cursor = page_info.get("endCursor")

        logger.info(f"Fetched {len(all_initiatives)} initiatives from Linear")
        return all_initiatives

    def fetch_projects(self) -> List[Dict[str, Any]]:
        """Fetch all projects with labels and initiative associations."""
        query = """
        query($cursor: String) {
            projects(first: 25, after: $cursor) {
                nodes {
                    id
                    name
                    description
                    state
                    status {
                        id
                        name
                        type
                    }
                    startDate
                    targetDate
                    completedAt
                    canceledAt
                    createdAt
                    updatedAt
                    lead {
                        id
                        name
                        email
                    }
                    creator {
                        id
                        name
                        email
                    }
                    labels(first: 20) {
                        nodes {
                            id
                            name
                            parent {
                                id
                                name
                            }
                        }
                    }
                    initiatives(first: 10) {
                        nodes {
                            id
                            name
                        }
                    }
                    projectMilestones {
                        nodes {
                            id
                            name
                            targetDate
                            sortOrder
                        }
                    }
                    projectUpdates(first: 1) {
                        nodes {
                            id
                            health
                            body
                            createdAt
                        }
                    }
                    teams(first: 10) {
                        nodes {
                            id
                            name
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        all_projects: List[Dict[str, Any]] = []
        cursor = None

        while True:
            data = self._query(query, {"cursor": cursor})
            projects_data = data.get("projects", {})
            nodes = projects_data.get("nodes", [])
            all_projects.extend(nodes)

            page_info = projects_data.get("pageInfo", {})
            if not page_info.get("hasNextPage"):
                break
            cursor = page_info.get("endCursor")

        logger.info(f"Fetched {len(all_projects)} projects from Linear")
        return all_projects

    def fetch_milestones(self, project_id: str) -> List[Dict[str, Any]]:
        """Fetch milestones for a specific project."""
        query = """
        query($projectId: String!) {
            project(id: $projectId) {
                projectMilestones {
                    nodes {
                        id
                        name
                        targetDate
                        sortOrder
                    }
                }
            }
        }
        """
        data = self._query(query, {"projectId": project_id})
        project = data.get("project", {})
        milestones = project.get("projectMilestones", {}).get("nodes", [])
        logger.info(f"Fetched {len(milestones)} milestones for project {project_id}")
        return milestones
