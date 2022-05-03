import create from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorageKey, storageVersion, clearStorageMigration } from '~/logic/lib/util';

interface useChatStoreType {
  id: string;
  message: string;
  messageStore: Record<string, string>;
  restore: (id: string) => void;
  setMessage: (message: string) => void;
}

export const useChatStore = create<useChatStoreType>(persist((set, get) => ({
  id: '',
  message: '',
  messageStore: {},
  restore: (id: string) => {
    const store = get().messageStore;
    set({
      id,
      messageStore: store,
      message: store[id] || ''
    });
  },
  setMessage: (message: string) => {
    const store = get().messageStore;
    store[get().id] = message;

    set({ message, messageStore: store });
  }
}), {
  whitelist: ['messageStore'],
  name: createStorageKey('chat-unsent'),
  version: storageVersion,
  migrate: clearStorageMigration
}));

interface ChatReply {
  link: string;
  content: string;
}

interface ChatReplyStore {
  id: string;
  reply: ChatReply;
  replyStore: Record<string, ChatReply>;
  restore: (id: string) => void;
  setReply: (link?: string, content?: string) => void;
}

export const useReplyStore = create<ChatReplyStore>(persist((set, get) => ({
  id: '',
  reply: {
    link: '',
    content: ''
  },
  replyStore: {},
  restore: (id: string) => {
    const store = get().replyStore;
    set({
      id,
      reply: store[id] || { link: '', content: '' },
      replyStore: store
    });
  },
  setReply: (link = '', content = '') => {
    const reply = { link, content };
    const store = get().replyStore;
    store[get().id] = reply;

    set({ reply, replyStore: store });
  }
}), {
  whitelist: ['replyStore'],
  name: createStorageKey('reply-unsent'),
  version: storageVersion,
  migrate: clearStorageMigration
}));
