const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'registry.json');

class StorageInterface {
    constructor() {
        this.data = this._load();
    }

    _load() {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
        return {
            MOCK_SITES: {
                'ws_01': [],
                'ws_02': []
            },
            MOCK_ACTIVITY: { 'ws_01': [], 'ws_02': [] },
            MOCK_MEMBERS: {
                'ws_01': [
                    { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' },
                    { id: 'u2', username: 'dev_user', role: 'Editor', email: 'dev@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u2' }
                ],
                'ws_02': [
                    { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' }
                ],
                MOCK_WORKSPACES: [
                    { id: 'ws_01', name: 'Alpha Factory', members: ['avon_admin', 'dev_user'] },
                    { id: 'ws_02', name: 'Expansion Lab', members: ['avon_admin'] }
                ]
            }
        };
    }

    _save() {
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
    }

    // --- Workspaces ---
    getWorkspaces(username) {
        // Handle legacy structure where MOCK_WORKSPACES might be missing or in root
        const workspaces = this.data.MOCK_WORKSPACES || [
            { id: 'ws_01', name: 'Alpha Factory', members: ['avon_admin', 'dev_user'] },
            { id: 'ws_02', name: 'Expansion Lab', members: ['avon_admin'] }
        ];
        return workspaces.filter(ws => ws.members.includes(username));
    }

    getWorkspace(workspaceId) {
        const workspaces = this.data.MOCK_WORKSPACES || [
            { id: 'ws_01', name: 'Alpha Factory', members: ['avon_admin', 'dev_user'] },
            { id: 'ws_02', name: 'Expansion Lab', members: ['avon_admin'] }
        ];
        return workspaces.find(ws => ws.id === workspaceId);
    }

    // --- Sites ---
    getSites(workspaceId) {
        return this.data.MOCK_SITES[workspaceId] || [];
    }

    getSiteById(id) {
        for (const wsId in this.data.MOCK_SITES) {
            const site = this.data.MOCK_SITES[wsId].find(s => s.id === id);
            if (site) return site;
        }
        return null;
    }

    addSite(workspaceId, siteData) {
        if (!this.data.MOCK_SITES[workspaceId]) this.data.MOCK_SITES[workspaceId] = [];
        this.data.MOCK_SITES[workspaceId].unshift(siteData); // Add to top
        this._save();
        return siteData;
    }

    updateSite(workspaceId, siteId, updates) {
        const sites = this.data.MOCK_SITES[workspaceId];
        if (!sites) return null;
        const index = sites.findIndex(s => s.id === siteId);
        if (index === -1) return null;

        sites[index] = { ...sites[index], ...updates };
        this._save();
        return sites[index];
    }

    deleteSite(workspaceId, siteId) {
        if (this.data.MOCK_SITES[workspaceId]) {
            const index = this.data.MOCK_SITES[workspaceId].findIndex(s => s.id === siteId);
            if (index !== -1) {
                const site = this.data.MOCK_SITES[workspaceId][index];
                this.data.MOCK_SITES[workspaceId].splice(index, 1);
                this._save();
                return site;
            }
        }
        return null;
    }

    // --- Activity ---
    getActivity(workspaceId) {
        return this.data.MOCK_ACTIVITY[workspaceId] || [];
    }

    addActivity(workspaceId, activity) {
        if (!this.data.MOCK_ACTIVITY[workspaceId]) this.data.MOCK_ACTIVITY[workspaceId] = [];
        this.data.MOCK_ACTIVITY[workspaceId].unshift(activity);
        this._save();
    }

    // --- Members ---
    getMembers(workspaceId) {
        return this.data.MOCK_MEMBERS[workspaceId] || [];
    }
}

module.exports = new StorageInterface();
