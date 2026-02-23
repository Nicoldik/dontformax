import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TerminalButton } from './src/components/TerminalButton';
import { TerminalInput } from './src/components/TerminalInput';
import { VaultProvider, useVault } from './src/providers/VaultProvider';
import { GistService } from './src/services/GistService';
import { ChatMessage, Contact } from './src/types/domain';

type Screen = 'menu' | 'add' | 'chats' | 'chat' | 'settings';

const Main = () => {
  const vault = useVault();
  const [screen, setScreen] = useState<Screen>('menu');
  const [err, setErr] = useState('');

  const [master, setMaster] = useState('');
  const [pat, setPat] = useState('');
  const [contactsGist, setContactsGist] = useState('');

  const [name, setName] = useState('');
  const [gistId, setGistId] = useState('');
  const [seed, setSeed] = useState('');

  const [active, setActive] = useState<Contact | null>(null);
  const [msg, setMsg] = useState('');
  const [rows, setRows] = useState<ChatMessage[]>([]);
  const [plain, setPlain] = useState<Record<string, string>>({});

  const safe = (fn: () => Promise<void>) => fn().catch((e) => setErr(e instanceof Error ? e.message : 'Error'));

  useEffect(() => { setPat(vault.pat); }, [vault.pat]);

  const refresh = useCallback(async () => {
    if (!active || !pat.trim()) return;
    const messages = await GistService.syncMessages(pat.trim(), active.gistId);
    setRows(messages);
    const pairs = await Promise.all(messages.map(async (m) => [m.id, await vault.decryptMessage(active.seed, m.encryptedBody)] as const));
    setPlain(Object.fromEntries(pairs));
  }, [active, pat, vault]);

  useEffect(() => {
    if (screen !== 'chat' || !vault.unlocked) return;
    const t = setInterval(() => { refresh().catch(() => undefined); }, vault.settings.pollMs);
    return () => clearInterval(t);
  }, [refresh, screen, vault.settings.pollMs, vault.unlocked]);

  if (!vault.ready) {
    return <SafeAreaView style={styles.root}><Text style={styles.txt}>BOOT...</Text></SafeAreaView>;
  }

  if (!vault.initialized) {
    return (
      <SafeAreaView style={styles.root}><StatusBar style="light" /><View style={styles.panel}>
        <Text style={styles.title}>SET MASTER PASSWORD</Text>
        <TerminalInput value={master} onChangeText={setMaster} secureTextEntry placeholder="Master Password" />
        <TerminalButton title="CREATE" onPress={() => safe(async () => vault.setupMaster(master))} />
      </View>{err ? <Text style={styles.err}>{err}</Text> : null}</SafeAreaView>
    );
  }

  if (!vault.unlocked) {
    return (
      <SafeAreaView style={styles.root}><StatusBar style="light" /><View style={styles.panel}>
        <Text style={styles.title}>LOGIN</Text>
        <TerminalInput value={master} onChangeText={setMaster} secureTextEntry placeholder="Master Password" />
        <TerminalButton title="ENTER" onPress={() => safe(async () => {
          const ok = await vault.login(master);
          if (!ok) throw new Error('Invalid master password');
        })} />
      </View>{err ? <Text style={styles.err}>{err}</Text> : null}</SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'menu' && <View style={styles.panel}>
        <Text style={styles.title}>MAIN MENU</Text>
        <TerminalInput value={pat} onChangeText={setPat} secureTextEntry placeholder="GitHub PAT" />
        <TerminalInput value={contactsGist} onChangeText={setContactsGist} placeholder="Contacts Gist ID" />
        <TerminalButton title="SAVE PAT" onPress={() => safe(async () => vault.setPat(pat.trim()))} />
        <TerminalButton title="SYNC CONTACTS" onPress={() => safe(async () => vault.replaceContacts(await GistService.syncContacts(pat.trim(), contactsGist.trim())))} />
        <TerminalButton title="PUSH CONTACTS" onPress={() => safe(async () => setContactsGist(await GistService.saveContacts(pat.trim(), vault.contacts, contactsGist || null)))} />
        <TerminalButton title="CHATS" onPress={() => setScreen('chats')} />
        <TerminalButton title="ADD CONTACT" onPress={() => setScreen('add')} />
        <TerminalButton title="SETTINGS" onPress={() => setScreen('settings')} />
        <TerminalButton title="LOCK" onPress={vault.lock} />
      </View>}

      {screen === 'add' && <View style={styles.panel}>
        <Text style={styles.title}>ADD CONTACT</Text>
        <TerminalInput value={name} onChangeText={setName} placeholder="Name" />
        <TerminalInput value={gistId} onChangeText={setGistId} placeholder="Gist ID" />
        <TerminalInput value={seed} onChangeText={setSeed} placeholder="Seed (any string)" />
        <TerminalButton title="SAVE" onPress={() => safe(async () => {
          await vault.addContact({ id: `${Date.now()}`, name, gistId, seed, createdAt: new Date().toISOString() });
          setName(''); setGistId(''); setSeed(''); setScreen('menu');
        })} />
        <TerminalButton title="BACK" onPress={() => setScreen('menu')} />
      </View>}

      {screen === 'settings' && <View style={styles.panel}>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.row}><Text style={styles.txt}>2G/EDGE MODE</Text><Switch value={vault.settings.edgeMode} onValueChange={(v) => safe(async () => vault.setEdgeMode(v))} trackColor={{ true: '#013014', false: '#333333' }} thumbColor="#00FF41" /></View>
        <Text style={styles.txt}>Polling: {vault.settings.pollMs}ms</Text>
        <TerminalButton title="BACK" onPress={() => setScreen('menu')} />
      </View>}

      {screen === 'chats' && <View style={styles.panel}>
        <Text style={styles.title}>CHATS</Text>
        <FlatList data={vault.contacts} keyExtractor={(i) => i.id} renderItem={({ item }) => <TerminalButton title={`OPEN ${item.name}`} onPress={() => { setActive(item); setScreen('chat'); safe(refresh); }} />} ListEmptyComponent={<Text style={styles.txt}>No contacts</Text>} />
        <TerminalButton title="BACK" onPress={() => setScreen('menu')} />
      </View>}

      {screen === 'chat' && active && <View style={styles.panel}>
        <Text style={styles.title}>CHAT :: {active.name}</Text>
        <TerminalButton title="REFRESH" onPress={() => safe(refresh)} />
        <ScrollView style={styles.scroll}>{rows.map((r) => <View key={r.id} style={styles.msg}><Text style={styles.small}>{r.from}</Text><Text style={styles.txt}>{plain[r.id] ?? '...'}</Text></View>)}</ScrollView>
        <TerminalInput value={msg} onChangeText={setMsg} placeholder="Message" multiline />
        <TerminalButton title="SEND" onPress={() => safe(async () => {
          const next: ChatMessage = { id: `${Date.now()}`, from: 'me', encryptedBody: await vault.encryptMessage(active.seed, msg), createdAt: new Date().toISOString() };
          await GistService.sendMessage(pat.trim(), active.gistId, next, rows);
          setMsg('');
          await refresh();
        })} />
        <TerminalButton title="BACK" onPress={() => setScreen('chats')} />
      </View>}

      {err ? <Text style={styles.err}>ERR: {err}</Text> : null}
    </SafeAreaView>
  );
};

export default function App() { return <VaultProvider><Main /></VaultProvider>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', padding: 16 },
  panel: { flex: 1, borderWidth: 1, borderColor: '#00FF41', backgroundColor: '#000000', padding: 12 },
  title: { color: '#00FF41', fontFamily: 'monospace', fontSize: 17, marginBottom: 10 },
  txt: { color: '#00FF41', fontFamily: 'monospace', fontSize: 13 },
  small: { color: '#00FF41', fontFamily: 'monospace', fontSize: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#00FF41', padding: 8, marginBottom: 8 },
  scroll: { flex: 1, marginVertical: 8 },
  msg: { borderWidth: 1, borderColor: '#00FF41', padding: 8, marginBottom: 8 },
  err: { color: '#00FF41', fontFamily: 'monospace', borderWidth: 1, borderColor: '#00FF41', padding: 8, marginTop: 8 }
});
