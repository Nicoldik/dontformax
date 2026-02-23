import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LocalDbService } from '../services/LocalDbService';
import { AppSettings, Contact } from '../types/domain';
import { decryptAES256, encryptAES256, hashSHA256 } from '../utils/crypto';

const MASTER_HASH = 'edge.master.hash';
const SESSION = 'edge.session.enc';
const defaultSettings: AppSettings = { edgeMode: false, pollMs: 4000 };

type Ctx = {
  ready: boolean;
  initialized: boolean;
  unlocked: boolean;
  contacts: Contact[];
  pat: string;
  settings: AppSettings;
  setupMaster: (password: string) => Promise<void>;
  login: (password: string) => Promise<boolean>;
  lock: () => void;
  setPat: (pat: string) => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  replaceContacts: (contacts: Contact[]) => Promise<void>;
  setEdgeMode: (value: boolean) => Promise<void>;
  encryptMessage: (seed: string, plain: string) => Promise<string>;
  decryptMessage: (seed: string, sealed: string) => Promise<string>;
};

const VaultContext = createContext<Ctx | undefined>(undefined);

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [pat, setPatState] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const boot = async () => {
      await LocalDbService.init();
      const hash = await SecureStore.getItemAsync(MASTER_HASH);
      setInitialized(Boolean(hash));
      setReady(true);
    };
    boot().catch(() => setReady(true));
  }, []);

  const persistSession = useCallback(async (key: string, nextPat: string, nextSettings: AppSettings) => {
    const enc = await encryptAES256(JSON.stringify({ pat: nextPat, settings: nextSettings }), key);
    await SecureStore.setItemAsync(SESSION, enc);
  }, []);

  const setupMaster = useCallback(async (password: string) => {
    const hash = await hashSHA256(password);
    await SecureStore.setItemAsync(MASTER_HASH, hash);
    setInitialized(true);
    setUnlocked(true);
    setMasterKey(hash);
    setContacts([]);
    setPatState('');
    setSettings(defaultSettings);
    await persistSession(hash, '', defaultSettings);
  }, [persistSession]);

  const login = useCallback(async (password: string) => {
    const stored = await SecureStore.getItemAsync(MASTER_HASH);
    if (!stored) return false;
    const hash = await hashSHA256(password);
    if (hash !== stored) return false;
    setMasterKey(hash);

    const session = await SecureStore.getItemAsync(SESSION);
    if (session) {
      const plain = await decryptAES256(session, hash);
      const parsed = JSON.parse(plain) as { pat: string; settings: AppSettings };
      setPatState(parsed.pat ?? '');
      setSettings(parsed.settings ?? defaultSettings);
    }

    const loaded = await LocalDbService.loadContacts(hash);
    setContacts(loaded);
    setUnlocked(true);
    return true;
  }, []);

  const lock = useCallback(() => {
    setUnlocked(false);
    setMasterKey('');
    setPatState('');
    setContacts([]);
  }, []);

  const setPat = useCallback(async (v: string) => {
    if (!masterKey) return;
    setPatState(v);
    await persistSession(masterKey, v, settings);
  }, [masterKey, persistSession, settings]);

  const addContact = useCallback(async (c: Contact) => {
    if (!masterKey) return;
    const next = [...contacts, c];
    setContacts(next);
    await LocalDbService.saveContacts(masterKey, next);
  }, [contacts, masterKey]);

  const replaceContacts = useCallback(async (next: Contact[]) => {
    if (!masterKey) return;
    setContacts(next);
    await LocalDbService.saveContacts(masterKey, next);
  }, [masterKey]);

  const setEdgeMode = useCallback(async (value: boolean) => {
    if (!masterKey) return;
    const next = { edgeMode: value, pollMs: value ? 15000 : 4000 };
    setSettings(next);
    await persistSession(masterKey, pat, next);
  }, [masterKey, pat, persistSession]);

  const value = useMemo(() => ({
    ready,
    initialized,
    unlocked,
    contacts,
    pat,
    settings,
    setupMaster,
    login,
    lock,
    setPat,
    addContact,
    replaceContacts,
    setEdgeMode,
    encryptMessage: (seed: string, plain: string) => encryptAES256(plain, seed),
    decryptMessage: (seed: string, sealed: string) => decryptAES256(sealed, seed)
  }), [ready, initialized, unlocked, contacts, pat, settings, setupMaster, login, lock, setPat, addContact, replaceContacts, setEdgeMode]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used inside VaultProvider');
  return ctx;
};
