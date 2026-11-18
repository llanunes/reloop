import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import type { EcoPoint } from './data/ecopoints';

// Sessão em memória. Sem backend, as contas e o saldo somem quando o app é fechado.
export type Role = 'user' | 'admin';
export type User = { name: string; email: string; cpf: string; role: Role };
type Account = User & { password: string };

export type Disposal = {
  /** Identifica cada leitura de QR code, para limpar o formulário a cada novo descarte. */
  id: number;
  point: EcoPoint;
  deviceId: string;
  itemName?: string;
  model?: string;
  quantity?: number;
  points?: number;
  photoUri?: string;
};

const seedAccounts: Account[] = [
  { name: 'Administrador ReLoop', email: 'admin@reloop.com', cpf: '00000000000', password: 'admin123', role: 'admin' },
  { name: 'Usuário Demo', email: 'demo@reloop.com', cpf: '11111111111', password: 'demo123', role: 'user' },
];

/** Um benefício resgatado (histórico mostrado no filtro "Resgatados"). */
export type Redemption = { id: number; rewardId: string; title: string; points: number; date: Date };

type SessionValue = {
  user: User | null;
  isAdmin: boolean;
  balance: number;
  disposal: Disposal | null;
  login: (email: string, password: string) => string | null;
  register: (data: Omit<Account, 'role'>) => string | null;
  logout: () => void;
  startDisposal: (point: EcoPoint, deviceId: string) => void;
  updateDisposal: (patch: Partial<Disposal>) => void;
  completeDisposal: () => number;
  redemptions: Redemption[];
  redeem: (reward: { id: string; title: string; points: number }) => boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(10000);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [disposal, setDisposal] = useState<Disposal | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      balance,
      disposal,
      login(email, password) {
        const account = accounts.find((a) => a.email === email.trim().toLowerCase());
        if (!account || account.password !== password) return 'E-mail ou senha incorretos.';
        const { password: _omit, ...publicUser } = account;
        setUser(publicUser);
        return null;
      },
      register(data) {
        const email = data.email.trim().toLowerCase();
        if (accounts.some((a) => a.email === email)) return 'Já existe uma conta com este e-mail.';
        if (accounts.some((a) => a.cpf === data.cpf)) return 'Já existe uma conta com este CPF.';
        const account: Account = { ...data, email, role: 'user' };
        setAccounts((current) => [...current, account]);
        const { password: _omit, ...publicUser } = account;
        setUser(publicUser);
        return null;
      },
      logout() {
        setUser(null);
        setDisposal(null);
      },
      startDisposal(point, deviceId) {
        setDisposal({ id: Date.now(), point, deviceId });
      },
      updateDisposal(patch) {
        setDisposal((current) => (current ? { ...current, ...patch } : current));
      },
      completeDisposal() {
        const earned = disposal?.points ?? 0;
        setBalance((current) => current + earned);
        setDisposal(null);
        return earned;
      },
      redemptions,
      redeem(reward) {
        if (balance < reward.points) return false;
        setBalance((current) => current - reward.points);
        // Mais recente primeiro.
        setRedemptions((current) => [{ id: Date.now(), rewardId: reward.id, title: reward.title, points: reward.points, date: new Date() }, ...current]);
        return true;
      },
    }),
    [accounts, user, balance, disposal, redemptions],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return ctx;
}
