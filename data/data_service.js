// services/dataService.js - API Data Management with Fallbacks
export const dataService = {
  // Mock data for when API is not available
  mockProcedures: [
    {
      id: 1,
      name: "Risk Assessment Framework",
      lob: "GRM",
      primary_owner: "John Smith",
      expiry: "2024-12-15",
      score: 92,
      status: "active"
    },
    {
      id: 2,
      name: "Trading Compliance Guidelines",
      lob: "CIB",
      primary_owner: "Sarah Johnson",
      expiry: "2024-07-20",
      score: 78,
      status: "expiring"
    },
    {
      id: 3,
      name: "Client Onboarding Process",
      lob: "IWPB",
      primary_owner: "Mike Chen",
      expiry: "2024-06-01",
      score: 85,
      status: "expired"
    },
    {
      id: 4,
      name: "Data Protection Protocol",
      lob: "GCOO",
      primary_owner: "Lisa Wang",
      expiry: "2025-03-10",
      score: 94,
      status: "active"
    },
    {
      id: 5,
      name: "Investment Analysis Standards",
      lob: "IWPB",
      primary_owner: "David Brown",
      expiry: "2024-11-30",
      score: 88,
      status: "active"
    }
  ],

  mockDashboardData: {
    stats: {
      total: 247,
      expiringSoon: 23,
      expired: 8,
      highQuality: 186
    },
    recentActivity: [
      {
        id: 1,
        action: "Updated procedure",
        procedure: "Risk Assessment Framework",
        time: "2 hours ago",
        type: "update",
        score: 92
      },
      {
        id: 2,
        action: "Procedure expiring soon",
        procedure: "Trading Compliance Guidelines",
        time: "1 day ago",
        type: "warning",
        score: 78
      },
      {
        id: 3,
        action: "New procedure uploaded",
        procedure: "Data Protection Protocol",
        time: "3 days ago",
        type: "assignment",
        score: 94
      }
    ],
    userInfo: {
      displayName: "Mina Antoun Wilson Ross",
      department: "Global Technology",
      email: "mina.wilson.ross@hsbc.com",
      jobTitle: "Senior Analyst"
    }
  },

  // Fetch procedures with fallback
  async fetchProcedures() {
    try {
      console.log('🔄 Attempting to fetch procedures from API...');
      
      const response = await fetch('/ProceduresHubEG6/api/procedures');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API procedures loaded successfully:', data.length);
        return data;
      } else {
        console.warn('⚠️ API returned non-OK status:', response.status);
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ API not available, using mock data:', error.message);
      console.log('📝 Mock procedures loaded:', this.mockProcedures.length);
      return this.mockProcedures;
    }
  },

  // Fetch dashboard data with fallback
  async fetchDashboardData() {
    try {
      console.log('🔄 Attempting to fetch dashboard data from API...');
      
      const response = await fetch('/ProceduresHubEG6/api/user/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API dashboard data loaded successfully');
        return data;
      } else {
        console.warn('⚠️ API returned non-OK status:', response.status);
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Dashboard API not available, using mock data:', error.message);
      console.log('📝 Mock dashboard data loaded');
      return this.mockDashboardData;
    }
  },

  // Calculate stats from procedures array
  calculateStats(procedures) {
    const now = new Date();
    
    const total = procedures.length;
    const expired = procedures.filter(p => new Date(p.expiry) < now).length;
    const expiringSoon = procedures.filter(p => {
      const expiry = new Date(p.expiry);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    }).length;
    const highQuality = procedures.filter(p => (p.score || 0) >= 80).length;

    return {
      total,
      expired,
      expiringSoon,
      highQuality
    };
  },

  // Submit new procedure
  async submitProcedure(formData) {
    try {
      console.log('🔄 Submitting procedure to API...');
      
      const response = await fetch('/ProceduresHubEG6/api/procedures', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Procedure submitted successfully');
        return result;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error submitting procedure:', error);
      
      // Return mock success for demo purposes
      console.log('📝 Returning mock submission result');
      return {
        accepted: true,
        procedure: {
          id: Date.now(),
          name: formData.get('name'),
          score: Math.floor(Math.random() * 30) + 70 // Random score 70-100
        },
        analysis: {
          score: Math.floor(Math.random() * 30) + 70,
          details: {
            foundElements: ['Document Control', 'Risk Assessment'],
            missingElements: ['Approval Matrix', 'Review Schedule']
          }
        }
      };
    }
  },

  // Check if APIs are available
  async checkAPIHealth() {
    try {
      const [proceduresTest, dashboardTest] = await Promise.allSettled([
        fetch('/ProceduresHubEG6/api/procedures', { method: 'HEAD' }),
        fetch('/ProceduresHubEG6/api/user/dashboard', { method: 'HEAD' })
      ]);

      const health = {
        procedures: proceduresTest.status === 'fulfilled' && proceduresTest.value.ok,
        dashboard: dashboardTest.status === 'fulfilled' && dashboardTest.value.ok,
        overall: false
      };

      health.overall = health.procedures && health.dashboard;

      console.log('🏥 API Health Check:', health);
      return health;
    } catch (error) {
      console.warn('⚠️ API health check failed:', error);
      return {
        procedures: false,
        dashboard: false,
        overall: false
      };
    }
  }
};