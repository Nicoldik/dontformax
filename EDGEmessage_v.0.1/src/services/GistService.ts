import { ChatMessage, Contact } from '../types/domain';

const API = 'https://api.github.com';
const contactsFile = 'contacts.json';
const messagesFile = 'messages.json';

const headers = (pat: string): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${pat}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json'
});

const parse = <T,>(input: string, fallback: T): T => {
  try { return JSON.parse(input) as T; } catch { return fallback; }
};

const readFiles = async (pat: string, gistId: string) => {
  const res = await fetch(`${API}/gists/${gistId}`, { headers: headers(pat) });
  if (!res.ok) throw new Error(`Gist read failed: ${res.status}`);
  const data = (await res.json()) as { files?: Record<string, { content?: string }> };
  return data.files ?? {};
};

const upsert = async (pat: string, gistId: string | null, description: string, files: Record<string, { content: string }>) => {
  const creating = !gistId;
  const res = await fetch(creating ? `${API}/gists` : `${API}/gists/${gistId}`, {
    method: creating ? 'POST' : 'PATCH',
    headers: headers(pat),
    body: JSON.stringify({ description, public: false, files })
  });
  if (!res.ok) throw new Error(`Gist write failed: ${res.status}`);
  if (creating) {
    const created = (await res.json()) as { id: string };
    return created.id;
  }
  return gistId;
};

export const GistService = {
  async syncContacts(pat: string, gistId: string): Promise<Contact[]> {
    const files = await readFiles(pat, gistId);
    return parse(files[contactsFile]?.content ?? '[]', [] as Contact[]);
  },

  async saveContacts(pat: string, contacts: Contact[], gistId: string | null): Promise<string> {
    return upsert(pat, gistId, 'EDGEmessage contacts', {
      [contactsFile]: { content: JSON.stringify(contacts, null, 2) }
    });
  },

  async syncMessages(pat: string, gistId: string): Promise<ChatMessage[]> {
    const files = await readFiles(pat, gistId);
    return parse(files[messagesFile]?.content ?? '[]', [] as ChatMessage[]);
  },

  async sendMessage(pat: string, gistId: string, next: ChatMessage, current: ChatMessage[]): Promise<void> {
    await upsert(pat, gistId, 'EDGEmessage chat', {
      [messagesFile]: { content: JSON.stringify([...current, next], null, 2) }
    });
  }
};
