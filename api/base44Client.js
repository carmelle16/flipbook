/**
 * Base44 API Client
 * Mock implementation for development
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK !== 'false'; // Use mock by default

class Base44Client {
  constructor() {
    this.baseUrl = BASE_URL;
    this.token = localStorage.getItem('auth_token');
    this.mockFlipbooks = new Map(); // Store mock flipbooks
    this.useMock = USE_MOCK_DATA;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(method, endpoint, data = null) {
    // If using mock data, don't make actual requests
    if (this.useMock) {
      console.warn(`[MOCK] ${method} ${endpoint}`, data);
      return Promise.resolve({});
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Flipbook endpoints
  async getFlipbooks() {
    if (this.useMock) {
      return Array.from(this.mockFlipbooks.values());
    }
    return this.request('GET', '/flipbooks');
  }

  async getFlipbook(id) {
    if (this.useMock) {
      return this.mockFlipbooks.get(id) || { id, title: 'Flipbook not found' };
    }
    return this.request('GET', `/flipbooks/${id}`);
  }

  async createFlipbook(data) {
    if (this.useMock) {
      const id = data.id || Math.random().toString(36).substr(2, 9);
      const flipbook = {
        id,
        title: data.title || 'Untitled Flipbook',
        description: data.description || '',
        is_public: data.is_public || false,
        page_images: data.page_images || [],
        page_count: data.page_count || 0,
        cover_image: data.cover_image || null,
        pdf_url: data.pdf_url || null,
        overlays: data.overlays || [],
        toc: data.toc || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.mockFlipbooks.set(id, flipbook);
      console.log('[MOCK] Created flipbook:', flipbook);
      return flipbook;
    }
    return this.request('POST', '/flipbooks', data);
  }

  async updateFlipbook(id, data) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(id);
      if (flipbook) {
        const updated = { ...flipbook, ...data, updated_at: new Date().toISOString() };
        this.mockFlipbooks.set(id, updated);
        return updated;
      }
      return null;
    }
    return this.request('PUT', `/flipbooks/${id}`, data);
  }

  async deleteFlipbook(id) {
    if (this.useMock) {
      this.mockFlipbooks.delete(id);
      return { success: true };
    }
    return this.request('DELETE', `/flipbooks/${id}`);
  }

  // Page endpoints
  async getPages(flipbookId) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(flipbookId);
      return flipbook?.pages || [];
    }
    return this.request('GET', `/flipbooks/${flipbookId}/pages`);
  }

  async getPage(flipbookId, pageId) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(flipbookId);
      return flipbook?.pages?.find(p => p.id === pageId) || null;
    }
    return this.request('GET', `/flipbooks/${flipbookId}/pages/${pageId}`);
  }

  async createPage(flipbookId, data) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(flipbookId);
      if (flipbook) {
        if (!flipbook.pages) flipbook.pages = [];
        const page = { id: Math.random().toString(36).substr(2, 9), ...data };
        flipbook.pages.push(page);
        return page;
      }
      return null;
    }
    return this.request('POST', `/flipbooks/${flipbookId}/pages`, data);
  }

  async updatePage(flipbookId, pageId, data) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(flipbookId);
      if (flipbook && flipbook.pages) {
        const page = flipbook.pages.find(p => p.id === pageId);
        if (page) {
          Object.assign(page, data);
          return page;
        }
      }
      return null;
    }
    return this.request('PUT', `/flipbooks/${flipbookId}/pages/${pageId}`, data);
  }

  async deletePage(flipbookId, pageId) {
    if (this.useMock) {
      const flipbook = this.mockFlipbooks.get(flipbookId);
      if (flipbook && flipbook.pages) {
        flipbook.pages = flipbook.pages.filter(p => p.id !== pageId);
        return { success: true };
      }
      return null;
    }
    return this.request('DELETE', `/flipbooks/${flipbookId}/pages/${pageId}`);
  }

  // Upload endpoints
  async uploadPDF(flipbookId, file) {
    if (this.useMock) {
      return { 
        file_url: URL.createObjectURL(file),
        success: true 
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const options = {
      method: 'POST',
    };

    if (this.token) {
      options.headers = {
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/flipbooks/${flipbookId}/upload-pdf`,
        { ...options, body: formData }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Entities namespace
  entities = {
    Flipbook: {
      create: (data) => this.createFlipbook(data),
      get: (id) => this.getFlipbook(id),
      list: () => this.getFlipbooks(),
      update: (id, data) => this.updateFlipbook(id, data),
      delete: (id) => this.deleteFlipbook(id),
    },
  };

  // Integrations namespace
  integrations = {
    Core: {
      InvokeLLM: async (options) => {
        // Mock LLM response for development
        console.warn('[MOCK] InvokeLLM called with:', options.prompt);
        return `${options.prompt.slice(0, 50)}... - Generated description (mock)`;
      },
      UploadFile: async (options) => {
        // Mock file upload for development
        console.warn('[MOCK] UploadFile called');
        return { file_url: URL.createObjectURL(options.file) };
      },
    },
  };
}

export const base44 = new Base44Client();
