const API_URL = 'http://localhost:4000/api';

export const login = async (username: string, role?: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
    });
    return res.json();
};

export const fetchSites = async (token: string) => {
    const res = await fetch(`${API_URL}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch sites');
    return res.json();
};

export const fetchTemplates = async (token: string) => {
    const res = await fetch(`${API_URL}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
};

export const generateSite = async (token: string, prompt: string, templateId: string) => {
    const res = await fetch(`${API_URL}/generate-site`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, templateId })
    });
    return res.json();
};

export const upgradeAccount = async (token: string, role: string) => {
    const res = await fetch(`${API_URL}/upgrade`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
    });
    return res.json();
};

export const fetchWorkspaces = async (token: string) => {
    const res = await fetch(`${API_URL}/workspaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
};

export const switchWorkspace = async (token: string, workspaceId: string) => {
    const res = await fetch(`${API_URL}/workspaces/switch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workspaceId })
    });
    return res.json();
};

export const fetchMembers = async (token: string, workspaceId: string) => {
    const res = await fetch(`${API_URL}/workspaces/${workspaceId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
};

export const fetchActivity = async (token: string, workspaceId: string) => {
    const res = await fetch(`${API_URL}/workspaces/${workspaceId}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
};

export const inviteMember = async (token: string, workspaceId: string, email: string, role: string) => {
    const res = await fetch(`${API_URL}/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role })
    });
    return res.json();
};

export const deleteSite = async (token: string, siteId: string) => {
    const res = await fetch(`${API_URL}/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
};
