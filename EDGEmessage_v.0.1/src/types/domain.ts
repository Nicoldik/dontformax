export type Contact = {
  id: string;
  name: string;
  gistId: string;
  seed: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  from: string;
  encryptedBody: string;
  createdAt: string;
};

export type AppSettings = {
  edgeMode: boolean;
  pollMs: number;
};
